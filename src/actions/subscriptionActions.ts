"use server";

import { ApplicationMessages, SubscriptionServiceMessages } from "@/constants/messages";
import {
  discounts,
  subscriptionPlans,
  voltSurcharges,
} from "@/constants/subscription-plans";
import { db } from "@/db/drizzle";
import { applications, subscriptions } from "@/db/schema";
import { sendSMS, verifySession } from "@/lib";
import { SearchParams } from "@/types";
import { generateRandomId, generateUrl, renderText } from "@/utils";
import { SubscriptionDataSchema } from "@/validationSchemas";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError, flattenError } from "zod";
import { createApplication } from "./applicationActions";

export const getSubscriptionPrices = async () => {
  return subscriptionPlans;
};

export const getSubscribers = async ({
  query,
  page = "1",
  limit = "20",
}: SearchParams) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const q = `%${query}%`;
    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const subscribersData = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.isActive, true),
        query
          ? or(
            ilike(subscriptions.subscriptionId, q),
            ilike(subscriptions.name, q),
            ilike(subscriptions.phone, q),
            ilike(subscriptions.district, q),
          )
          : undefined,
      ),
      limit: limit ? Number(limit) : undefined,
      offset: offset,
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });
    return { success: true, data: subscribersData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch subscribers" };
  }
};

export const getSubscribersMetadata = async ({
  query,
  page = "1",
  limit = "20",
}: SearchParams) => {
  const q = `%${query}%`;
  const filters = and(
    eq(subscriptions.isActive, true),
    query
      ? or(
        ilike(subscriptions.subscriptionId, q),
        ilike(subscriptions.name, q),
        ilike(subscriptions.phone, q),
        ilike(subscriptions.district, q),
      )
      : undefined,
  );

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(filters);
  const totalRecords = Number(result[0].count);
  const totalPages = limit ? Math.ceil(totalRecords / Number(limit)) : 1;

  return {
    currentPage: Number(page),
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentLimit: Number(limit),
  };
};

export const getSubscriberById = async (subscriptionId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const subscriberData = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.subscriptionId, subscriptionId),
    });
    if (!subscriberData) {
      return { success: false, message: "Subscriber not found" };
    }
    return { success: true, data: subscriberData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch subscriber" };
  }
};

export const getSubscriptionsByPhone = async (phone: string) => {
  try {
    const data = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.isActive, true),
        ilike(subscriptions.phone, phone),
      ),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch subscriptions" };
  }
};

export const getCustomerSubscriptions = async (customerId: string, phone: string) => {
  try {
    const data = await db.query.subscriptions.findMany({
      where: or(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.phone, phone)
      ),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    return { success: false, message: "Could not fetch subscriptions" };
  }
}

export const getCustomerSubscriptionApplications = async (customerId: string, phone: string) => {
  try {
    const data = await db.select({
      id: applications.id,
      applicationId: applications.applicationId,
      status: applications.status,
      createdAt: applications.createdAt,
      type: applications.type,
      subscriptionId: subscriptions.subscriptionId,
      subscriptionName: subscriptions.name,
      subscriptionType: subscriptions.subscriptionType,
      totalFee: subscriptions.totalFee,
    })
      .from(applications)
      .innerJoin(subscriptions, eq(applications.applicantId, subscriptions.subscriptionId))
      .where(
        and(
          eq(applications.type, 'subscription_application'),
          or(
            eq(subscriptions.customerId, customerId),
            eq(subscriptions.phone, phone)
          )
        )
      )
      .orderBy(desc(applications.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching customer subscription applications:", error);
    return { success: false, message: "Could not fetch applications" };
  }
}

export const getCustomerSubscriptionById = async (subscriptionId: string) => {
  try {
    const session = await verifySession(false, "customer");
    if (!session || !session.isAuth) return { success: false, message: "Unauthorized" };

    const { verifyCustomerSession } = await import("./customerActions");
    const customerSession = await verifyCustomerSession();
    if (!customerSession.isAuth || !customerSession.customer) {
      return { success: false, message: "Customer profile not found" };
    }

    const customerId = customerSession.customer.customerId;
    const phone = customerSession.customer.phone;

    const data = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.subscriptionId, subscriptionId),
        or(
          eq(subscriptions.customerId, customerId),
          eq(subscriptions.phone, phone)
        )
      ),
    });

    if (!data) return { success: false, message: "Subscription not found or unauthorized" };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return { success: false, message: "Could not fetch subscription details" };
  }
}

export const createSubscriber = async (prevState: any, formData: FormData) => {
  try {
    const validatedSubscriptionData = SubscriptionDataSchema.parse(
      Object.fromEntries(formData),
    );

    // Get customer session if it exists to link the subscription
    const { verifyCustomerSession } = await import("./customerActions");
    const session = await verifyCustomerSession();
    const currentCustomerId = session.isAuth ? session.userId : null;

    const walletNumber =
      "walletNumber" in validatedSubscriptionData
        ? validatedSubscriptionData.walletNumber
        : null;
    const transactionId =
      "transactionId" in validatedSubscriptionData
        ? validatedSubscriptionData.transactionId
        : null;
    const bankName =
      "bankName" in validatedSubscriptionData
        ? validatedSubscriptionData.bankName
        : null;
    const accountHolderName =
      "accountHolderName" in validatedSubscriptionData
        ? validatedSubscriptionData.accountHolderName
        : null;
    const accountNumber =
      "accountNumber" in validatedSubscriptionData
        ? validatedSubscriptionData.accountNumber
        : null;
    const branchName =
      "branchName" in validatedSubscriptionData
        ? validatedSubscriptionData.branchName
        : null;

    const restData = {
      name: validatedSubscriptionData.name,
      phone: validatedSubscriptionData.phone,
      streetAddress: validatedSubscriptionData.streetAddress,
      district: validatedSubscriptionData.district,
      policeStation: validatedSubscriptionData.policeStation,
      postOffice: validatedSubscriptionData.postOffice,
      subscriptionDuration: validatedSubscriptionData.subscriptionDuration,
      subscriptionType: validatedSubscriptionData.subscriptionType,
      batteryType: validatedSubscriptionData.batteryType,
      ipsBrand: validatedSubscriptionData.ipsBrand,
      ipsPowerRating: validatedSubscriptionData.ipsPowerRating,
      paymentType: validatedSubscriptionData.paymentType,
    };

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      headersList.get("remote-addr") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    const subscriptionId = generateRandomId();
    let applicationId;

    const pkgBasePrice = subscriptionPlans[restData.subscriptionType];
    const pkgDuration = restData.subscriptionDuration;
    const match = restData.ipsPowerRating?.match(/(\d+)\s*Volt/i);
    const volt = match ? match[1] : null;
    const surcharge = volt
      ? voltSurcharges[volt as keyof typeof voltSurcharges]
      : 0;
    const discount =
      discounts[pkgDuration.toString() as keyof typeof discounts];
    const monthlyTotalAmount = (pkgBasePrice + surcharge) * pkgDuration;
    const totalAmount = monthlyTotalAmount - discount;

    await db.insert(subscriptions).values({
      subscriptionId: subscriptionId,
      customerId: currentCustomerId as string,
      basePrice: pkgBasePrice,
      surchargeAmount: surcharge,
      discountAmount: discount,
      totalFee: totalAmount,
      ...restData,
      walletNumber: walletNumber,
      transactionId: transactionId,
      bankInfo: bankName
        ? {
          bankName: bankName,
          accountHolderName: accountHolderName as string,
          accountNumber: accountNumber as string,
          branchName: branchName as string,
        }
        : null,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    const res = await createApplication({
      applicantId: subscriptionId,
      type: "subscription_application",
    });

    if (res.success) {
      applicationId = res.data;
    }

    if (applicationId) {
      // Sending SMSs
      const fullMessage = renderText(ApplicationMessages.subscription.SUBMISSION, {
        applicant_name: restData.name,
        subscription_id: subscriptionId,
        tracking_link: generateUrl("application-tracking", {
          trackingId: applicationId,
        }),
      });

      const { notifyCustomer } = await import("./notificationActions");
      const { customers } = await import("@/db/schema");

      // Try to find if they are a registered customer (if not already linked)
      let customerRecordId = currentCustomerId;
      if (!customerRecordId) {
        const customerRecord = await db.query.customers.findFirst({
          where: eq(customers.phone, restData.phone),
        });
        customerRecordId = customerRecord?.customerId || null;
      }

      const promises: Promise<unknown>[] = [];

      // Notify the admin of the new subscription application. Guarded + swallowed
      // so a missing ADMIN_PHONE_NUMBER or an SMS hiccup never rejects the whole
      // batch (which would also drop the applicant's own confirmation SMS).
      if (process.env.ADMIN_PHONE_NUMBER) {
        promises.push(
          sendSMS(
            process.env.ADMIN_PHONE_NUMBER,
            ApplicationMessages.subscription.ADMIN_NOTIF,
          ).catch((e) => console.error("Admin subscription SMS failed:", e)),
        );
      }

      if (customerRecordId) {
        promises.push(notifyCustomer({
          customerId: customerRecordId as string,
          phoneNumber: restData.phone,
          type: "subscription_submission",
          message: fullMessage,
          link: "/customer/profile",
        }));
      } else {
        promises.push(sendSMS(restData.phone, fullMessage));
      }

      await Promise.all(promises);
    }

    revalidatePath("/subscribers");
    revalidatePath("/applications");
    revalidatePath("/customer/dashboard");
    revalidatePath("/customer/maintenance-plans");

    return { success: true, message: "Subscription created" };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Zod Validation Error:", error.issues);
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const updateSubscriber = async (prevState: any, formData: FormData) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const subscriptionId = formData.get("subscriptionId");
    if (!subscriptionId) {
      return { success: false, message: "Subscription not found" };
    }

    formData.delete("subscriptionId");
    const validatedSubscriptionData = SubscriptionDataSchema.parse(
      Object.fromEntries(formData),
    );
    const walletNumber =
      "walletNumber" in validatedSubscriptionData
        ? validatedSubscriptionData.walletNumber
        : null;
    const transactionId =
      "transactionId" in validatedSubscriptionData
        ? validatedSubscriptionData.transactionId
        : null;
    const bankName =
      "bankName" in validatedSubscriptionData
        ? validatedSubscriptionData.bankName
        : null;
    const accountHolderName =
      "accountHolderName" in validatedSubscriptionData
        ? validatedSubscriptionData.accountHolderName
        : null;
    const accountNumber =
      "accountNumber" in validatedSubscriptionData
        ? validatedSubscriptionData.accountNumber
        : null;
    const branchName =
      "branchName" in validatedSubscriptionData
        ? validatedSubscriptionData.branchName
        : null;
    const restData = {
      name: validatedSubscriptionData.name,
      phone: validatedSubscriptionData.phone,
      streetAddress: validatedSubscriptionData.streetAddress,
      district: validatedSubscriptionData.district,
      policeStation: validatedSubscriptionData.policeStation,
      postOffice: validatedSubscriptionData.postOffice,
      subscriptionDuration: validatedSubscriptionData.subscriptionDuration,
      subscriptionType: validatedSubscriptionData.subscriptionType,
      batteryType: validatedSubscriptionData.batteryType,
      ipsBrand: validatedSubscriptionData.ipsBrand,
      ipsPowerRating: validatedSubscriptionData.ipsPowerRating,
      paymentType: validatedSubscriptionData.paymentType,
      status: validatedSubscriptionData.status,
      servicesCompleted: validatedSubscriptionData.servicesCompleted,
    };

    const pkgBasePrice = subscriptionPlans[restData.subscriptionType];
    const pkgDuration = restData.subscriptionDuration;
    const match = restData.ipsPowerRating?.match(/(\d+)\s*Volt/i);
    const volt = match ? match[1] : null;
    const surcharge = volt
      ? voltSurcharges[volt as keyof typeof voltSurcharges]
      : 0;
    const discount =
      discounts[pkgDuration.toString() as keyof typeof discounts];
    const monthlyTotalAmount = (pkgBasePrice + surcharge) * pkgDuration;
    const totalAmount = monthlyTotalAmount - discount;

    await db
      .update(subscriptions)
      .set({
        basePrice: pkgBasePrice,
        surchargeAmount: surcharge,
        discountAmount: discount,
        totalFee: totalAmount,
        ...restData,
        walletNumber: walletNumber,
        transactionId: transactionId,
        bankInfo: bankName
          ? {
            bankName: bankName,
            accountHolderName: accountHolderName as string,
            accountNumber: accountNumber as string,
            branchName: branchName as string,
          }
          : null,
      })
      .where(eq(subscriptions.id, subscriptionId.toString()));

    revalidatePath("/subscribers");
    return { success: true, message: "Subscription updated" };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("Zod Validation Error:", error.issues);
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteSubscriber = async (subscriptionId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    await db
      .delete(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId));
    await db
      .delete(applications)
      .where(eq(applications.applicantId, subscriptionId));
    revalidatePath("/subscribers");
    return { success: true, message: "Subscription deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

/**
 * Checks for expired subscriptions and sends notifications.
 * This can be called from a cron job API route.
 */
export const checkAndNotifyExpiredSubscriptions = async () => {
  try {
    console.log("Checking for expired subscriptions...");

    const activeSubscribers = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.isActive, true),
        eq(subscriptions.expiryNotified, false),
      ),
    });

    const now = new Date();
    let notifyCount = 0;

    for (const sub of activeSubscribers) {
      const expiryDate = new Date(sub.createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + sub.subscriptionDuration);

      // Total period finished
      if (expiryDate <= now) {
        console.log(`Subscription ${sub.subscriptionId} for ${sub.name} has expired.`);

        // Send SMS
        const message = renderText(ApplicationMessages.subscription.EXPIRY_NOTICE, {
          applicant_name: sub.name,
          subscription_id: sub.subscriptionId,
        });

        await sendSMS(sub.phone, message);

        // Update subscription record
        await db
          .update(subscriptions)
          .set({
            expiryNotified: true,
            isActive: false, // Deactivate so they don't show as 'active' anymore
          })
          .where(eq(subscriptions.id, sub.id));

        // Update application status to 'expired' if it exists
        await db
          .update(applications)
          .set({ status: "expired" })
          .where(and(
            eq(applications.applicantId, sub.subscriptionId),
            eq(applications.type, "subscription_application")
          ));

        notifyCount++;
      }
    }

    console.log(`Notification process complete. Notified ${notifyCount} subscribers.`);
    return { success: true, notifiedCount: notifyCount };
  } catch (error) {
    console.error("Error in checkAndNotifyExpiredSubscriptions:", error);
    return { success: false, message: "Notification process failed" };
  }
};


export const updateServiceCounter = async (
  subscriptionId: string,
  action: "increment" | "decrement",
) => {
  try {
    const subscriber = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.subscriptionId, subscriptionId),
      columns: { servicesCompleted: true, subscriptionDuration: true },
    });

    if (!subscriber) {
      return { success: false, message: "Subscriber not found" };
    }

    const { servicesCompleted, subscriptionDuration } = subscriber;

    if (action === "increment" && servicesCompleted >= subscriptionDuration) {
      return { success: false, message: "সর্বোচ্চ সার্ভিস সংখ্যা পূরণ হয়েছে" };
    }

    if (action === "decrement" && servicesCompleted <= 0) {
      return {
        success: false,
        message: "সার্ভিস কাউন্টার ০ এর নিচে যেতে পারবে না",
      };
    }

    const newCount =
      action === "increment" ? servicesCompleted + 1 : servicesCompleted - 1;

    await db
      .update(subscriptions)
      .set({ servicesCompleted: newCount })
      .where(eq(subscriptions.subscriptionId, subscriptionId));

    revalidatePath("/subscribers");
    return {
      success: true,
      message:
        action === "increment"
          ? "সার্ভিস কাউন্টার আপডেট হয়েছে"
          : "সার্ভিস কাউন্টার কমানো হয়েছে",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const sendSubscriptionServiceSMS = async (
  phone: string,
  name: string,
  subscriptionType: string,
  servicesCompleted: number,
) => {
  try {
    const template = SubscriptionServiceMessages[subscriptionType];
    if (!template) {
      return { success: false, message: "Invalid subscription type" };
    }

    const message = renderText(template, { name, servicesCompleted });
    await sendSMS(phone, message);

    return { success: true, message: "SMS পাঠানো হয়েছে" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "SMS পাঠানো যায়নি" };
  }
};
