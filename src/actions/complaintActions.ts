"use server";

import { db } from "@/db/drizzle";
import { services, staffComplaints, staffs } from "@/db/schema";
import { generateRandomId } from "@/utils";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyCustomerSession } from "@/actions/customerActions";

const ComplaintSchema = z.object({
  customerId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  subject: z.string().min(1),
  description: z.string().min(1),
});

export async function submitComplaint(_prevState: any, formData: FormData) {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = Object.fromEntries(formData);
    const validated = ComplaintSchema.parse(rawData);
    if (validated.customerId !== session.customer.customerId) {
      return { success: false, message: "Unauthorized" };
    }
    const complaintId = generateRandomId();
    let evidencePhotoKey: string | null = null;

    if (rawData.evidence && (rawData.evidence as File).size > 0) {
      const { v4: uuidv4 } = await import("uuid");
      const { compressImage } = await import("@/lib/sharp");
      const { putObject } = await import("@/lib/s3");

      const file = rawData.evidence as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const compressedBuffer = await compressImage(buffer, "product" as any);
      
      evidencePhotoKey = `media/complaints/${complaintId}/evidence_${uuidv4()}.webp`;
      
      await putObject({
        Key: evidencePhotoKey,
        Body: compressedBuffer,
        ContentType: "image/webp",
      });
    }

    const { adminNotifications, customers, staffs } = await import("@/db/schema");
    const { contactDetails } = await import("@/constants");
    const { sendSMS } = await import("@/lib");

    // 1. Verify serviceId if provided
    if (validated.serviceId) {
      const serviceExists = await db.query.services.findFirst({
        where: (s, { eq }) => eq(s.serviceId, validated.serviceId as string),
      });
      if (!serviceExists) {
        throw new Error("INVALID_SERVICE_ID");
      }
    }

    // 2. Insert the complaint
    await db.insert(staffComplaints).values({
      complaintId: complaintId,
      ...validated,
      evidencePhotoKey: evidencePhotoKey,
    });

    // 2. Fetch customer and staff info for notification
    const customer = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.customerId, validated.customerId),
    });
    const staff = await db.query.staffs.findFirst({
      where: (s, { eq }) => eq(s.staffId, validated.staffId),
    });

    // 3. Create admin notification
    await db.insert(adminNotifications).values({
      type: "complaint",
      message: `New complaint (${complaintId}) filed by ${customer?.name} against ${staff?.name}.`,
      link: `/complaints`,
    });

    // 4. Send SMS to admin
    const adminSMS = `New Complaint Alert!\nID: ${complaintId}\nCustomer: ${customer?.name}\nStaff: ${staff?.name}\nSubject: ${validated.subject}\nCheck dashboard for details.`;
    await sendSMS(contactDetails.sms, adminSMS);

    revalidatePath("/customer/profile");
    revalidatePath("/customer/complain/history");
    revalidatePath("/complaints");
    
    return {
      success: true,
      data: complaintId,
      message: "Complaint submitted successfully. Admin will review it.",
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return { success: false, message: "Please fill all required fields." };
    }
    if (error instanceof Error && error.message === "INVALID_SERVICE_ID") {
      return { success: false, message: "সার্ভিস আইডিটি সঠিক নয়। অনুগ্রহ করে সঠিক আইডি দিন অথবা খালি রাখুন।" };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}




export async function getComplaintsByCustomer(customerId: string) {
  try {
    const data = await db
      .select({
        complaint: staffComplaints,
        staff: {
          name: staffs.name,
          phone: staffs.phone,
          role: staffs.role,
        },
        service: services,
      })
      .from(staffComplaints)
      .leftJoin(staffs, eq(staffComplaints.staffId, staffs.staffId))
      .leftJoin(services, eq(staffComplaints.serviceId, services.serviceId))
      .where(eq(staffComplaints.customerId, customerId))
      .orderBy(desc(staffComplaints.createdAt));

    // Map the join result to the expected structure
    const formattedData = data.map((row) => ({
      ...row.complaint,
      staff: row.staff,
      service: row.service,
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch complaints" };
  }
}

export async function getAllComplaints() {
  try {
    const data = await db.query.staffComplaints.findMany({
      with: {
        customer: {
          columns: {
            name: true,
            phone: true,
          },
        },
        staff: {
          columns: {
            name: true,
            phone: true,
          },
        },
      },
      limit: 100, // Safety limit to prevent ETIMEDOUT on large datasets
      orderBy: (complaints, { desc }) => [desc(complaints.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error in getAllComplaints:", error);
    return { success: false, message: "Could not fetch complaints" };
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: "under_trial" | "processing" | "hearing" | "completed",
  adminNote?: string,
  customerNote?: string,
  extraData?: {
    hearingOfficer?: { name: string; phone: string; designation: string };
    punishment?: {
      type: string;
      startDate?: string;
      endDate?: string;
      fineAmount?: string;
      newPosition?: string;
    };
  }
) {
  try {
    const { eq } = await import("drizzle-orm");
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (adminNote) {
      updateData.adminNote = adminNote;
    }
    if (customerNote) {
      updateData.customerNote = customerNote;
    }

    if (extraData?.hearingOfficer) {
      updateData.hearingOfficerName = extraData.hearingOfficer.name;
      updateData.hearingOfficerPhone = extraData.hearingOfficer.phone;
      updateData.hearingOfficerDesignation =
        extraData.hearingOfficer.designation;
    }

    if (extraData?.punishment) {
      updateData.punishmentType = extraData.punishment.type;
      updateData.punishmentStartDate = extraData.punishment.startDate;
      updateData.punishmentEndDate = extraData.punishment.endDate;
      updateData.punishmentFineAmount = extraData.punishment.fineAmount;
      updateData.punishmentNewPosition = extraData.punishment.newPosition;
    }

    await db
      .update(staffComplaints)
      .set(updateData)
      .where(eq(staffComplaints.complaintId, complaintId));

    // Notify the parties by SMS on every status change (and the officer when assigned).
    // Failures are logged only; they must never block the status update.
    try {
      await notifyComplaintStatusSMS(complaintId, newStatus, extraData?.hearingOfficer);
    } catch (smsError) {
      console.error("complaint status SMS failed:", smsError);
    }

    revalidatePath("/complaints");
    revalidatePath(`/customer/complain/doc/${complaintId}`);
    return {
      success: true,
      message: `Complaint status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update complaint status" };
  }
}

export async function getComplaintById(complaintId: string) {
  try {
    const data = await db.query.staffComplaints.findFirst({
      where: (complaints, { eq }) => eq(complaints.complaintId, complaintId),
      with: {
        customer: {
          columns: {
            name: true,
            phone: true,
            address: true,
            customerId: true,
          },
        },
        staff: {
          columns: {
            name: true,
            phone: true,
            staffId: true,
            role: true,
            currentDistrict: true,
          },
        },
        service: true,
      },
    });
    if (!data) return { success: false, message: "Complaint not found" };
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch complaint" };
  }
}

export async function getComplaintsByStaff(staffId: string, all: boolean = false) {
  try {
    const data = await db.query.staffComplaints.findMany({
      where: (complaints, { eq, and, ne }) =>
        all
          ? eq(complaints.staffId, staffId)
          : and(eq(complaints.staffId, staffId), ne(complaints.status, "completed")),
      with: {
        customer: {
          columns: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: (complaints, { desc }) => [desc(complaints.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch staff complaints" };
  }
}


/** Bangla digits → ASCII (officer phones are stored with Bangla numerals). */
function toAsciiDigits(v: string) {
  return v.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[^\d+]/g, "");
}

const PUNISHMENT_BN: Record<string, string> = {
  warning: "তিরস্কার ও সতর্কীকরণ",
  fine: "আর্থিক জরিমানা",
  suspension: "সাময়িক বরখাস্ত",
  demotion: "পদাবনতি",
  termination: "চাকুরি অবসান",
  not_guilty: "দোষী সাব্যস্ত হননি",
};

async function notifyComplaintStatusSMS(
  complaintId: string,
  newStatus: "under_trial" | "processing" | "hearing" | "completed",
  officer?: { name: string; phone: string; designation: string },
) {
  const { sendSMS } = await import("@/lib");
  const c = await db.query.staffComplaints.findFirst({
    where: (t, { eq }) => eq(t.complaintId, complaintId),
    with: {
      customer: { columns: { name: true, phone: true } },
      staff: { columns: { name: true, phone: true, staffId: true } },
    },
  });
  if (!c) return;
  const customerPhone = c.customer?.phone;
  const staffPhone = c.staff?.phone;
  const staffName = c.staff?.name || "";
  const sends: Promise<unknown>[] = [];
  const send = (phone: string | null | undefined, msg: string) => {
    if (phone) sends.push(sendSMS(toAsciiDigits(phone), msg).catch((e) => console.error("SMS error:", e)));
  };

  if (newStatus === "processing") {
    send(customerPhone, `SE Electronics: আপনার অভিযোগ (${complaintId}) প্রক্রিয়াধীন রয়েছে। শীঘ্রই তদন্ত শুরু হবে।`);
    send(staffPhone, `SE Electronics: আপনার বিরুদ্ধে একটি অভিযোগ (${complaintId}) প্রক্রিয়াধীন রয়েছে। অ্যাপে বিস্তারিত দেখুন।`);
  } else if (newStatus === "hearing") {
    const off = officer || (c.hearingOfficerPhone ? { name: c.hearingOfficerName || "", phone: c.hearingOfficerPhone, designation: c.hearingOfficerDesignation || "" } : undefined);
    if (off) {
      send(off.phone, `SE Electronics: অভিযোগ ${complaintId} এর তদন্ত/শুনানির দায়িত্ব আপনাকে দেওয়া হয়েছে। অভিযুক্ত: ${staffName} (${c.staffId})। ড্যাশবোর্ডে বিস্তারিত দেখুন।`);
    }
    const offText = off ? ` দায়িত্বপ্রাপ্ত কর্মকর্তা: ${off.name}, ${toAsciiDigits(off.phone)}` : "";
    send(customerPhone, `SE Electronics: আপনার অভিযোগ (${complaintId}) এর শুনানি চলছে।${offText}`);
    send(staffPhone, `SE Electronics: অভিযোগ ${complaintId} এর শুনানি শুরু হয়েছে।${offText}`);
  } else if (newStatus === "completed") {
    const p = c.punishmentType ? PUNISHMENT_BN[c.punishmentType] || c.punishmentType : "";
    send(customerPhone, `SE Electronics: আপনার অভিযোগ (${complaintId}) নিষ্পত্তি হয়েছে।${p ? ` গৃহীত ব্যবস্থা: ${p}।` : ""} অ্যাপে বিস্তারিত দেখুন।`);
    send(staffPhone, `SE Electronics: অভিযোগ ${complaintId} নিষ্পত্তি হয়েছে।${p ? ` সিদ্ধান্ত: ${p}।` : ""} অ্যাপে বিস্তারিত দেখুন।`);
  } else if (newStatus === "under_trial") {
    send(customerPhone, `SE Electronics: আপনার অভিযোগ (${complaintId}) বিচারাধীন রয়েছে।`);
  }
  await Promise.all(sends);
}
