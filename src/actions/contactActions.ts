"use server";

import { db } from "@/db/drizzle";
import { adminNotifications, contactMessages, customers } from "@/db/schema";
import { sendSMS, verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MessageSchema = z.object({
  customerId: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
});

/**
 * Short SMS to the admin/support number (ADMIN_PHONE_NUMBER, as used by the
 * service and payment-request alerts) when a customer writes in chat support.
 * Throttled: only the first message of a burst triggers it — skipped when the
 * customer already has another unreplied message from the last 30 minutes.
 * Never throws; SMS problems must not block saving the message.
 */
async function notifyAdminOfChatMessage(customerId: string, newMessageId: string) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (!adminPhone) return;
    const { and, eq, gt, isNull, ne } = await import("drizzle-orm");
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recentPending = await db.query.contactMessages.findFirst({
      where: and(
        eq(contactMessages.customerId, customerId),
        ne(contactMessages.messageId, newMessageId),
        isNull(contactMessages.adminReply),
        gt(contactMessages.createdAt, since),
      ),
      columns: { messageId: true },
    });
    if (recentPending) return;
    await sendSMS(adminPhone, `SE Electronics: কাস্টমার ${customerId} চ্যাট সাপোর্টে নতুন মেসেজ দিয়েছে। ড্যাশবোর্ডে দেখুন।`);
  } catch (error) {
    console.error("Admin chat SMS failed:", error);
  }
}

export async function sendContactMessage(_prevState: any, formData: FormData) {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };
    const rawData = Object.fromEntries(formData);
    const validated = MessageSchema.parse(rawData);

    const messageId = generateRandomId();
    await db.insert(contactMessages).values({
      messageId,
      ...validated,
      // Always file the message under the logged-in customer, never a client-sent id.
      customerId: session.userId as string,
    });
    await notifyAdminOfChatMessage(session.userId as string, messageId);

    revalidatePath("/customer/profile");
    return { success: true, message: "Message sent! Admin will respond soon." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return { success: false, message: "Please fill all required fields." };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}

export async function getContactMessagesByCustomer(customerId: string) {
  try {
    const data = await db.query.contactMessages.findMany({
      where: (messages, { eq }) => eq(messages.customerId, customerId),
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch messages" };
  }
}

export async function getAllContactMessages() {
  try {
    const data = await db.query.contactMessages.findMany({
      with: {
        customer: true,
      },
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch messages" };
  }
}

export async function replyToMessage(
  messageId: string,
  adminReply: string,
  options?: { sendSms?: boolean },
) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const { eq } = await import("drizzle-orm");
    await db
      .update(contactMessages)
      .set({
        adminReply,
        isRead: true,
        updatedAt: new Date(),
      })
      .where(eq(contactMessages.messageId, messageId));

    // Optionally deliver the reply to the customer's phone as an SMS too.
    let smsNote = "";
    if (options?.sendSms) {
      try {
        const msg = await db.query.contactMessages.findFirst({
          where: eq(contactMessages.messageId, messageId),
          with: { customer: { columns: { phone: true } } },
        });
        const phone = (msg as any)?.customer?.phone as string | undefined;
        if (phone) {
          // Short notice only (SMS cost): the full reply is read inside the app.
          await sendSMS(phone, "SE Electronics: সাপোর্ট টিম থেকে আপনার মেসেজের রিপ্লাই দেওয়া হয়েছে। অ্যাপে দেখুন।");
          smsNote = " (SMS sent)";
        } else {
          smsNote = " (no customer phone for SMS)";
        }
      } catch (smsError) {
        console.error(smsError);
        smsNote = " (SMS failed)";
      }
    }

    revalidatePath("/messages");
    revalidatePath("/customer/chat-support");
    return { success: true, message: "Reply sent successfully" + smsNote };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not send reply" };
  }
}

/** Chat thread of the logged-in customer (oldest first). */
export async function getMyContactMessages() {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized", data: [] };
    const data = await db.query.contactMessages.findMany({
      where: (messages, { eq }) => eq(messages.customerId, session.userId as string),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      columns: { messageId: true, message: true, adminReply: true, createdAt: true, updatedAt: true },
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch messages", data: [] };
  }
}

/** Send a chat message as the logged-in customer. */
export async function sendMyChatMessage(text: string) {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };
    const message = (text || "").trim();
    if (!message) return { success: false, message: "Please write a message." };
    if (message.length > 1000) return { success: false, message: "Message is too long." };

    const customerId = session.userId as string;
    const messageId = generateRandomId();
    await db.insert(contactMessages).values({ messageId, customerId, subject: "Chat Support", message });

    const { eq } = await import("drizzle-orm");
    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      columns: { name: true },
    });
    await db.insert(adminNotifications).values({
      type: "message",
      message: `New chat message from ${customer?.name || customerId}: ${message.slice(0, 80)}`,
      link: "/messages",
    });

    await notifyAdminOfChatMessage(customerId, messageId);

    revalidatePath("/messages");
    return { success: true, message: "Message sent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}

/**
 * Admin reply to a customer's whole chat thread: answers the latest unreplied
 * message (via replyToMessage, which also sends the short customer SMS when
 * asked) and marks the customer's older unreplied messages as read without
 * touching their (empty) adminReply.
 */
export async function replyToCustomerThread(
  customerId: string,
  adminReply: string,
  options?: { sendSms?: boolean },
) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const reply = (adminReply || "").trim();
    if (!reply) return { success: false, message: "Please provide a reply" };

    const { and, desc, eq, isNull, ne } = await import("drizzle-orm");
    const latest = await db.query.contactMessages.findFirst({
      // Only messages still waiting (older ones of a burst are marked read when answered).
      where: and(eq(contactMessages.customerId, customerId), isNull(contactMessages.adminReply), eq(contactMessages.isRead, false)),
      orderBy: [desc(contactMessages.createdAt)],
      columns: { messageId: true },
    });
    if (!latest) return { success: false, message: "No unanswered message from this customer" };

    const res = await replyToMessage(latest.messageId, reply, options);
    if (!res.success) return res;

    await db
      .update(contactMessages)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(contactMessages.customerId, customerId),
          isNull(contactMessages.adminReply),
          ne(contactMessages.messageId, latest.messageId),
        ),
      );

    revalidatePath("/messages");
    return res;
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not send reply" };
  }
}
