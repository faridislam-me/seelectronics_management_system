"use server";

import { db } from "@/db/drizzle";
import { customers } from "@/db/schema";
import { verifySession } from "@/lib";
import { getMramBroadcastIds, sendVoiceCall } from "@/lib/mram";
import { sendSMS } from "@/lib/sms";
import { eq, inArray } from "drizzle-orm";

const VOICE_SMS_ACTIONS: Record<number, { label: string; sms: string }> = {
  3316: {
    label: "কিস্তির টাকা তারিখ পার হবার আগে জরিমানা এড়াতে",
    sms: "প্রিয় গ্রাহক {name} জরিমানা এরাতে চলতি মাসের কিস্তির টাকা পরিশোধ করুন । এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
  3315: {
    label: "কিস্তির টাকা বিকাশ/নগদে পরিশোধ করতে",
    sms: "প্রিয় গ্রাহক {name} আপনার চলতি মাসের কিস্তির টাকা bKash nagad rocket পরিশোধ করতে অনুরোধ করা হল এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
  1527: {
    label: "আইপিএসের বকেয়া টাকা পরিশোধ করতে",
    sms: "প্রিয় গ্রাহক {name} IPS এর বকেয়া টাকা পরিশোধ করতে অনুরোধ করা হল এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
  1526: {
    label: "আইপিএস ও ব্যাটারি প্যাকেজের টাকা পরিশোধ করতে",
    sms: "প্রিয় গ্রাহক {name}  IPS,Battery টাকা পরিশোধ করতে অনুরোধ করা হল এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
  3519: {
    label: "দীর্ঘদিন বকেয়া টাকা পরিশোধ না করায় ওয়ারেন্টি বাতিল",
    sms: "প্রিয় গ্রাহক {name} দীর্ঘদিন বকেয়া টাকা পরিশোধ না করায় আপনার পন্যের ওয়ারেন্টি বাতিল করেছে, এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
  3520: {
    label: "ওয়ারেন্টি বাতিল ঝামেলা এড়াতে বকেয়া টাকা পরিশোধ করুন",
    sms: "প্রিয় গ্রাহক {name} ওয়ারেন্টি বাতিল ঝামেলা এরাতে বকেয়া টাকা পরিশোধ করুন, এস ই ইলেকট্রনিক্স কর্তৃপক্ষ বিস্তারিত জানতে 09649355555, 09639673600",
  },
};

export const sendCustomerVoiceAndSms = async (
  customerId: string,
  actionId: number,
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const customerData = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
    });

    if (!customerData || !customerData.phone) {
      return { success: false, message: "Customer phone number not found" };
    }

    const actionData = VOICE_SMS_ACTIONS[actionId];
    if (!actionData) {
      return { success: false, message: "Invalid action ID" };
    }

    const smsMessage = actionData.sms.replace(
      "{name}",
      customerData.name || "Customer",
    );

    // Trigger both concurrently
    const [voiceRes, smsRes] = await Promise.allSettled([
      sendVoiceCall(
        customerData.phone,
        actionId,
        `Customer Action ${actionId}`,
      ),
      sendSMS(customerData.phone, smsMessage),
    ]);

    let message = "Action completed.";
    let success = true;

    if (
      voiceRes.status === "rejected" ||
      (voiceRes.status === "fulfilled" && !voiceRes.value.success)
    ) {
      message += " Voice call failed.";
      success = false;
    } else {
      message += " Voice call sent.";
    }

    if (smsRes.status === "rejected") {
      message += " SMS failed.";
      success = false;
    } else {
      message += " SMS sent.";
    }

    return { success, message };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const sendDueVoiceCall = async (customerId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const customerData = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
    });

    if (!customerData || !customerData.phone) {
      return { success: false, message: "Customer phone number not found" };
    }

    const broadcastIds = getMramBroadcastIds();
    if (!broadcastIds || !broadcastIds.customer_due) {
      return {
        success: false,
        message: "Broadcast ID for customer due not configured",
      };
    }

    const res = await sendVoiceCall(
      customerData.phone,
      broadcastIds.customer_due,
      "Customer Due Reminder",
    );

    if (res.success) {
      return { success: true, message: "Voice call triggered successfully" };
    } else {
      return {
        success: false,
        message: res.error || "Failed to trigger voice call",
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const sendBulkVoiceCallToSelected = async (
  customerIds: string[],
  type: "battery_health_check" | "overall_maintenance",
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    if (!customerIds.length) {
      return { success: false, message: "No customers selected" };
    }

    const customersData = await db.query.customers.findMany({
      where: inArray(customers.customerId, customerIds),
      columns: { phone: true },
    });

    const phones = customersData.map((c) => c.phone).filter(Boolean);
    if (!phones.length) {
      return { success: false, message: "No valid phone numbers found" };
    }

    const broadcastIds = getMramBroadcastIds();
    if (!broadcastIds || !broadcastIds[type]) {
      return {
        success: false,
        message: `Broadcast ID for ${type} not configured`,
      };
    }

    const titleType =
      type === "battery_health_check"
        ? "Battery Health Check"
        : "Overall Maintenance";
    const res = await sendVoiceCall(
      phones,
      broadcastIds[type],
      `Bulk ${titleType} Reminder`,
    );

    if (res.success) {
      return {
        success: true,
        message: `Sent voice call to ${phones.length} customers`,
      };
    } else {
      return {
        success: false,
        message: res.error || "Failed to send bulk voice calls",
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const sendBulkVoiceCallToAll = async (
  type: "battery_health_check" | "overall_maintenance",
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const customersData = await db.query.customers.findMany({
      columns: { phone: true },
    });

    const phones = customersData.map((c) => c.phone).filter(Boolean);
    if (!phones.length) {
      return { success: false, message: "No valid phone numbers found" };
    }

    const broadcastIds = getMramBroadcastIds();
    if (!broadcastIds || !broadcastIds[type]) {
      return {
        success: false,
        message: `Broadcast ID for ${type} not configured`,
      };
    }

    // Split into chunks if there are too many (e.g. MRAM might have limit like 1000)
    // The documentation says 1-1000 numbers per request
    const chunks = [];
    for (let i = 0; i < phones.length; i += 1000) {
      chunks.push(phones.slice(i, i + 1000));
    }

    let successCount = 0;
    let mockedCount = 0;
    let failedChunkCount = 0;
    const titleType =
      type === "battery_health_check"
        ? "Battery Health Check"
        : "Overall Maintenance";
    for (const chunk of chunks) {
      const res = await sendVoiceCall(
        chunk,
        broadcastIds[type],
        `Bulk ${titleType} Reminder`,
      );
      if (res.success) {
        if (res.mocked) mockedCount += chunk.length;
        else successCount += chunk.length;
      } else {
        failedChunkCount++;
        console.error("Failed to send to chunk:", res.error);
      }
    }

    return {
      success: failedChunkCount === 0 && (successCount > 0 || mockedCount > 0),
      message:
        mockedCount > 0
          ? `Voice call simulation completed for ${mockedCount} customers. Configure MRAM to send real calls.`
          : `Sent voice call to ${successCount} customers${failedChunkCount ? `; ${failedChunkCount} batch(es) failed.` : "."}`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

/**
 * Admin types any MRAM voice broadcast ID and sends it to the selected customers
 * (the existing buttons only cover the pre-set broadcasts).
 */
export const sendCustomVoiceCallToSelected = async (customerIds: string[], broadcastId: number) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const id = Number(broadcastId);
    if (!Number.isInteger(id) || id <= 0 || id > 999999999) {
      return { success: false, message: "সঠিক ভয়েস আইডি নম্বর দিন" };
    }
    if (!customerIds.length) return { success: false, message: "No customers selected" };

    // 1-1000 numbers per MRAM request; keep the DB lookup in chunks too.
    const phones: string[] = [];
    for (let i = 0; i < customerIds.length; i += 1000) {
      const rows = await db.query.customers.findMany({
        where: inArray(customers.customerId, customerIds.slice(i, i + 1000)),
        columns: { phone: true },
      });
      for (const r of rows) if (r.phone) phones.push(r.phone);
    }
    if (!phones.length) return { success: false, message: "No valid phone numbers found" };

    let sent = 0;
    let mocked = 0;
    let failedChunks = 0;
    let skipped = 0;
    let lastError = "";
    for (let i = 0; i < phones.length; i += 1000) {
      const chunk = phones.slice(i, i + 1000);
      const res = await sendVoiceCall(chunk, id, `Custom Voice ${id}`);
      skipped += (res as { skipped?: number }).skipped ?? 0;
      if (res.success) {
        const validCount = chunk.length - ((res as { skipped?: number }).skipped ?? 0);
        if ((res as { mocked?: boolean }).mocked) mocked += validCount;
        else sent += validCount;
      } else {
        failedChunks++;
        lastError = (res as { error?: string }).error || "";
        console.error("Custom voice chunk failed:", lastError);
      }
    }

    if (failedChunks > 0 && sent === 0 && mocked === 0) {
      return { success: false, message: lastError || "ভয়েস কল পাঠানো যায়নি" };
    }
    return {
      success: failedChunks === 0,
      message:
        mocked > 0
          ? `ভয়েস কল সিমুলেশন হয়েছে (${mocked} জন), আসল কল পাঠাতে MRAM সেট করুন।`
          : `ভয়েস আইডি ${id} দিয়ে ${sent} জনকে কল পাঠানো হয়েছে${skipped ? `; ভুল নম্বরের ${skipped} জন বাদ গেছে` : ""}${failedChunks ? `; ${failedChunks} টি ব্যাচ ব্যর্থ` : ""}।`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};
