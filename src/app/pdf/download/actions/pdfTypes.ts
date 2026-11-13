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

export interface CustomerComplaintTemplateData {
  complaintId: string;
  serviceId: string;
  customer: {
    name: string;
    customerId: string;
    phone: string;
    address: string;
  };
  staff: {
    name: string;
    staffId: string;
  };
  subject: string;
  description: string;
  createdAt: Date;
  logo?: string;
  documentSeal?: string;
  atikurSign?: string;
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
  bgImage: string;
  planCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerId: string;
  productType: string | null;
  productModel: string;
  serialNumber: string | null;
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
  guarantorAddress: string | null;
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
