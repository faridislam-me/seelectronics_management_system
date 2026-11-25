import { BankInfo, InvoicesType, PaymentTypes, StaffsType } from "@/types";

export type PayoutPreference = "bkash" | "nagad" | "rocket" | "bank";

export interface CertificatePayload {
  type: "certificate";
  staffId?: string;
  memberNumber?: string;
  shopName?: string;
  shopId?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  district?: string;
}

export interface IdCardPayload {
  type: "id-card";
  id: string;
  issuedAt: Date;
}

export interface InvoiceTemplateData extends InvoicesType {
  bgImage: string;
}

export interface PaymentReceiptTemplateData {
  bgImage: string;
  invoiceNumber: string;
  date: Date;
  description: string | null;
  staffId: string;
  transactionId: string | null;
  paymentId: string;
  paymentMethod: PaymentTypes;
  senderWalletNumber: string | null;
  senderBankInfo: BankInfo | null;
  receiverWalletNumber: string | null;
  receiverBankInfo: BankInfo | null;
  amount: number;
  staff: {
    name: string;
  };
  serviceId?: string | null;
}

export interface IdCardTemplateData extends Omit<
  StaffsType,
  "role" | "photoUrl" | "currentPoliceStation" | "currentPostOffice"
> {
  role: "technician" | "electrician";
  photoUrl: string;
  currentPoliceStation: string;
  currentPostOffice: string;
  frontBgImage: string;
  backBgImage: string;
  issueDate: Date;
  qrcode: string;
  barcode: string;
}
export interface CertificateTemplateData extends Omit<
  StaffsType,
  "role" | "phone"
> {
  role: "technician" | "electrician";
  bgImage: string;
  issueDate: Date;
  qrcode: string;
  font1: string;
  font2: string;
  font3: string;
  memberNumber: string;
  shopName: string;
  shopId: string;
  ownerName: string;
  phone: string;
  address: string;
  district: string;
}

export interface ComplaintTemplateData {
  complaintId: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    phone: string;
    role: string;
    staffId: string;
    currentStreetAddress?: string;
    currentDistrict?: string;
  };
  productType?: string;
  subject: string;
  description: string;
  status: string;
  adminNote?: string | null;
  createdAt: Date;
  logo?: string;
}

/** GD-style (General Diary) complaint copy with a verification QR code. */
export interface ComplaintGdCopyTemplateData {
  complaintId: string;
  /** Filing date-time, already formatted in Bangla (Asia/Dhaka). */
  filedAtBn: string;
  /** Last status change, already formatted in Bangla (Asia/Dhaka). */
  updatedAtBn: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    staffId: string;
    role: string;
  };
  /** The service / product / memo the complaint concerns (all optional). */
  service: {
    serviceId: string;
    type: string;
    product: string;
    model: string;
    memoNumber: string;
  };
  subject: string;
  description: string;
  /** "আপনার প্রতিষ্ঠানের একজন … গ্রাহক" — warranty-covered only while the warranty is active. */
  customerStandingBn: string;
  /** Date the letter refers to (service date, else filing date), dd/mm/yyyy in Bangla digits. */
  incidentDateBn: string;
  statusBn: string;
  officer: {
    name: string;
    designation: string;
    phone: string;
  };
  /** Public verification URL encoded in the QR code. */
  verifyUrl: string;
  /** QR code as a PNG data URI. */
  qrcode: string;
  logo?: string;
  documentSeal?: string;
  officerSign?: string;
}

export interface HearingNoticeTemplateData {
  complaintId: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    phone: string;
    role: string;
    staffId: string;
  };
  subject: string;
  adminNote: string;
  issueDateBn: string;
  receiptNum: string;
  orderNum: string;
  logo?: string;
  documentSeal?: string;
  atikurSign?: string;
  ajomSign?: string;

  officerName?: string;
  officerDesignation?: string;
}

export interface CompletionNoticeTemplateData {
  complaintId: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    phone: string;
    role: string;
    staffId: string;
  };
  subject: string;
  adminNote: string;
  punishmentType?: string;
  punishmentStartDate?: string;
  punishmentEndDate?: string;
  resolvedDateBn: string;
  receiptNo: string;
  logo?: string;
  documentSeal?: string;
  chairmanSeal?: string;
  /** Investigating officer's signature image (e.g. Atikur Rahman), used as the
   *  second signatory on the ex-parte notice. */
  officerSign?: string;
  officerName?: string;
  officerDesignation?: string;
}

export interface StaffNotGuiltyTemplateData {
  complaintId: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    phone: string;
    role: string;
    staffId: string;
  };
  subject: string;
  adminNote: string;
  resolvedDateBn: string;
  receiptNo: string;
  logo?: string;

  documentSeal?: string;
  atikurSign?: string;
  chairmanSign?: string;
  officerName?: string;
  officerDesignation?: string;
}

export interface InstallmentScheduleRow {
  installmentNo: number;
  dueDate: Date;
  amount: number;
  status: string;
  paidAmount: number;
  paidAt: Date | null;
  paymentMethod: string | null;
}

export interface InstallmentInvoiceTemplateData {
  /** Official SE Electronics installment pad/letterhead as a full-page
   *  background image (header, round seal, watermark, notes, signatures,
   *  customer-app QR and footer are all baked into this image). The template
   *  only overlays the dynamic invoice data onto the empty middle region. */
  padBg?: string;
  /** Legacy full-page background image (no longer required by the letterhead). */
  bgImage?: string;
  /** Branded letterhead assets (all optional, base64 data URIs / SVG). */
  logo?: string;
  seal?: string;
  managerSign?: string;
  chairmanSign?: string;
  headerQr?: string;
  appQr?: string;
  barcodeSvg?: string;
  serial?: string;
  planCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerId: string;
  productType: string | null;
  productModel: string;
  productBrand: string | null;
  /** Capacity / size, e.g. "১.৫ টন" or "৩২ ইঞ্চি". */
  productSpec: string | null;
  vaWatt: string | null;
  volt: string | null;
  displayType: string | null;
  serialNumber: string | null;
  /** Product/category photo as a data URI or absolute URL (puppeteer-loadable). */
  productImage: string | null;
  cashPrice: number;
  extraCharge: number;
  totalPayable: number;
  downPayment: number;
  financedAmount: number;
  months: number;
  monthlyAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  guarantorName: string | null;
  guarantorPhone: string | null;
  notes: string | null;
  schedule: InstallmentScheduleRow[];
  paidTotal: number;
  remainingTotal: number;
  paidCount: number;
}

/** One paid installment line on the payment receipt. */
export interface InstallmentReceiptRow {
  installmentNo: number;
  dueDate: Date | string;
  paidAt: Date | string | null;
  amount: number;
  paidAmount: number;
  paymentMethod: string | null;
  transactionId: string | null;
  paymentNumber: string | null;
}

/**
 * Standalone payment receipt — the installment invoice is an agreement and no
 * longer tracks per-installment dues (PR #199), so paid-installment accounting
 * lives in this separate, downloadable receipt instead.
 */
export interface InstallmentReceiptTemplateData {
  logo: string;
  documentSeal?: string;
  chairmanSeal?: string;
  chairmanSign?: string;
  planCode: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  customerAddress: string | null;
  productType: string | null;
  productModel: string;
  months: number;
  monthlyAmount: number;
  financedAmount: number;
  rows: InstallmentReceiptRow[];
  paidTotal: number;
  paidCount: number;
  remainingTotal: number;
  remainingCount: number;
  generatedAt: Date | string;
}

/**
 * "No Objection Certificate" issued when a plan is fully paid — certifies the
 * customer has cleared the entire installment amount and the company has no
 * further claim. Renders on the SE letterhead with a paid-installment table.
 */
export interface InstallmentNocTemplateData {
  bgImage: string;
  planCode: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  customerAddress: string | null;
  productType: string | null;
  productModel: string;
  productBrand: string | null;
  serialNumber: string | null;
  productImage: string | null;
  financedAmount: number;
  totalPayable: number;
  downPayment: number;
  months: number;
  startDate: Date;
  endDate: Date;
  /** True only when every scheduled installment is paid. */
  fullyPaid: boolean;
  rows: InstallmentReceiptRow[];
  paidTotal: number;
  paidCount: number;
  issuedDate: Date | string;
  /** Monthly installment amount, shown as "কিস্তির পরিমাণ". */
  monthlyAmount: number;
  /** Letterhead/certificate assets (base64), each optional and guarded on render. */
  logo?: string;
  seal?: string;
  officerSign?: string;
  /** Manager signature block (name + title + signature) for the left slot. */
  managerSign?: string;
  chairmanSign?: string;
  /** Chairman name seal (printed name + "চেয়ারম্যান") paired with the signature. */
  chairmanSeal?: string;
  qrcode?: string;
}

export interface InstallmentStickerTemplateData {
  planCode: string;
  productModel: string;
  /** Human-readable product category label, e.g. "আইপিএস (IPS)". */
  productType: string | null;
  serialNumber: string | null;
  /** Cash price printed as প্রাইজ. */
  price: number;
  months: number;
  /**
   * Optional product specs — rendered only when a value is present. The
   * electrical trio (VA/Watt, Volt, Display) is also gated on `isElectrical`
   * so a fridge/other unit shows its own relevant fields instead of IPS-only
   * ones. These are free-text so the sticker can carry real data as the plan
   * schema grows to capture them.
   */
  vaWatt?: string | null;
  volt?: string | null;
  display?: string | null;
  productName?: string | null;
  brand?: string | null;
  /** True for IPS-like units that have VA/Watt, Volt and Display specs. */
  isElectrical: boolean;
  /** base64 company logo. */
  logo: string;
  /** Code 128 barcode as inline SVG markup. */
  barcode: string;
  /** base64 QR code (encodes the plan code). */
  qrcode: string;
}

/** A labelled document image (signed R2 URL) for the installment customer file. */
export interface DocImage {
  label: string;
  url: string | null;
}

/** Full customer file (profile + KYC images of customer and guarantor) for print/PDF. */
export interface InstallmentDocumentsTemplateData {
  logo: string;
  planCode: string;
  status: string;
  createdAt: Date | string | null;
  // Customer
  customerName: string;
  customerId: string;
  customerPhone: string;
  customerAddress: string | null;
  fatherName: string | null;
  motherName: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  isRenting: boolean;
  landlordName: string | null;
  landlordPhone: string | null;
  // Product / terms (condition)
  productType: string | null;
  productModel: string;
  productBrand: string | null;
  productSpec: string | null;
  serialNumber: string | null;
  cashPrice: number | null;
  extraCharge: number | null;
  totalPayable: number | null;
  downPayment: number | null;
  financedAmount: number | null;
  months: number | null;
  monthlyAmount: number | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  // Guarantor
  guarantorName: string | null;
  guarantorPhone: string | null;
  /** Guarantor's current address. */
  guarantorAddress: string | null;
  guarantorPermanentAddress: string | null;
  guarantorLandlordName: string | null;
  guarantorLandlordPhone: string | null;
  // Images (signed URLs)
  customerImages: DocImage[];
  guarantorImages: DocImage[];
}

export interface PunishmentTemplateData {
  orderNumber?: string;
  customerName: string;
  customerId: string;
  complaintDate: string;
  staffName: string;
  staffId: string;
  staffRole?: string;
  staffOffice?: string;
  trackingNumber: string;
  subject: string;
  description: string;
  investigationResult?: string;
  punishment: "warning" | "fine" | "suspension" | "demotion" | "termination";
  punishmentStartDate?: string;
  punishmentEndDate?: string;
  fineAmount?: string;
  newPosition?: string;
  adminNote?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  companyName?: string;
  documentSeal?: string;
  atikurSign?: string;
  chairmanSign?: string;
}
