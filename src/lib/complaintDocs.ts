import "server-only";

import {
  ComplaintGdCopyTemplateData,
  CompletionNoticeTemplateData,
} from "@/app/pdf/download/actions/pdfTypes";
import { COMPLAINT_STATUS_BN, complaintCustomerStandingBn, complaintIncidentDateBn, complaintOfficerSealFile } from "@/constants/complaintData";
import { brandUrl } from "@/constants/domains";
import { getBaseUrl } from "@/utils";
import fs from "fs";
import path from "path";

/**
 * Builds the template data for the complaint documents that are rendered in two
 * places: the puppeteer PDF (generatePDF) and the on-screen view/print page
 * (/complaint-doc/[complaintId]). Keeping it here guarantees both look the same.
 */

/** The subset of a complaint row (with relations) the documents need. */
export type ComplaintDocSource = {
  complaintId: string;
  staffId: string;
  serviceId: string | null;
  subject: string;
  description: string;
  status: string;
  adminNote: string | null;
  customerNote: string | null;
  hearingOfficerName: string | null;
  hearingOfficerPhone: string | null;
  hearingOfficerDesignation: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** From getComplaintById: is the customer's warranty active right now. */
  warrantyActive?: boolean;
  customer?: { name: string | null; phone: string | null; address: string | null; customerId: string | null } | null;
  staff?: { name: string | null; phone: string | null; role: string | null } | null;
  service?: {
    type: string | null;
    productType: string | null;
    productModel: string | null;
    memoNumber: string | null;
    createdAt?: Date | string | null;
  } | null;
};

const PRODUCT_BN: Record<string, string> = {
  fridge: "ফ্রিজ",
  ac: "এসি / এয়ারকন্ডিশন",
  tv: "টিভি",
  oven: "ওভেন",
  washing_machine: "ওয়াশিং মেশিন",
  mobile: "মোবাইল",
  ips: "আইপিএস (IPS)",
  battery: "ব্যাটারি",
  ips_package: "আইপিএস প্যাকেজ",
  stabilizer: "ভোল্টেজ স্ট্যাবিলাইজার",
  blender: "ব্লেন্ডার",
  others: "অন্যান্য",
};

const STAFF_ROLE_BN: Record<string, string> = {
  technician: "টেকনিশিয়ান",
  electrician: "ইলেকট্রিশিয়ান",
};

const imageDataUri = async (file: string): Promise<string | undefined> => {
  try {
    const buf = await fs.promises.readFile(path.join(process.cwd(), "src", "assets", "images", file));
    const mime = file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
};

/** Bangla date (+ time) in Bangladesh time, independent of the server timezone. */
const bnDate = (d: Date | string, withTime = false) =>
  new Date(d).toLocaleString("bn-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}),
  });

const customerBaseUrl = () =>
  (brandUrl("customer", process.env.CUSTOMER_APP_URL) ?? getBaseUrl()).replace(/\/$/, "");

/**
 * Public URL a complaint document's QR code points at. It opens the public
 * verify page, which shows the complaint's status only (no personal data).
 */
export function complaintVerifyUrl(complaintId: string) {
  return `${customerBaseUrl()}/complaint-verify/${encodeURIComponent(complaintId)}`;
}

/** Absolute link (for SMS) to the customer-absent notice; opening it requires the customer's login. */
export function complaintAbsentNoticeUrl(complaintId: string) {
  return `${customerBaseUrl()}/complaint-doc/${encodeURIComponent(complaintId)}?doc=absent-notice`;
}

/** GD-style complaint copy (docType `complaint_customer`). */
export async function buildComplaintGdCopyData(c: ComplaintDocSource): Promise<ComplaintGdCopyTemplateData> {
  const { qrcode } = await import("@/lib/id-gen");
  const verifyUrl = complaintVerifyUrl(c.complaintId);
  const [logo, documentSeal, officerSign, qr] = await Promise.all([
    imageDataUri("logo.jpg"),
    imageDataUri("documentSeal.jpeg"),
    imageDataUri(complaintOfficerSealFile(c.hearingOfficerName)),
    qrcode(verifyUrl, 1),
  ]);

  return {
    complaintId: c.complaintId,
    filedAtBn: bnDate(c.createdAt, true),
    updatedAtBn: bnDate(c.updatedAt, true),
    customer: {
      name: c.customer?.name || "",
      customerId: c.customer?.customerId || "",
      phone: c.customer?.phone || "",
      address: c.customer?.address || "",
    },
    staff: {
      name: c.staff?.name || "",
      staffId: c.staffId || "",
      role: STAFF_ROLE_BN[c.staff?.role || ""] || c.staff?.role || "",
    },
    service: {
      serviceId: c.serviceId || "",
      type: c.service ? (c.service.type === "install" ? "ইনস্টলেশন" : "সার্ভিস / মেরামত") : "",
      product: c.service?.productType ? PRODUCT_BN[c.service.productType] || c.service.productType : "",
      model: c.service?.productModel || "",
      memoNumber: c.service?.memoNumber || "",
    },
    subject: c.subject,
    description: c.description,
    customerStandingBn: complaintCustomerStandingBn(c.warrantyActive),
    incidentDateBn: complaintIncidentDateBn(c),
    statusBn: COMPLAINT_STATUS_BN[c.status] || c.status,
    officer: {
      name: c.hearingOfficerName || "",
      designation: c.hearingOfficerDesignation || "",
      phone: c.hearingOfficerPhone || "",
    },
    verifyUrl,
    qrcode: qr,
    logo,
    documentSeal,
    officerSign,
  };
}

/** Customer-absent (ex-parte) notice (docType `ex-parte-notice`). */
export async function buildExParteNoticeData(c: ComplaintDocSource): Promise<CompletionNoticeTemplateData> {
  const [logo, documentSeal, chairmanSeal, officerSign] = await Promise.all([
    imageDataUri("logo.jpg"),
    imageDataUri("documentSeal.jpeg"),
    imageDataUri("chairmanSeal.jpeg"),
    // Investigating officer = whoever the complaint is assigned to.
    imageDataUri(complaintOfficerSealFile(c.hearingOfficerName)),
  ]);

  return {
    complaintId: c.complaintId,
    customer: {
      name: c.customer?.name || "",
      customerId: c.customer?.customerId || "",
      phone: c.customer?.phone || "",
      address: c.customer?.address || "",
    },
    staff: {
      name: c.staff?.name || "",
      phone: c.staff?.phone || "",
      role: c.staff?.role || "",
      staffId: c.staffId,
    },
    subject: c.subject,
    adminNote: c.customerNote || c.adminNote || "",
    punishmentType: "",
    punishmentStartDate: "",
    punishmentEndDate: "",
    // The notice is dated the day the complaint was closed ex-parte, so every
    // later download carries the same date (before that, fall back to today).
    resolvedDateBn: bnDate(c.status === "customer_absent" ? c.updatedAt : new Date()),
    receiptNo: c.complaintId.replace(/\D/g, "").slice(0, 5) || "14285",
    logo,
    documentSeal,
    chairmanSeal,
    officerSign,
    officerName: c.hearingOfficerName || "",
    officerDesignation: c.hearingOfficerDesignation || "",
  };
}
