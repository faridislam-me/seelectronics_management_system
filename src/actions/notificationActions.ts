"use server";

import { db } from "@/db/drizzle";
import { customerNotifications, staffNotifications } from "@/db/schema";
import { sendSMS } from "@/lib";
import { pushToUser } from "@/lib/push";
import { generateUrl } from "@/utils";
import { revalidatePath } from "next/cache";
import { and, gt, sql } from "drizzle-orm";

/**
 * Creates a notification and sends a shortened SMS to a customer
 */
export async function notifyCustomer({
  customerId,
  phoneNumber,
  type,
  message,
  shortMessage,
  link,
}: {
  customerId: string;
  phoneNumber: string;
  type: string;
  message: string;
  shortMessage?: string;
  link?: string;
}) {
  try {
    // Check if a similar notification was sent in the last 30 seconds to prevent duplicates
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentNotification = await db.query.customerNotifications.findFirst({
      where: and(
        gt(customerNotifications.createdAt, thirtySecondsAgo),
        sql`${customerNotifications.type} = ${type}`,
        sql`${customerNotifications.customerId} = ${customerId}`
      ),
    });

    if (recentNotification) {
      console.log(`Recent notification of type ${type} found, skipping duplicate SMS to ${phoneNumber}`);
      // Still create the notification in DB for consistency
      await db.insert(customerNotifications).values({
        customerId,
        type,
        message,
        link,
      });
      return { success: true };
    }

    // 1. Create notification in database
    await db.insert(customerNotifications).values({
      customerId,
      type,
      message,
      link,
    });

    // Push to the customer's phone app (no-op when push is not configured)
    await pushToUser("customer", customerId, { title: "SE Electronics", body: (shortMessage || message).slice(0, 160), link });

    // 2. Send SMS
    const smsContent = message || `প্রিয় গ্রাহক, আপনার ড্যাশবোর্ডে একটি নতুন বার্তা আছে। বিস্তারিত দেখুন: ${generateUrl("customer-login", {})}`;
    
    await sendSMS(phoneNumber, smsContent);

    revalidatePath("/customer/profile");
    return { success: true };
  } catch (error) {
    console.error("Error in notifyCustomer:", error);
    return { success: false, error };
  }
}

/**
 * Creates a notification and sends a shortened SMS to a staff member
 */
export async function notifyStaff({
  staffId,
  phoneNumber,
  type,
  message,
  shortMessage,
  link,
}: {
  staffId: string;
  phoneNumber: string;
  type: string;
  message: string;
  shortMessage?: string;
  link?: string;
}) {
  try {
    // Check if a similar notification was sent in the last 30 seconds to prevent duplicates
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentNotification = await db.query.staffNotifications.findFirst({
      where: and(
        gt(staffNotifications.createdAt, thirtySecondsAgo),
        sql`${staffNotifications.type} = ${type}`,
        sql`${staffNotifications.staffId} = ${staffId}`
      ),
    });

    if (recentNotification) {
      console.log(`Recent notification of type ${type} found, skipping duplicate SMS to ${phoneNumber}`);
      // Still create the notification in DB for consistency
      await db.insert(staffNotifications).values({
        staffId,
        type,
        message,
        link,
      });
      return { success: true };
    }

    // 1. Create notification in database
    await db.insert(staffNotifications).values({
      staffId,
      type,
      message,
      link,
    });

    await pushToUser("staff", staffId, { title: "SE Electronics", body: (shortMessage || message).slice(0, 160), link });

    // 2. Send SMS
    const smsContent = shortMessage || message || `Dear Staff, you have a new notification. Check your portal for details.`;
    
    await sendSMS(phoneNumber, smsContent);

    revalidatePath("/staff/profile");
    return { success: true };
  } catch (error) {
    console.error("Error in notifyStaff:", error);
    return { success: false, error };
  }
}

/**
 * Creates a notification for the admin
 */
export async function notifyAdmin({
  type,
  message,
  link,
}: {
  type: string;
  message: string;
  link?: string;
}) {
  try {
    const { adminNotifications } = await import("@/db/schema");
    
    // Create notification in database
    await db.insert(adminNotifications).values({
      type,
      message,
      link,
    });

    revalidatePath("/(dashboard)");
    return { success: true };
  } catch (error) {
    console.error("Error in notifyAdmin:", error);
    return { success: false, error };
  }
}
