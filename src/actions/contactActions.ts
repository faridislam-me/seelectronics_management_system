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

export async function sendContactMessage(_prevState: any, formData: FormData) {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };
    const rawData = Object.fromEntries(formData);
    const validated = MessageSchema.parse(rawData);

    await db.insert(contactMessages).values({
      messageId: generateRandomId(),
      ...validated,
      // Always file the message under the logged-in customer, never a client-sent id.
      customerId: session.userId as string,
    });

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
          await sendSMS(phone, `SE Electronics Support: ${adminReply}`.slice(0, 480));
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

    revalidatePath("/messages");
    return { success: true, message: "Message sent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}
