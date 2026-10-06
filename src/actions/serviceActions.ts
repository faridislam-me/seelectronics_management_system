"use server";

import { ApplicationMessages, ServiceMessages } from "@/constants/messages";
import { db } from "@/db/drizzle";
import {
  applications,
  customers,
  invoices,
  products,
  serviceStatusHistory,
  services,
  tasks,
  staffs,
} from "@/db/schema";
import { SMSError, sendEmail, sendSMS, verifySession } from "@/lib";
import { deleteObject, getObjectUrl, putObject } from "@/lib/s3";
import { pushToUser } from "@/lib/push";
import { compressImage } from "@/lib/sharp";
import { SearchParams } from "@/types";
import { generateRandomId, generateUrl, getBaseUrl, renderText } from "@/utils";
import {
  AddToServiceSchema,
  AppointmentDataSchema,
  ServiceDataSchema,
  ServiceReportDataSchema,
  UpdateServiceDataSchema,
} from "@/validationSchemas";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import z, { ZodError, flattenError } from "zod";
import { createApplication } from "./applicationActions";
import { refreshStaffStats, updateStaffStats } from "./staffActions";

export const getServices = async ({
  query,
  page = "1",
  limit = "20",
  type,
  staffId,
}: SearchParams & { type?: "repair" | "install"; staffId?: string }) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "staff")) {
      return { success: false, message: "Unauthorized" };
    }
    const q = `%${query}%`;
    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const whereFilters = [
      eq(services.isActive, true),
      type ? eq(services.type, type) : undefined,
      staffId ? eq(services.staffId, staffId) : undefined,
      query
        ? or(
            ilike(services.serviceId, q),
            ilike(services.customerId, q),
            ilike(services.customerName, q),
            ilike(services.customerPhone, q),
            ilike(services.customerAddress, q),
            ilike(services.productModel, q),
          )
        : undefined,
    ].filter(Boolean);

    const servicesData = await db.query.services.findMany({
      where: and(...(whereFilters as any)),
      with: {
        statusHistory: {
          columns: {
            createdAt: false,
            updatedAt: false,
            serviceId: false,
          },
          limit: 1,
          orderBy: (statusHistory, { desc }) => [desc(statusHistory.createdAt)],
        },
        task: {
          columns: {
            status: true,
          },
        },
        customer: {
          columns: { sellerId: true },
          with: { seller: { columns: { sellerId: true, shopName: true } } },
        },
      },
      limit: limit ? Number(limit) : undefined,
      offset: offset,
      orderBy: (services, { desc }) => [desc(services.createdAt)],
    });
    return { success: true, data: servicesData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const getServicesMetadata = async ({
  query,
  page = "1",
  limit = "20",
  type,
  staffId,
}: SearchParams & { type?: "repair" | "install"; staffId?: string }) => {
  const q = `%${query}%`;
  const filters = and(
    eq(services.isActive, true),
    type ? eq(services.type, type) : undefined,
    staffId ? eq(services.staffId, staffId) : undefined,
    query
      ? or(
          ilike(services.serviceId, q),
          ilike(services.customerId, q),
          ilike(services.customerName, q),
          ilike(services.customerPhone, q),
          ilike(services.customerAddress, q),
          ilike(services.productModel, q),
        )
      : undefined,
  );

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
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

export const getServiceById = async (serviceId: string) => {
  try {
    // The tracking link in the customer's SMS (random service id) opens without a
    // login, so a missing session is allowed; a logged-in customer still can only
    // open their own service.
    const session = await verifySession(false);

    const serviceData = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      with: {
        statusHistory: {
          columns: {
            updatedAt: false,
            serviceId: false,
          },
          orderBy: (statusHistory, { desc, asc }) => [
            asc(statusHistory.createdAt),
          ],
        },
        appointedStaff: {
          columns: {
            staffId: true,
            photoKey: true,
            name: true,
            phone: true,
          },
        },
        customer: {
          columns: {
            isWarrantyStopped: true,
            invoiceNumber: true,
          },
        },
      },
    });

    if (!serviceData) return { success: false, message: "Service not found" };

    // Prevent customers from viewing others' services
    if (
      session &&
      session.role === "customer" &&
      serviceData.customerId !== session.userId
    ) {
      return { success: false, message: "Unauthorized access to service" };
    }

    let warrantyExpiryDate: Date | null = null;
    if (serviceData.customer?.invoiceNumber) {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.invoiceNumber, serviceData.customer.invoiceNumber),
        with: {
          products: {
            columns: {
              warrantyStartDate: true,
              warrantyDurationMonths: true,
            },
          },
        },
      });

      if (invoice?.products && invoice.products.length > 0) {
        for (const p of invoice.products) {
          if (p.warrantyStartDate && p.warrantyDurationMonths) {
            const expiry = new Date(p.warrantyStartDate);
            expiry.setMonth(expiry.getMonth() + p.warrantyDurationMonths);
            if (warrantyExpiryDate === null || expiry > warrantyExpiryDate) {
              warrantyExpiryDate = expiry;
            }
          }
        }
      }
    }

    const mediaKeys = [
      serviceData.productFrontPhotoKey,
      serviceData.productBackPhotoKey,
      serviceData.warrantyCardPhotoKey,
      serviceData.appointedStaff?.photoKey,
    ].filter(Boolean) as string[];

    const mediaUrls = await Promise.all(
      mediaKeys.map((key) => getObjectUrl(key)),
    );

    const mediaMap: Record<string, string> = {};
    mediaKeys.forEach((key, i) => {
      mediaMap[key] = mediaUrls[i];
    });

    const data = {
      ...serviceData,
      warrantyExpiryDate,
      productFrontPhotoUrl: serviceData.productFrontPhotoKey
        ? mediaMap[serviceData.productFrontPhotoKey]
        : null,
      productBackPhotoUrl: serviceData.productBackPhotoKey
        ? mediaMap[serviceData.productBackPhotoKey]
        : null,
      warrantyCardPhotoUrl: serviceData.warrantyCardPhotoKey
        ? mediaMap[serviceData.warrantyCardPhotoKey]
        : null,
      appointedStaff: serviceData.appointedStaff
        ? {
            ...serviceData.appointedStaff,
            photoUrl: mediaMap[serviceData.appointedStaff.photoKey] || null,
          }
        : null,
    };

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const getServiceHistoryById = async (id: string) => {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    if (session.role === "customer" && session.userId !== id) {
      return { success: false, message: "Unauthorized access" };
    }

    const serviceData = await db.query.services.findMany({
      where: or(
        and(eq(services.staffId, id), eq(services.resolvedBy, "staff_member")),
        eq(services.customerId, id),
      ),
      columns: {
        id: true,
        serviceId: true,
        status: true,
        customerId: true,
        customerName: true,
        staffId: true,
        staffName: true,
        staffPhone: true,
        customerAddress: true,
        customerAddressDistrict: true,
        type: true,
        productType: true,
        productModel: true,
        ipsBrand: true,
        createdAt: true,
      },
      with: {
        statusHistory: {
          columns: {
            status: true,
            statusType: true,
          },
          limit: 1,
          orderBy: (statusHistory, { desc }) => [desc(statusHistory.createdAt)],
        },
        appointedStaff: {
          columns: {
            staffId: true,
            name: true,
            phone: true,
            rating: true,
          },
        },
        feedback: {
          columns: {
            serviceId: true,
            rating: true,
          },
        },
      },
      orderBy: (services, { desc }) => [desc(services.createdAt)],
    });
    console.log("TOTAL SERVICES:", serviceData.length);
    console.log(
      "SERVICE STATUSES:",
      serviceData.map((s) => ({
        id: s.serviceId,
        status: s.status,
        historyStatus: s.statusHistory?.[0]?.status,
      })),
    );

    return { success: true, data: serviceData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Cannot fetch service history" };
  }
};

export const getServiceMediaUrls = async (keys: string[]) => {
  try {
    const mediaData = await Promise.all(keys.map((key) => getObjectUrl(key)));
    return { success: true, data: mediaData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch media" };
  }
};

export async function createService(prevState: any, formData: FormData) {
  try {
    const entries = Object.fromEntries(formData);
    // Convert empty strings to null for ID fields to avoid FK constraint violations
    if (entries.staffId === "") entries.staffId = null as any;
    if (entries.customerId === "") entries.customerId = null as any;

    const validatedCustomerData = ServiceDataSchema.parse(entries);
    const {
      productFrontPhoto,
      productBackPhoto,
      warrantyCardPhoto,
      ...serviceData
    } = validatedCustomerData;

    const serviceId = generateRandomId();
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    let applicationId: string = "";
    let productFrontPhotoKey: string | null = null;
    let productBackPhotoKey: string | null = null;
    let warrantyCardPhotoKey: string | null = null;

    const includesMedia = !!(
      productFrontPhoto &&
      productBackPhoto &&
      warrantyCardPhoto
    );
    const originSource = includesMedia ? "public_form" : "dashboard";

    if (originSource === "dashboard") {
      const session = await verifySession(false);
      if (
        !session ||
        (session.role !== "admin" && session.role !== "customer")
      ) {
        return { success: false, message: "Unauthorized" };
      }
    }

    if (includesMedia) {
      const mimeTypes = ["image/jpeg", "image/png", "image/webp"];
      if (
        !mimeTypes.includes(validatedCustomerData.productFrontPhoto!.type) ||
        !mimeTypes.includes(validatedCustomerData.productBackPhoto!.type) ||
        !mimeTypes.includes(validatedCustomerData.warrantyCardPhoto!.type) ||
        productFrontPhoto?.size === 0 ||
        productBackPhoto?.size === 0 ||
        warrantyCardPhoto?.size === 0
      ) {
        return { success: false, message: "Invalid file type" };
      }
    }

    if (includesMedia) {
      productFrontPhotoKey = `media/services/${serviceId}/product-front_${uuidv4()}.webp`;
      productBackPhotoKey = `media/services/${serviceId}/product-back_${uuidv4()}.webp`;
      warrantyCardPhotoKey = `media/services/${serviceId}/warranty-card_${uuidv4()}.webp`;

      const [
        productFrontPhotoBuffer,
        productBackPhotoBuffer,
        warrantyCardPhotoBuffer,
      ] = await Promise.all([
        compressImage(
          Buffer.from(await productFrontPhoto.arrayBuffer()),
          "product",
        ),
        compressImage(
          Buffer.from(await productBackPhoto.arrayBuffer()),
          "product",
        ),
        compressImage(
          Buffer.from(await warrantyCardPhoto.arrayBuffer()),
          "warranty",
        ),
      ]);

      await Promise.all([
        putObject({
          Key: productFrontPhotoKey,
          Body: productFrontPhotoBuffer,
          ContentType: "image/webp",
        }),
        putObject({
          Key: productBackPhotoKey,
          Body: productBackPhotoBuffer,
          ContentType: "image/webp",
        }),
        putObject({
          Key: warrantyCardPhotoKey,
          Body: warrantyCardPhotoBuffer,
          ContentType: "image/webp",
        }),
      ]);
    }

    if (originSource === "public_form") {
      const res = await createApplication({
        applicantId: serviceId,
        type: "service_application",
      });

      applicationId = res.data!;

      const headersList = await headers();
      ipAddress =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        headersList.get("remote-addr") ||
        "unknown";
      userAgent = headersList.get("user-agent") || "unknown";
    }

    await db.insert(services).values({
      ...serviceData,
      serviceId: serviceId,
      createdFrom: originSource,
      // Dashboard-created services are live immediately. Online (public form)
      // requests stay hidden until the admin approves the application, which
      // flips isActive (see updateApplicationStatus).
      isActive: originSource === "dashboard",
      ipAddress: ipAddress,
      userAgent: userAgent,
      productBackPhotoKey,
      productFrontPhotoKey,
      warrantyCardPhotoKey,
    });

    await db.insert(serviceStatusHistory).values({
      serviceId: serviceId,
      status: "pending",
    });

    if (serviceData.staffId) {
      await refreshStaffStats([serviceData.staffId]);
    }

    // Revalidate service lists for admin and customer
    revalidatePath("/services/repairs");
    revalidatePath("/services/installations");
    revalidatePath("/customer/services");

    if (originSource === "public_form") {
      // Sending applicant and the admin SMS of the online applicatoin if the form is submitted from public form
      await Promise.all([
        sendSMS(
          validatedCustomerData.customerPhone,
          renderText(ApplicationMessages.service.SUBMISSION, {
            applicant_name: validatedCustomerData.customerName,
            service_id: serviceId,
            tracking_link: generateUrl("application-tracking", {
              trackingId: applicationId,
            }),
          }),
        ),
        sendSMS(
          process.env.ADMIN_PHONE_NUMBER!,
          ApplicationMessages.service.ADMIN_NOTIF,
        ),
      ]);
    } else if (originSource === "dashboard") {
      const messageTemplate = validatedCustomerData.type === 'install' 
        ? ServiceMessages.INSTALL_CONFIRMATION 
        : ServiceMessages.CONFIRMATION;

      const fullMessage = renderText(messageTemplate, {
        customer_name: validatedCustomerData.customerName,
        service_id: serviceId,
        tracking_link: generateUrl("service-tracking", {
          trackingId: serviceId,
        }),
      });

      const shortSMSTemplate = validatedCustomerData.type === 'install'
        ? `প্রিয় গ্রাহক {customer_name}, আপনার আই পি এস হোম ইন্সটল এর অনুরোধটি গ্রহণ করা হয়েছে (ID: {service_id})। বিস্তারিত দেখুন: {tracking_link}`
        : `প্রিয় গ্রাহক {customer_name}, আপনার সার্ভিস অনুরোধটি (ID: {service_id}) গ্রহণ করা হয়েছে। বিস্তারিত দেখুন: {tracking_link}`;

      const shortSMS = renderText(
        shortSMSTemplate,
        {
          customer_name: validatedCustomerData.customerName,
          service_id: serviceId,
          tracking_link: generateUrl("service-tracking", {
            trackingId: serviceId,
          }),
        },
      );

      if (validatedCustomerData.customerId) {
        const { notifyCustomer } = await import("./notificationActions");
        await notifyCustomer({
          customerId: validatedCustomerData.customerId,
          phoneNumber: validatedCustomerData.customerPhone,
          type: "service_confirmation",
          message: fullMessage,
          shortMessage: shortSMS,
          link: `/customer/services/${serviceId}`,
        });
      } else {
        await sendSMS(validatedCustomerData.customerPhone, fullMessage);
      }

      try {
        const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
        const broadcastIds = getMramBroadcastIds();
        if (broadcastIds) {
          if (validatedCustomerData.type === 'install' && broadcastIds.installation_requested) {
            sendVoiceCall(validatedCustomerData.customerPhone, broadcastIds.installation_requested, `Installation Requested ${serviceId}`).catch(e => console.error(e));
          } else if (broadcastIds.service_requested) {
            sendVoiceCall(validatedCustomerData.customerPhone, broadcastIds.service_requested, `Service Requested ${serviceId}`).catch(e => console.error(e));
          }
        }
      } catch (e) {
        console.error("Failed to send MRAM voice call:", e);
      }
    }

    return { success: true, message: "Added to service list" };
  } catch (error) {
    console.error("createService error caught:", error);
    if (error instanceof z.ZodError) {
      console.error(
        "Zod Validation Errors:",
        z.flattenError(error).fieldErrors,
      );
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    let message =
      error instanceof Error ? error.message : "Something went wrong";
    return { success: false, message };
  }
}

export async function addToService(data: z.infer<typeof AddToServiceSchema>) {
  try {
    const validatedData = AddToServiceSchema.parse(data);
    const { productId, serviceType } = validatedData;

    const productInfo = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        type: true,
        model: true,
      },
      with: {
        invoice: {
          columns: {
            customerId: true,
            customerName: true,
            customerPhone: true,
            customerAddress: true,
          },
        },
      },
    });

    if (!productInfo) {
      console.error("Product not found");
      return { success: false, message: "Product not found" };
    }

    const formData = new FormData();
    formData.append("customerId", productInfo.invoice.customerId);
    formData.append("customerName", productInfo.invoice.customerName);
    formData.append("customerPhone", productInfo.invoice.customerPhone);
    formData.append("customerAddress", productInfo.invoice.customerAddress);
    formData.append("productType", productInfo.type);
    formData.append("productModel", productInfo.model);
    formData.append("type", serviceType);

    return await createService(null, formData);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(flattenError(error).fieldErrors);
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}

export const appointStaff = async (
  appointmentData: z.infer<typeof AppointmentDataSchema>,
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const validatedData = AppointmentDataSchema.parse(appointmentData);
    const existingService = await db.query.services.findFirst({
      where: eq(services.serviceId, validatedData.serviceId),
      columns: {
        staffId: true,
        status: true,
        type: true,
        reportedIssue: true,
        customerId: true,
        customerName: true,
      },
    });

    const updatedService = await db
      .update(services)
      .set({
        staffId: validatedData.staffId ? validatedData.staffId : null,
        staffName: validatedData.staffName,
        staffPhone: validatedData.staffPhone,
        status: "in_progress",
      })
      .where(eq(services.serviceId, validatedData.serviceId))
      .returning({ customerId: services.customerId });

    const service = updatedService[0];

    await db.insert(serviceStatusHistory).values({
      serviceId: validatedData.serviceId,
      status: "in_progress",
    });

    const customerMessage = renderText(
      validatedData.serviceType === "install"
        ? ServiceMessages.CUSTOMER_INSTALL
        : ServiceMessages.CUSTOMER_REPAIR,
      {
        customer_name: validatedData.customerName,
        service_id: validatedData.serviceId,
      },
    );

    const staffMessage = renderText(
      validatedData.serviceType === "install"
        ? ServiceMessages.ELECTRICIAN_APPOINT
        : ServiceMessages.TECHNICIAN_APPOINT,
      {
        staff_name: validatedData.staffName,
        customer_name: validatedData.customerName,
        customer_phone: validatedData.customerPhone,
        service_id: validatedData.serviceId,
        product_model: validatedData.productModel,
        customer_address: validatedData.customerAddress,
        service_report_url: generateUrl("service-report", {
          serviceId: validatedData.serviceId,
        }),
      },
    );

    const { notifyCustomer, notifyStaff } =
      await import("./notificationActions");

    const promises: Promise<any>[] = [];

    // Notify Customer
    if (service?.customerId) {
      const shortCustomerSMS = renderText(
        `প্রিয় গ্রাহক {customer_name}, আপনার {service_id} সার্ভিসের জন্য আমাদের টিম নিযুক্ত করা হয়েছে। বিস্তারিত দেখুন: {tracking_link}`,
        {
          customer_name: validatedData.customerName,
          service_id: validatedData.serviceId,
          tracking_link: generateUrl("service-tracking", {
            trackingId: validatedData.serviceId,
          }),
        },
      );
      promises.push(
        notifyCustomer({
          customerId: service.customerId,
          phoneNumber: validatedData.customerPhone,
          type: "staff_appointed",
          message: customerMessage,
          shortMessage: shortCustomerSMS,
          link: `/customer/services/${validatedData.serviceId}`,
        }),
      );
    } else {
      promises.push(sendSMS(validatedData.customerPhone, customerMessage));
    }

    // Notify Staff
    if (validatedData.staffId) {
      // 1. Create a task for the staff member
      promises.push(
        db.insert(tasks).values({
          taskId: generateRandomId(),
          staffId: validatedData.staffId,
          title:
            validatedData.serviceType === "install"
              ? "ইন্সটলেশন কাজ"
              : "সার্ভিসিং কাজ",
          description: staffMessage,
          priority: "normal",
          status: "pending",
          serviceId: validatedData.serviceId,
        }),
      );

      // 2. Send a short SMS and notification
      const shortStaffSMS = `টেকনিশিয়ান/ ইলেকট্রিশিয়ান ${validatedData.staffName} নতুন সার্ভিস নিয়োগ করা হয়েছে (ID: ${validatedData.serviceId})। বিস্তারিত আপনার ড্যাশবোর্ডে দেখুন।`;
      promises.push(
        notifyStaff({
          staffId: validatedData.staffId,
          phoneNumber: validatedData.staffPhone,
          type: "service_appointed",
          message: staffMessage,
          shortMessage: shortStaffSMS,
          link: `/staff/tasks`,
        }),
      );

      try {
        const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
        const broadcastIds = getMramBroadcastIds();
        if (broadcastIds) {
           const staff = await db.query.staffs.findFirst({
              where: eq(staffs.staffId, validatedData.staffId),
              columns: { role: true },
           });
           if (staff?.role === 'electrician' && broadcastIds.electrician_assigned) {
              sendVoiceCall(validatedData.staffPhone, broadcastIds.electrician_assigned, `Electrician Assigned ${validatedData.serviceId}`).catch(e => console.error(e));
           } else if (staff?.role === 'technician' && broadcastIds.technician_assigned) {
              sendVoiceCall(validatedData.staffPhone, broadcastIds.technician_assigned, `Technician Assigned ${validatedData.serviceId}`).catch(e => console.error(e));
           }
        }
      } catch (e) {
        console.error("Failed to send MRAM voice call:", e);
      }

    } else {
      promises.push(sendSMS(validatedData.staffPhone, staffMessage));
    }

    // Seller-requested job approved for the first time → short SMS to the seller.
    if (existingService?.status === "pending" && existingService.reportedIssue?.includes("সেলার রিকোয়েস্ট") && existingService.customerId) {
      promises.push(
        (async () => {
          const owner = await db.query.customers.findFirst({
            where: eq(customers.customerId, existingService.customerId!),
            columns: { sellerId: true, name: true },
            with: { seller: { columns: { phone: true } } },
          });
          const sellerPhone = owner?.seller?.phone;
          if (!sellerPhone) return;
          const kindBn = existingService.type === "install" ? "ইন্সটল" : "সার্ভিস";
          await sendSMS(
            sellerPhone,
            `SE Electronics: আপনার ${owner?.name || existingService.customerName} এর ${kindBn} আবেদন অনুমোদিত হয়েছে। সার্ভিস আইডি ${validatedData.serviceId}।`,
          );
        })().catch((e) => console.error("seller approval SMS failed:", e)),
      );
    }

    await Promise.all(promises);

    // Update staff stats
    const staffIdsToRefresh = [
      existingService?.staffId,
      validatedData.staffId,
    ].filter((id): id is string => Boolean(id));

    if (staffIdsToRefresh.length > 0) {
      await refreshStaffStats([...new Set(staffIdsToRefresh)]);
    }

    revalidatePath("/services");
    revalidatePath("/installations");

    return { success: true, message: "Appointed" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(z.flattenError(error).fieldErrors);
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const updateService = async (
  formData: FormData,
  serviceId: string,
  statusId?: string,
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const validatedData = UpdateServiceDataSchema.parse(
      Object.fromEntries(formData),
    );
    const existingService = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      columns: {
        staffId: true,
        staffReport: true,
        customerPhone: true,
      },
    });
    const {
      serviceStatus,
      customLabel,
      customNote,
      cancelReason,
      sendCompletionSMS,
      warrantyCardPhoto,
      productFrontPhoto,
      productBackPhoto,
      ...restData
    } = validatedData;

    const reportResolvedStr = formData.get("reportResolved") as string | null;
    const reportExplanation = formData.get("reportExplanation") as string | null;
    const reportTravelCostStr = formData.get("reportTravelCost") as string | null;
    const reportTotalCostStr = formData.get("reportTotalCost") as string | null;
    const reportReason = formData.get("reportReason") as string | null;
    const reportOtherReason = formData.get("reportOtherReason") as string | null;

    let staffReport = undefined;
    if (reportResolvedStr !== null) {
      const resolved = reportResolvedStr === "true";
      const reasonVal = reportReason === "others" ? reportOtherReason : reportReason;
      staffReport = {
        resolved,
        explanation: resolved ? reportExplanation || "" : undefined,
        travelCost: resolved && reportTravelCostStr ? Number(reportTravelCostStr) : undefined,
        totalCost: resolved && reportTotalCostStr ? Number(reportTotalCostStr) : undefined,
        reason: !resolved ? (reasonVal || existingService?.staffReport?.reason || "") : undefined,
      };
    }

    const currentServiceStatus = (
      await db.query.serviceStatusHistory.findFirst({
        where: eq(serviceStatusHistory.serviceId, serviceId),
        orderBy: desc(serviceStatusHistory.createdAt),
      })
    )?.status;

    const serviceData = await db
      .update(services)
      .set({
        ...restData,
        ...(serviceStatus !== currentServiceStatus &&
          !["new_note", "custom"].includes(serviceStatus) && {
            status: serviceStatus as any,
            resolvedBy: serviceStatus === "completed" ? "service_center" : null,
          }),
        ...(staffReport !== undefined && {
          staffReport,
          ...(staffReport.resolved && { resolvedBy: "service_center" }),
        }),
      })
      .where(eq(services.serviceId, serviceId))
      .returning({
        type: services.type,
        warrantyCardPhotoKey: services.warrantyCardPhotoKey,
        productFrontPhotoKey: services.productFrontPhotoKey,
        productBackPhotoKey: services.productBackPhotoKey,
      });

    if (serviceStatus === "pending") {
      await db
        .delete(serviceStatusHistory)
        .where(eq(serviceStatusHistory.serviceId, serviceId));
    } else {
      await db
        .delete(serviceStatusHistory)
        .where(
          and(
            eq(serviceStatusHistory.serviceId, serviceId),
            or(
              eq(serviceStatusHistory.status, "completed"),
              eq(serviceStatusHistory.status, "canceled"),
            ),
          ),
        );
    }

    switch (serviceStatus) {
      // maybe we can use upsert here?
      case "new_note": {
        await db.insert(serviceStatusHistory).values({
          serviceId: serviceId,
          statusType: "custom",
          customLabel: customLabel,
          customNote: customNote,
        });
        break;
      }
      case "custom": {
        await db
          .update(serviceStatusHistory)
          .set({
            customLabel: customLabel,
            customNote: customNote,
          })
          .where(eq(serviceStatusHistory.id, statusId!));
        break;
      }
      default: {
        await db.insert(serviceStatusHistory).values({
          serviceId: serviceId,
          status: serviceStatus,
          ...(serviceStatus === "canceled" && cancelReason
            ? { cancelReason: cancelReason }
            : {}),
        });
        break;
      }
    }

    // Send completion SMS if admin wants it
    if (sendCompletionSMS) {
      const fullMessage = renderText(
        serviceData[0].type === "install"
          ? ServiceMessages.COMPLETION_INSTALL
          : ServiceMessages.COMPLETION_REPAIR,
        {
          customer_name: restData.customerName,
          service_id: serviceId,
          feedback_url: generateUrl("feedback", { serviceId: serviceId }),
        },
      );

      const serviceRecord = await db.query.services.findFirst({
        where: eq(services.serviceId, serviceId),
        columns: { customerId: true },
      });

      if (serviceRecord?.customerId) {
        const { notifyCustomer } = await import("./notificationActions");
        const shortSMS = renderText(
          `প্রিয় গ্রাহক {customer_name}, আপনার সার্ভিসটি (ID: {service_id}) সম্পন্ন হয়েছে। আপনার মূল্যবান ফিডব্যাক দিন: {feedback_url}`,
          {
            customer_name: restData.customerName,
            service_id: serviceId,
            feedback_url: generateUrl("feedback", { serviceId: serviceId }),
          },
        );
        await notifyCustomer({
          customerId: serviceRecord.customerId,
          phoneNumber: restData.customerPhone,
          type: "service_completed",
          message: fullMessage,
          shortMessage: shortSMS,
          link: `/customer/services/${serviceId}`,
        });
      } else {
        await sendSMS(restData.customerPhone, fullMessage);
      }
    }

    if (serviceStatus === "completed") {
      try {
        const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
        const broadcastIds = getMramBroadcastIds();
        if (broadcastIds) {
           const bId = serviceData[0].type === "install" ? broadcastIds.installation_complete : broadcastIds.service_complete;
           const phoneToCall = restData.customerPhone || existingService?.customerPhone;
           if (phoneToCall && bId) {
             sendVoiceCall(phoneToCall, bId, `Service Completed ${serviceId}`).catch(e => console.error(e));
           }
        }
      } catch (e) {
        console.error("Failed to send MRAM voice call:", e);
      }
    }

    // Updating images if there is any
    const promisesArray = [];
    const mimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (
      warrantyCardPhoto &&
      mimeTypes.includes(warrantyCardPhoto.type) &&
      warrantyCardPhoto.size > 0
    ) {
      const warrantyCardPhotoBuffer = Buffer.from(
        await warrantyCardPhoto.arrayBuffer(),
      );
      promisesArray.push(
        putObject({
          Key: serviceData[0].warrantyCardPhotoKey!,
          Body: warrantyCardPhotoBuffer,
          ContentType: warrantyCardPhoto.type,
        }),
      );
    }

    if (
      productFrontPhoto &&
      mimeTypes.includes(productFrontPhoto.type) &&
      productFrontPhoto.size > 0
    ) {
      const productFrontPhotoBuffer = Buffer.from(
        await productFrontPhoto.arrayBuffer(),
      );
      promisesArray.push(
        putObject({
          Key: serviceData[0].productFrontPhotoKey!,
          Body: productFrontPhotoBuffer,
          ContentType: productFrontPhoto.type,
        }),
      );
    }

    if (
      productBackPhoto &&
      mimeTypes.includes(productBackPhoto.type) &&
      productBackPhoto.size > 0
    ) {
      const productBackPhotoBuffer = Buffer.from(
        await productBackPhoto.arrayBuffer(),
      );
      promisesArray.push(
        putObject({
          Key: serviceData[0].productBackPhotoKey!,
          Body: productBackPhotoBuffer,
          ContentType: productBackPhoto.type,
        }),
      );
    }

    await Promise.all(promisesArray);

    try {
      await refreshStaffStats([
        existingService?.staffId,
        validatedData.staffId,
      ]);
    } catch (err) {
      console.error("Failed to update staff stats:", err);
    }

    // Update staff stats and related task if service status changed
    if (
      [
        "completed",
        "canceled",
        "pending",
        "in_progress",
        "service_center",
        "appointment_retry",
      ].includes(serviceStatus)
    ) {
      // Update task status to match service
      let newTaskStatus: any = "in_progress";
      if (serviceStatus === "completed" || serviceStatus === "service_center")
        newTaskStatus = "completed";
      else if (
        serviceStatus === "canceled" ||
        serviceStatus === "appointment_retry"
      )
        newTaskStatus = "cancelled";
      else if (serviceStatus === "pending") newTaskStatus = "pending";

      db.update(tasks)
        .set({ status: newTaskStatus })
        .where(eq(tasks.serviceId, serviceId))
        .catch((err) => console.error("Failed to update task status:", err));
    }

    revalidatePath("/services");
    revalidatePath("/installations");

    return { success: true, message: "Service Updated" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(z.flattenError(error).fieldErrors);
      return {
        success: false,
        message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।",
      };
    }
    console.error(error);
    return { success: false, message: "Could not update service" };
  }
};

export const reportService = async ({
  serviceStatus,
  serviceReport,
  messageData,
}: z.infer<typeof ServiceReportDataSchema>) => {
  try {
    const session = await verifySession(false, "staff");
    if (!session) {
      const serviceRecord = await db.query.services.findFirst({
        where: eq(services.serviceId, serviceStatus.serviceId),
        columns: { serviceId: true, status: true },
      });
      if (!serviceRecord || serviceRecord.status === "completed" || serviceRecord.status === "canceled") {
        return { success: false, message: "Unauthorized" };
      }
    }

    await db.insert(serviceStatusHistory).values(serviceStatus);

    // Customer's phone app: "technician is on the way" with the live map link.
    if (serviceStatus.status === "staff_departed" || serviceStatus.status === "staff_arrived") {
      try {
        const svc = await db.query.services.findFirst({
          where: eq(services.serviceId, serviceStatus.serviceId),
          columns: { customerId: true },
        });
        if (svc?.customerId) {
          const departed = serviceStatus.status === "staff_departed";
          await pushToUser("customer", svc.customerId, {
            title: departed ? "টেকনিশিয়ান রওনা দিয়েছেন" : "টেকনিশিয়ান পৌঁছে গেছেন",
            body: departed ? "ম্যাপে লাইভ লোকেশন ও কতক্ষণে পৌঁছাবেন দেখুন।" : "আপনার সার্ভিসের কাজ শুরু হচ্ছে।",
            link: `/service-track?trackingId=${serviceStatus.serviceId}`,
          });
        }
      } catch (e) {
        console.error("push on status change failed:", e);
      }
    }

    if (serviceReport) {
      const serviceRecord = await db.query.services.findFirst({
        where: eq(services.serviceId, serviceStatus.serviceId),
        columns: { staffId: true },
      });

      await db
        .update(services)
        .set({
          staffReport: serviceReport,
          status: serviceStatus.status,
          ...(serviceReport.resolved && { resolvedBy: "staff_member" }),
        })
        .where(eq(services.serviceId, serviceStatus.serviceId));

      if (
        serviceStatus.status === "completed" ||
        serviceStatus.status === "service_center"
      ) {
        await db
          .update(tasks)
          .set({ status: "completed" })
          .where(eq(tasks.serviceId, serviceStatus.serviceId));
      } else if (serviceStatus.status === "canceled") {
        await db
          .update(tasks)
          .set({ status: "cancelled" })
          .where(eq(tasks.serviceId, serviceStatus.serviceId));
      }

      // Update staff stats
      try {
        if (serviceRecord?.staffId) {
          await refreshStaffStats([serviceRecord.staffId]);
        } else if (session?.userId) {
          await updateStaffStats(session.userId as string);
        }
      } catch (err) {
        console.error("Failed to update staff stats:", err);
      }

      await sendEmail({
        from: `New Technician Comment`,
        subject: "Technician Comment Notification",
        text: `A comment was added to your dashboard by a Technician.\nView Comment: ${getBaseUrl()}/services`,
      });
    }

    if (messageData) {
      const messageContent = renderText(
        messageData.messageType === "install"
          ? ServiceMessages.COMPLETION_INSTALL
          : ServiceMessages.COMPLETION_REPAIR,
        {
          customer_name: messageData.customerName,
          service_id: serviceStatus.serviceId,
          feedback_url: generateUrl("feedback", {
            serviceId: serviceStatus.serviceId,
          }),
        },
      );
      await sendSMS(messageData.customerPhone, messageContent);
    }

    if (serviceStatus.status === "completed") {
      try {
        const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
        const broadcastIds = getMramBroadcastIds();
        if (broadcastIds) {
           const svcRecord = await db.query.services.findFirst({
             where: eq(services.serviceId, serviceStatus.serviceId),
             columns: { customerPhone: true, type: true },
           });
           const phoneToCall = messageData?.customerPhone || svcRecord?.customerPhone;
           const bId = svcRecord?.type === "install" ? broadcastIds.installation_complete : broadcastIds.service_complete;
           
           if (phoneToCall && bId) {
             sendVoiceCall(phoneToCall, bId, `Service Completed ${serviceStatus.serviceId}`).catch(e => console.error(e));
           }
        }
      } catch (e) {
        console.error("Failed to send MRAM voice call:", e);
      }
    }

    return { success: true, message: "Service Reported Successfully" };
  } catch (error) {
    console.error(error);
    let message = "Something went wrong";
    if (error instanceof SMSError) {
      message = error.message;
    }
    return { success: false, message };
  }
};

export async function deleteService(serviceId: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const existingService = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      columns: {
        staffId: true,
        createdFrom: true,
        productFrontPhotoKey: true,
        productBackPhotoKey: true,
        warrantyCardPhotoKey: true,
      },
    });

    const serviceData = await db
      .delete(services)
      .where(eq(services.serviceId, serviceId))
      .returning({
        createdFrom: services.createdFrom,
        productFrontPhotoKey: services.productFrontPhotoKey,
        productBackPhotoKey: services.productBackPhotoKey,
        warrantyCardPhotoKey: services.warrantyCardPhotoKey,
      });

    await db
      .delete(applications)
      .where(eq(applications.applicantId, serviceId));

    if (existingService?.staffId) {
      try {
        await refreshStaffStats([existingService.staffId]);
      } catch (err) {
        console.error("Failed to update staff stats:", err);
      }
    }

    if (serviceData[0].createdFrom === "public_form") {
      await Promise.all([
        deleteObject({ Key: serviceData[0].productFrontPhotoKey! }),
        deleteObject({ Key: serviceData[0].productBackPhotoKey! }),
        deleteObject({ Key: serviceData[0].warrantyCardPhotoKey! }),
      ]);
    }
    revalidatePath("/services");
    revalidatePath("/installations");
    return { success: true, message: "Service deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}

export const staffCancelService = async (serviceId: string) => {
  try {
    const session = await verifySession(false);
    if (!session || session.role !== "staff")
      return { success: false, message: "Unauthorized" };

    const serviceData = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
    });
    if (!serviceData || serviceData.staffId !== session.userId) {
      return { success: false, message: "Service not found or unauthorized" };
    }

    await db
      .update(services)
      .set({ status: "appointment_retry" })
      .where(eq(services.serviceId, serviceId));

    await db.insert(serviceStatusHistory).values({
      serviceId: serviceId,
      status: "appointment_retry",
      statusType: "system",
      cancelReason:
        "Service canceled by assigned staff. Requires reappointment.",
    });

    await db
      .update(tasks)
      .set({ status: "cancelled" })
      .where(eq(tasks.serviceId, serviceId));

    // Update staff stats
    const staffIdsToRefresh = [serviceData.staffId].filter((id): id is string =>
      Boolean(id),
    );

    if (staffIdsToRefresh.length > 0) {
      await refreshStaffStats([...new Set(staffIdsToRefresh)]);
    }

    revalidatePath("/staff/services");
    revalidatePath("/services/repairs");
    revalidatePath("/services/installations");
    revalidatePath("/staff/tasks");

    const { notifyAdmin } = await import("./notificationActions");
    notifyAdmin({
      type: "service_update",
      message: `টেকনিসিয়ান ${serviceData.staffName} সার্ভিস অনুরোধটি (ID: ${serviceId}) বাতিল করেছেন। পুনরায় নিয়োগ প্রয়োজন।`,
      link: `/services/${serviceId}`,
    }).catch((err) => console.error("Admin notification failed:", err));

    return { success: true, message: "Service canceled successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const adminCancelService = async (
  serviceId: string,
  cancelReason?: string,
) => {
  try {
    const session = await verifySession(false);
    if (!session || session.role !== "admin")
      return { success: false, message: "Unauthorized" };

    const serviceData = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
    });
    if (!serviceData) {
      return { success: false, message: "Service not found" };
    }

    await db
      .update(services)
      .set({ status: "canceled" })
      .where(eq(services.serviceId, serviceId));

    await db.insert(serviceStatusHistory).values({
      serviceId: serviceId,
      status: "canceled",
      statusType: "system",
      cancelReason: cancelReason || "Service canceled by admin.",
    });

    await db
      .update(tasks)
      .set({ status: "cancelled" })
      .where(eq(tasks.serviceId, serviceId));

    // Update staff stats
    const staffIdsToRefresh = [serviceData.staffId].filter((id): id is string =>
      Boolean(id),
    );

    if (staffIdsToRefresh.length > 0) {
      await refreshStaffStats([...new Set(staffIdsToRefresh)]);
    }

    revalidatePath("/services/repairs");
    revalidatePath("/services/installations");

    return { success: true, message: "Service canceled successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const adminSubmitServiceReport = async ({
  serviceId,
  resolved,
  explanation,
  travelCost,
  totalCost,
}: {
  serviceId: string;
  resolved: boolean;
  explanation?: string;
  travelCost?: number;
  totalCost?: number;
}) => {
  try {
    const session = await verifySession(false);
    if (!session || session.role !== "admin") {
      return { success: false, message: "Unauthorized" };
    }

    const serviceData = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      columns: { staffId: true, customerName: true, customerPhone: true, type: true, status: true },
    });

    if (!serviceData) {
      return { success: false, message: "Service not found" };
    }

    if (serviceData.status !== "service_center") {
      return { success: false, message: "Only services from the official service center can be reported by admin." };
    }

    const report = {
      resolved,
      explanation,
      travelCost: travelCost !== undefined ? Number(travelCost) : undefined,
      totalCost: totalCost !== undefined ? Number(totalCost) : undefined,
    };

    const nextStatus = resolved ? "completed" : "service_center";

    await db
      .update(services)
      .set({
        staffReport: report,
        status: nextStatus,
        ...(resolved && { resolvedBy: "service_center" }),
      })
      .where(eq(services.serviceId, serviceId));

    await db.insert(serviceStatusHistory).values({
      serviceId,
      status: nextStatus,
      statusType: "system",
    });

    if (nextStatus === "completed" || nextStatus === "service_center") {
      await db
        .update(tasks)
        .set({ status: "completed" })
        .where(eq(tasks.serviceId, serviceId));
    }

    if (serviceData.staffId) {
      try {
        await refreshStaffStats([serviceData.staffId]);
      } catch (err) {
        console.error("Failed to update staff stats:", err);
      }
    }

    if (resolved) {
      try {
        const messageContent = renderText(
          serviceData.type === "install"
            ? ServiceMessages.COMPLETION_INSTALL
            : ServiceMessages.COMPLETION_REPAIR,
          {
            customer_name: serviceData.customerName,
            service_id: serviceId,
            feedback_url: generateUrl("feedback", {
              serviceId,
            }),
          },
        );
        await sendSMS(serviceData.customerPhone, messageContent);
      } catch (smsErr) {
        console.error("Failed to send completion SMS:", smsErr);
      }

      try {
        const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
        const broadcastIds = getMramBroadcastIds();
        if (broadcastIds) {
           const bId = serviceData.type === "install" ? broadcastIds.installation_complete : broadcastIds.service_complete;
           if (bId) {
             sendVoiceCall(serviceData.customerPhone, bId, `Service Completed ${serviceId}`).catch(e => console.error(e));
           }
        }
      } catch (e) {
        console.error("Failed to send MRAM voice call:", e);
      }
    }

    revalidatePath("/services/repairs");
    revalidatePath("/services/installations");

    return { success: true, message: "Service report submitted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};
