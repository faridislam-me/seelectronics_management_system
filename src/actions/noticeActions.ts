"use server";

import { db } from "@/db/drizzle";
import { customers, noticeRecipients, notices, staffs } from "@/db/schema";
import { pushToUsers } from "@/lib/push";
import { sendEmail, verifySession } from "@/lib";
import { NoticeType } from "@/types";
import { generateRandomId } from "@/utils";
import { NoticeSchema } from "@/validationSchemas";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const createNotice = async (data: z.input<typeof NoticeSchema>) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const validatedData = NoticeSchema.parse(data);
    const noticeId = generateRandomId();

    const [newNotice] = await db
      .insert(notices)
      .values({
        noticeId,
        title: validatedData.title,
        content: validatedData.content,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        audience: validatedData.audience,
        isDraft: validatedData.isDraft,
        scheduledAt: validatedData.scheduledAt,
        expiresAt: validatedData.expiresAt,
        createdBy: session.userId as any,
      })
      .returning();

    // If not a draft and scheduled for now (or not scheduled), dispatch immediately
    if (!validatedData.isDraft && (!validatedData.scheduledAt || validatedData.scheduledAt <= new Date())) {
      await dispatchNotice(newNotice.id, validatedData.targetType, validatedData.recipientIds, validatedData.audience);
    }

    revalidatePath("/(dashboard)/notices");
    return { success: true, message: "Notice created successfully", data: newNotice };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not create notice" };
  }
};

export const updateNotice = async (id: string, data: z.input<typeof NoticeSchema>) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const validatedData = NoticeSchema.parse(data);

    const [updatedNotice] = await db
      .update(notices)
      .set({
        title: validatedData.title,
        content: validatedData.content,
        priority: validatedData.priority,
        targetType: validatedData.targetType,
        audience: validatedData.audience,
        isDraft: validatedData.isDraft,
        scheduledAt: validatedData.scheduledAt,
        expiresAt: validatedData.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, id))
      .returning();

    // If it was a draft and now it's published and scheduled for now, dispatch
    // Note: This logic might need to be more sophisticated to avoid double dispatching
    // For simplicity, we can check if noticeRecipients already exist for this notice
    const existingRecipients = await db.query.noticeRecipients.findFirst({
        where: eq(noticeRecipients.noticeId, id)
    });

    if (!validatedData.isDraft && !existingRecipients && (!validatedData.scheduledAt || validatedData.scheduledAt <= new Date())) {
        await dispatchNotice(updatedNotice.id, validatedData.targetType, validatedData.recipientIds, validatedData.audience);
    }

    revalidatePath("/(dashboard)/notices");
    return { success: true, message: "Notice updated successfully", data: updatedNotice };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update notice" };
  }
};

export const deleteNotice = async (id: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    await db.delete(notices).where(eq(notices.id, id));

    revalidatePath("/(dashboard)/notices");
    return { success: true, message: "Notice deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete notice" };
  }
};

export const getNotices = async () => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db.query.notices.findMany({
      orderBy: [desc(notices.createdAt)],
      with: {
        recipients: {
            with: {
                staff: {
                    columns: {
                        name: true,
                        staffId: true
                    }
                },
                customer: {
                    columns: {
                        name: true,
                        customerId: true
                    }
                }
            }
        },
        creator: {
            columns: {
                username: true
            }
        }
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch notices" };
  }
};

export const getStaffNotices = async () => {
  try {
    const session = await verifySession(false, "staff");
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db
      .select({
        id: noticeRecipients.id,
        noticeId: noticeRecipients.noticeId,
        staffId: noticeRecipients.staffId,
        customerId: noticeRecipients.customerId,
        isRead: noticeRecipients.isRead,
        readAt: noticeRecipients.readAt,
        isAcknowledged: noticeRecipients.isAcknowledged,
        acknowledgedAt: noticeRecipients.acknowledgedAt,
        createdAt: noticeRecipients.createdAt,
        notice: notices,
      })
      .from(noticeRecipients)
      .leftJoin(notices, eq(noticeRecipients.noticeId, notices.id))
      .where(eq(noticeRecipients.staffId, session.userId as string))
      .orderBy(desc(noticeRecipients.createdAt));


    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch notifications" };
  }
};
export const getCustomerNotices = async () => {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db
      .select({
        id: noticeRecipients.id,
        noticeId: noticeRecipients.noticeId,
        staffId: noticeRecipients.staffId,
        customerId: noticeRecipients.customerId,
        isRead: noticeRecipients.isRead,
        readAt: noticeRecipients.readAt,
        isAcknowledged: noticeRecipients.isAcknowledged,
        acknowledgedAt: noticeRecipients.acknowledgedAt,
        createdAt: noticeRecipients.createdAt,
        notice: notices,
      })
      .from(noticeRecipients)
      .leftJoin(notices, eq(noticeRecipients.noticeId, notices.id))
      .where(eq(noticeRecipients.customerId, session.userId as string))
      .orderBy(desc(noticeRecipients.createdAt));


    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch notifications" };
  }
};

export const markNoticeAsRead = async (recipientId: string) => {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    if (session.role === "staff") {
      await db
        .update(noticeRecipients)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(noticeRecipients.id, recipientId),
            eq(noticeRecipients.staffId, session.userId as string)
          )
        );
      revalidatePath("/staff/profile");
    } else if (session.role === "customer") {
      await db
        .update(noticeRecipients)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(noticeRecipients.id, recipientId),
            eq(noticeRecipients.customerId, session.userId as string)
          )
        );
      revalidatePath("/customer/profile");
    }

    return { success: true, message: "Marked as read" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update notification" };
  }
};

export const acknowledgeNotice = async (recipientId: string) => {
    try {
      const session = await verifySession(false, "staff");
      if (!session) return { success: false, message: "Unauthorized" };
  
      await db
        .update(noticeRecipients)
        .set({
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(noticeRecipients.id, recipientId),
            eq(noticeRecipients.staffId, session.userId as string)
          )
        );
  
      revalidatePath("/staff/profile");
      return { success: true, message: "Acknowledged" };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Could not acknowledge notice" };
    }
};

const plainText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

async function dispatchNotice(
    noticeInternalId: string,
    targetType: string,
    recipientIds?: string[],
    audience: "staff" | "technician" | "electrician" | "customer" = "staff",
) {
    const notice = await db.query.notices.findFirst({
        where: eq(notices.id, noticeInternalId)
    });

    if (!notice) return;

    const pushBody = plainText(notice.content).slice(0, 140);

    // ---- Customers: every customer, or the picked ones ----
    if (audience === "customer") {
        const rows = targetType === "all"
            ? await db.select({ customerId: customers.customerId }).from(customers)
            : recipientIds && recipientIds.length > 0
                ? await db.select({ customerId: customers.customerId }).from(customers).where(inArray(customers.customerId, recipientIds))
                : [];
        if (!rows.length) return;
        for (let i = 0; i < rows.length; i += 500) {
            await db.insert(noticeRecipients).values(
                rows.slice(i, i + 500).map((c) => ({ noticeId: noticeInternalId, customerId: c.customerId })),
            );
        }
        await pushToUsers("customer", rows.map((c) => c.customerId), { title: notice.title, body: pushBody, link: "/customer/profile" });
        return;
    }

    // ---- Staff: all active staff, only technicians / electricians, or the picked ones ----
    let targetStaff: { staffId: string, name: string, phone: string, username: string | null }[] = [];

    if (targetType === "all") {
        const roleFilter = audience === "technician" ? eq(staffs.role, "technician") : audience === "electrician" ? eq(staffs.role, "electrician") : undefined;
        targetStaff = await db.query.staffs.findMany({
            where: roleFilter ? and(eq(staffs.isActiveStaff, true), roleFilter) : eq(staffs.isActiveStaff, true),
            columns: { staffId: true, name: true, phone: true, username: true }
        });
    } else if (recipientIds && recipientIds.length > 0) {
        targetStaff = await db.query.staffs.findMany({
            where: inArray(staffs.staffId, recipientIds),
            columns: { staffId: true, name: true, phone: true, username: true }
        });
    }

    if (targetStaff.length > 0) {
        const values = targetStaff.map(s => ({
            noticeId: noticeInternalId,
            staffId: s.staffId,
        }));
        await db.insert(noticeRecipients).values(values);

        await pushToUsers("staff", targetStaff.map((s) => s.staffId), { title: notice.title, body: pushBody, link: "/staff/profile" });

        // Send emails/SMS for high/urgent priority notices
        if (notice.priority === "high" || notice.priority === "urgent") {
            const emailPromises = targetStaff
                .filter(s => s.username && s.username.includes('@'))
                .map(s => 
                    sendEmail({
                        from: "SE Electronics <noreply@seelectronics.com>",
                        to: s.username!,
                        subject: `[${notice.priority.toUpperCase()}] ${notice.title}`,
                        text: `${notice.title}\n\n${notice.content}\n\nPlease acknowledge this notice in your staff dashboard.`
                    }).catch(e => console.error(`Email delivery failed for ${s.username}`, e))
                );
            
            await Promise.all(emailPromises);
        }
    }
}



/** Admin: find customers by name, phone or ID to pick them as notice recipients. */
export const searchCustomersForNotice = async (query: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false as const, data: [] as { customerId: string; name: string; phone: string }[] };
    const q = (query || "").trim();
    if (q.length < 2) return { success: true as const, data: [] as { customerId: string; name: string; phone: string }[] };
    const like = `%${q}%`;
    const data = await db
      .select({ customerId: customers.customerId, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(or(ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.customerId, like)))
      .limit(15);
    return { success: true as const, data };
  } catch (error) {
    console.error("searchCustomersForNotice failed:", error);
    return { success: false as const, data: [] as { customerId: string; name: string; phone: string }[] };
  }
};
