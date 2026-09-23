'use server'

import { ApplicationMessages, SellerMessages } from "@/constants/messages"
import { db } from "@/db/drizzle"
import { agreements, applications, customers, sellers, services, staffs, subscriptions } from "@/db/schema"
import { sendSMS, verifySession } from "@/lib"
import { getObjectUrl } from "@/lib/s3"
import { ApplicationTypes, SearchParams } from "@/types"
import { generateRandomId, generateUrl, renderText, generateVipCardNumber } from "@/utils"
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
// import { deleteSubscriber } from "./subscriptionActions"
// import { deleteStaff } from "./staffActions"
// import { deleteService } from "./serviceActions"

export const getApplications = async ({ query, type, page = '1', limit = '20' }: SearchParams & { type?: ApplicationTypes }) => {
    await verifySession()

    try {
        const q = `%${query}%`
        const filters = and(
            type ? eq(applications.type, type + '_application' as ApplicationTypes) : undefined,
            query ? or(
                ilike(applications.applicationId, q),
                ilike(staffs.name, q),
                ilike(staffs.phone, q),
                ilike(staffs.currentDistrict, q),
                ilike(services.customerName, q),
                ilike(services.customerPhone, q),
                ilike(services.customerAddressDistrict, q),
                ilike(subscriptions.name, q),
                ilike(subscriptions.phone, q),
                ilike(subscriptions.district, q),
                ilike(sellers.shopName, q),
                ilike(sellers.ownerName, q),
                ilike(sellers.phone, q)
            ) : undefined
        )

        const offset = (page && limit) ? (Number(page) - 1) * Number(limit) : 0

        const applicationColumns = getTableColumns(applications)
        const applicationsData = await db
            .select({
                ...applicationColumns,
                applicantName: sql<string>`coalesce(${staffs.name}, ${services.customerName}, ${subscriptions.name}, ${customers.name}, ${sellers.shopName})`.as('applicantName'),
                applicantPhone: sql<string>`coalesce(${staffs.phone}, ${services.customerPhone}, ${subscriptions.phone}, ${customers.phone}, ${sellers.phone})`.as('applicantPhone'),
                applicantDistrict: sql<string>`coalesce(
                    ${staffs.currentDistrict}, 
                    ${services.customerAddressDistrict}, 
                    ${subscriptions.district},
                    ${customers.address},
                    ${sellers.shopDistrict}
                    )`.as('applicantDistrict'),
            })
            .from(applications)
            .leftJoin(staffs, eq(staffs.staffId, applications.applicantId))
            .leftJoin(services, eq(services.serviceId, applications.applicantId))
            .leftJoin(subscriptions, eq(subscriptions.subscriptionId, applications.applicantId))
            .leftJoin(customers, eq(customers.customerId, applications.applicantId))
            .leftJoin(sellers, eq(sellers.sellerId, applications.applicantId))
            .where(filters)
            .limit(Number(limit))
            .offset(offset)
            .orderBy(desc(applications.createdAt))
        return { success: true, data: applicationsData }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Could not fetch applications' }
    }
}

export const getApplicationsMetadata = async ({ query, type, page = '1', limit = '20' }: SearchParams & { type?: ApplicationTypes }) => {
    await verifySession()

    const q = `%${query}%`
    const filters = and(
        type ? eq(applications.type, type + '_application' as ApplicationTypes) : undefined,
        query ? or(
            ilike(applications.applicationId, q),
            ilike(staffs.name, q),
            ilike(staffs.phone, q),
            ilike(staffs.currentDistrict, q),
            ilike(services.customerName, q),
            ilike(services.customerPhone, q),
            ilike(services.customerAddressDistrict, q),
            ilike(subscriptions.name, q),
            ilike(subscriptions.phone, q),
            ilike(subscriptions.district, q),
            ilike(sellers.shopName, q),
            ilike(sellers.ownerName, q),
            ilike(sellers.phone, q)
        ) : undefined
    )
    const totalRecords = (await db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .leftJoin(staffs, eq(staffs.staffId, applications.applicantId))
        .leftJoin(services, eq(services.serviceId, applications.applicantId))
        .leftJoin(subscriptions, eq(subscriptions.subscriptionId, applications.applicantId))
        .leftJoin(customers, eq(customers.customerId, applications.applicantId))
        .leftJoin(sellers, eq(sellers.sellerId, applications.applicantId))
        .where(filters))[0].count

    const totalPages = limit ? Math.ceil(totalRecords / Number(limit)) : 1;

    return {
        currentPage: Number(page),
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentLimit: Number(limit)
    }
}

export const getTOSContent = async (type: 'application_declaration') => {
    const tosContent = await db.query.agreements.findFirst({
        where: eq(agreements.type, type),
        columns: {
            content: true
        }
    })

    return tosContent?.content
}

// fetches public data
export const getApplicationById = async (applicationId: string) => {
    try {
        const applicationData = await db.query.applications.findFirst({
            where: eq(applications.applicationId, applicationId),
            with: {
                staff: {
                    columns: {
                        name: true,
                        phone: true,
                        photoKey: true
                    }
                },
                service: {
                    columns: {
                        customerName: true,
                        customerPhone: true,
                    }
                },
                subscriber: {
                    columns: {
                        name: true,
                        phone: true,
                    }
                },
                seller: {
                    columns: {
                        shopName: true,
                        ownerName: true,
                        phone: true,
                        ownerPhotoKey: true,
                    }
                }
            }
        })
        if (!applicationData) return { success: false, message: 'Application not found' }

        if (applicationData.type === 'seller_application' && applicationData.seller) {
            const photoUrl = await getObjectUrl(applicationData.seller.ownerPhotoKey)
            return { success: true, data: { ...applicationData, seller: { ...applicationData.seller, photoUrl } } }
        }

        if (applicationData.type === 'staff_application') {
            const photoUrl = await getObjectUrl(applicationData.staff.photoKey)
            return { success: true, data: { ...applicationData, staff: { ...applicationData.staff, photoUrl } } }
        }

        return { success: true, data: applicationData }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Something went wrong' }
    }
}

export const createApplication = async (data: Omit<typeof applications.$inferInsert, 'applicationId'>, tx?: any) => {
    try {
        const applicationId = generateRandomId()
        const database = tx || db
        await database.insert(applications).values({ ...data, applicationId })
        revalidatePath('/applications')
        return { success: true, data: applicationId }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Something went wrong' }
    }
}

export const updateApplicationStatus = async (applicationId: string, updates: { status?: typeof applications.$inferInsert.status, rejectReason?: string }) => {
    try {
        const session = await verifySession(false, "admin")
        if (!session) return { success: false, message: "Unauthorized" }

        const applicationData = await db.update(applications)
            .set({ ...updates })
            .where(eq(applications.applicationId, applicationId))
            .returning({
                applicantId: applications.applicantId,
                type: applications.type
            })

        const { status } = updates
        let messageContent = ''
        let serviceId = ''
        let serviceType = ''

        if (status && (status === 'approved' || status === 'rejected')) {
            switch (applicationData[0].type) {
                case 'staff_application': {
                    await db.update(staffs)
                        .set({ isVerified: status === 'approved' })
                        .where(eq(staffs.staffId, applicationData[0].applicantId))

                    if (status === 'approved') {
                        messageContent = ApplicationMessages.staff.APPROVAL
                    } else {
                        messageContent = ApplicationMessages.staff.REJECTION
                    }
                    break
                }
                case 'service_application': {
                    const serviceResult = (await db.update(services)
                        .set({ isActive: status === 'approved' })
                        .where(eq(services.serviceId, applicationData[0].applicantId))
                        .returning({ serviceId: services.serviceId, type: services.type }))[0]
                    serviceId = serviceResult.serviceId
                    serviceType = serviceResult.type || ''

                    if (status === 'approved') {
                        messageContent = serviceResult.type === 'install'
                            ? ApplicationMessages.service.INSTALL_APPROVAL
                            : ApplicationMessages.service.APPROVAL
                    } else {
                        messageContent = ApplicationMessages.service.REJECTION
                    }
                    break
                }
                case 'subscription_application': {
                    await db.update(subscriptions)
                        .set({ isActive: status === 'approved' })
                        .where(eq(subscriptions.subscriptionId, applicationData[0].applicantId))

                    if (status === 'approved') {
                        messageContent = ApplicationMessages.subscription.APPROVAL
                    } else {
                        messageContent = ApplicationMessages.subscription.REJECTION
                    }
                    break
                }
                case 'seller_application': {
                    await db.update(sellers)
                        .set({ isVerified: status === 'approved' })
                        .where(eq(sellers.sellerId, applicationData[0].applicantId))

                    messageContent = status === 'approved'
                        ? SellerMessages.APPROVAL
                        : SellerMessages.REJECTION
                    break
                }
                case 'vip_card_application': {
                    const customer = await db.query.customers.findFirst({
                        where: eq(customers.customerId, applicationData[0].applicantId)
                    });

                    const updates: any = { vipStatus: status };
                    if (status === 'approved') {
                        let vipCardNumber = customer?.vipCardNumber;
                        if (!vipCardNumber) {
                            vipCardNumber = generateVipCardNumber();
                        }
                        const expiryDate = new Date();
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                        updates.vipCardNumber = vipCardNumber;
                        updates.vipExpiryDate = expiryDate;
                    } else {
                        updates.vipExpiryDate = null;
                    }

                    await db.update(customers)
                        .set(updates)
                        .where(eq(customers.customerId, applicationData[0].applicantId));

                    if (status === 'approved') {
                        messageContent = ApplicationMessages.vip_card.APPROVAL;
                    } else {
                        messageContent = ApplicationMessages.vip_card.REJECTION;
                    }
                    break;
                }
            }

            const applicantData = await db
                .select({
                    name: sql<string>`coalesce(${staffs.name}, ${services.customerName}, ${subscriptions.name}, ${sellers.ownerName})`.as('name'),
                    phone: sql<string>`coalesce(${staffs.phone}, ${services.customerPhone}, ${subscriptions.phone}, ${sellers.phone})`.as('phone'),
                })
                .from(applications)
                .leftJoin(staffs, eq(staffs.staffId, applications.applicantId))
                .leftJoin(services, eq(services.serviceId, applications.applicantId))
                .leftJoin(subscriptions, eq(subscriptions.subscriptionId, applications.applicantId))
                .leftJoin(sellers, eq(sellers.sellerId, applications.applicantId))
                .where(eq(applications.applicationId, applicationId))

            const fullMessage = renderText(
                messageContent,
                {
                    applicant_name: applicantData[0].name,
                    seller_id: applicationData[0].applicantId,
                    service_id: serviceId,
                    card_number: (status === 'approved' && applicationData[0].type === 'vip_card_application') ? (await db.query.customers.findFirst({ where: eq(customers.customerId, applicationData[0].applicantId), columns: { vipCardNumber: true } }))?.vipCardNumber : '',
                    tracking_link: generateUrl(
                        applicationData[0].type === 'service_application' ? 'service-tracking' : 'application-tracking',
                        { trackingId: applicationData[0].type === 'service_application' ? serviceId : applicationId }
                    ),
                }
            );

            const { notifyCustomer, notifyStaff } = await import("./notificationActions");

            if (applicationData[0].type === 'seller_application') {
                await sendSMS(applicantData[0].phone, fullMessage);
            } else if (applicationData[0].type === 'staff_application') {
                await notifyStaff({
                    staffId: applicationData[0].applicantId,
                    phoneNumber: applicantData[0].phone,
                    type: 'application_update',
                    message: fullMessage,
                    link: '/staff/profile'
                });
            } else {
                // For service and subscription applications
                // Try to find if they are a registered customer
                const customerRecord = await db.query.customers.findFirst({
                    where: eq(customers.phone, applicantData[0].phone)
                });

                if (customerRecord) {
                    await notifyCustomer({
                        customerId: customerRecord.customerId,
                        phoneNumber: applicantData[0].phone,
                        type: 'application_update',
                        message: fullMessage,
                        link: '/customer/profile'
                    });
                } else {
                    await sendSMS(applicantData[0].phone, fullMessage);
                }
            }

            if (applicationData[0].type === 'service_application' && status === 'approved') {
                try {
                    const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
                    const broadcastIds = getMramBroadcastIds();
                    if (broadcastIds) {
                        if (serviceType === 'install' && broadcastIds.installation_requested) {
                            sendVoiceCall(applicantData[0].phone, broadcastIds.installation_requested, `Installation Requested ${serviceId}`).catch(e => console.error(e));
                        } else if (broadcastIds.service_requested) {
                            sendVoiceCall(applicantData[0].phone, broadcastIds.service_requested, `Service Requested ${serviceId}`).catch(e => console.error(e));
                        }
                    }
                } catch (e) {
                    console.error("Failed to send MRAM voice call:", e);
                }
            }
        }

        revalidatePath('/applications')
        return { success: true, message: 'Application status updated' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Something went wrong' }
    }
}

export const deleteApplication = async (applicationId: string) => {
    try {
        const session = await verifySession(false, "admin")
        if (!session) return { success: false, message: "Unauthorized" }

        const applicationData = await db.delete(applications)
            .where(eq(applications.applicationId, applicationId))
            .returning({ applicantId: applications.applicantId, type: applications.type })

        switch (applicationData[0].type) {
            case 'service_application': {
                const { deleteService } = await import("./serviceActions");
                await deleteService(applicationData[0].applicantId)
                revalidatePath('/services')
                break;
            }
            case 'staff_application': {
                const { deleteStaff } = await import("./staffActions");
                await deleteStaff(applicationData[0].applicantId)
                revalidatePath('/staffs')
                break;
            }
            case 'subscription_application': {
                const { deleteSubscriber } = await import("./subscriptionActions");
                await deleteSubscriber(applicationData[0].applicantId)
                revalidatePath('/subscriptions')
                break;
            }
            case 'seller_application': {
                const { deleteSeller } = await import("./sellerActions");
                await deleteSeller(applicationData[0].applicantId)
                revalidatePath('/sellers')
                break;
            }
        }

        revalidatePath('/applications')
        return { success: true, message: 'Application deleted' }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Something went wrong' }
    }
}