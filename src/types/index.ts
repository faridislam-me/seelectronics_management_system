export type UrlConfig =
  | { type: "registration"; params: { token: string } }
  | { type: "seller-registration"; params: { token: string } }
  | { type: "seller-login"; params?: {} }
  | { type: "feedback"; params: { serviceId: string } }
  | { type: "application-tracking"; params: { trackingId: string } }
  | { type: "service-tracking"; params: { trackingId: string } }
  | { type: "service-report"; params: { serviceId: string } }
  | { type: "invoice-download"; params: { token: string } }
  | { type: "id-card-download"; params: { token: string } }
  | { type: "certificate-download"; params: { token: string } }
  | { type: "customer-login"; params?: {} };

export type ProductTypes = "ips" | "battery" | "stabilizer" | "others";
export type ApplicationTypes =
  | "service_application"
  | "staff_application"
  | "subscription_application"
  | "vip_card_application"
  | "seller_application";
export type DocType =
  | "invoice"
  | "payment"
  | "id-card"
  | "certificate"
  | "complaint"
  | "complaint_customer"
  | "hearing-notice"
  | "completion-notice"
  | "staff-not-guilty";

export type CertificateData = {
  staffId?: string;
  memberNumber: string;
  shopName: string;
  shopId: string;
  ownerName: string;
  phone: string;
  address: string;
  district: string;
};

export type SearchParams = { query?: string; page?: string; limit?: string };

export type CustomerData = {
  name: string;
  id: string;
  customerId: string;
  phone: string;
  address: string;
  invoiceNumber: string;
  vipCardNumber?: string | null;
  vipStatus?: Statuses | null;
  referredByVipCard?: string | null;
  referralBalance?: number | null;
  isWarrantyStopped: boolean;
  warrantyStoppedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  invoice: InvoicesType;
  referredByRecord?: {
    id: string;
    referrerCustomerId: string;
    referrerVipCard: string;
    bonusEarned: number;
    createdAt: Date;
    referrer: {
      name: string;
      customerId: string;
      vipCardNumber: string;
    };
  } | null;
};

export type Product = {
  id: string;
  type: "ips" | "battery" | "stabilizer" | "others";
  invoiceId: string;
  model: string;
  quantity: number;
  unitPrice: number;
  warrantyStartDate: Date;
  warrantyDurationMonths: number;
};

export type Application = {
  id: string;
  applicationId: string;
  applicantId: string;
  type: ApplicationTypes;
  status: Statuses;
  statusHistory: any;
  createdAt: Date;
  updatedAt: Date;
  applicantName: string;
  applicantPhone: string;
  applicantDistrict: string;
  rejectReason: string | null;
};

export type FormState =
  | {
      success: boolean;
      message?: string;
    }
  | undefined;

export type Address = {
  address: string;
  district: string;
  policeStation: string;
  postOffice: string;
};

export type BankInfo = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
};

export type StaffsType = {
  name: string;
  fatherName: string;
  currentStreetAddress: string;
  currentDistrict: string;
  currentPoliceStation: string | null;
  currentPostOffice: string | null;
  permanentStreetAddress: string;
  permanentDistrict: string;
  permanentPoliceStation: string | null;
  permanentPostOffice: string | null;
  hasInstallationExperience: boolean;
  installationExperienceYears: number | null;
  isVerified: boolean;
  paymentPreference: PaymentTypes;
  walletNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  role: "technician" | "electrician";
  staffId: string;
  phone: string;
  photoKey: string;
  photoUrl?: string | null;
  nidFrontPhotoKey: string;
  nidFrontPhotoUrl?: string | null;
  nidBackPhotoKey: string;
  nidBackPhotoUrl?: string | null;
  hasRepairExperience: boolean;
  repairExperienceYears: number | null;
  bankInfo: BankInfo | null;
  createdFrom: "public_form" | "dashboard";
  ipAddress: string | null;
  userAgent: string | null;
  docs: string | null;
  skills: string | null;
  bio: string | null;
  profileCompleted: boolean;
  rating: number | null;
  totalServices: number | null;
  successfulServices: number | null;
  canceledServices: number | null;
  isActiveStaff: boolean | null;
  serviceCenterServices: number | null;
  smsNotificationEnabled: boolean;
  smsWorkingHoursOnly: boolean;
  smsFrequency: SMSFrequency;
  smsOptOut: boolean;
};

export type StaffServiveReport = {
  resolved: boolean;
  explanation?: string;
  travelCost?: number;
  reason?: string;
  totalCost?: number;
};

export type ServicesType = {
  id: string;
  serviceId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerAddressDistrict: string | null;
  customerAddressPoliceStation: string | null;
  customerAddressPostOffice: string | null;
  staffId: string | null;
  staffRole: "technician" | "electrician" | null;
  staffName: string | null;
  staffPhone: string | null;
  staffReport: StaffServiveReport | null;
  type: "install" | "repair";
  status: Statuses;
  statusHistory: {
    customNote: string | null;
    customLabel: string | null;
    cancelReason: string | null;
    id: string;
    status: Statuses;
    statusType: "system" | "custom";
  }[];
  productType: ProductTypes;
  productModel: string;
  ipsBrand: string | null;
  productFrontPhotoKey: string | null;
  productBackPhotoKey: string | null;
  warrantyCardPhotoKey: string | null;
  powerRating: string | null;
  memoNumber: string | null;
  reportedIssue: string | null;
  createdFrom: "public_form" | "dashboard";
  isActive: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoicesType = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  paymentType: PaymentTypes;
  subtotal: number;
  total: number;
  dueAmount: number;
  dueType: "due" | "installment";
  notes?: string | null;
  customerPhone: string;
  products?: Product[];
  serviceId?: string | null;
};

export type PaymentDataType = {
  createdAt: Date;
  updatedAt: Date;
  id: string;
  date: Date;
  paymentId: string;
  invoiceNumber: string;
  paymentMethod: PaymentTypes;
  senderWalletNumber: string | null;
  receiverWalletNumber: string | null;
  transactionId: string | null;
  amount: number;
  serviceId?: string | null;
  description: string | null;
  staffId: string;
  status: Statuses;
  statusHistory?: {
    customNote: string | null;
    customLabel: string | null;
    cancelReason: string | null;
    id: string;
    status: Statuses;
    statusType: "system" | "custom";
  }[];
  staff?: StaffsType;
  service?: ServicesType | null;
  senderBankInfo: BankInfo | null;
  receiverBankInfo: BankInfo | null;
};

export type Feedback = {
  question: string;
  answer: string;
  amount?: number;
  comment?: string;
};

export type FeedbackDataType = {
  id: string;
  customerId: string | null;
  serviceId: string;
  feedbacks: Feedback[] | null;
  rating: number | null;
  service: {
    productType: ProductTypes;
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    staffId: string | null;
    staffName: string | null;
    staffPhone: string | null;
    type: "install" | "repair" | null;
    productModel: string;
  };
};

export type PaymentTypes = "cash" | "bkash" | "nagad" | "rocket" | "bank";

export type ServiceInfo = {
  serviceId: string;
  serviceType: string;
  customerId: string;
  customerName: string;
  customerPhoneNumber: string;
  customerAddress: string;
  productModel: string;
  technicianName: string;
  technicianPhoneNumber: string;
};

export type Statuses =
  | "requested"
  | "pending"
  | "in_progress"
  | "appointment_retry"
  | "service_center"
  | "completed"
  | "canceled"
  | "processing"
  | "approved"
  | "rejected"
  | "valid"
  | "expired"
  | "staff_arrived"
  | "staff_departed"
  | "credited"
  | "service_center_received";

export type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export type StarRatingProps = {
  value?: number | null;
  onChange?: (rating: number) => void;
  totalStars?: number;
  size?: number;
  readonly?: boolean;
  allowHalfStars?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  className?: string;
  showValue?: boolean;
  name?: string;
};

export type NoticePriority = "low" | "normal" | "high" | "urgent";
export type NoticeTarget = "single" | "multiple" | "all";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type SMSFrequency = "immediate" | "daily_digest";
export type SMSLogStatus = "sent" | "failed";

export type TaskType = {
  id: string;
  taskId: string;
  staffId: string;
  title: string;
  description: string;
  priority: NoticePriority;
  dueDate: Date | null;
  status: TaskStatus;
  serviceId: string | null;
  files: string[] | null;
  comments: any[] | null;
  createdAt: Date;
  updatedAt: Date;
  staff?: StaffsType;
};

export type SMSLogType = {
  id: string;
  staffId: string | null;
  phoneNumber: string;
  message: string;
  status: SMSLogStatus;
  error: string | null;
  carrier: string | null;
  createdAt: Date;
  staff?: StaffsType;
};

export type NoticeType = {
  id: string;
  noticeId: string;
  title: string;
  content: string;
  priority: NoticePriority;
  targetType: NoticeTarget;
  isDraft: boolean;
  scheduledAt: Date | null;
  expiresAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  recipients?: NoticeRecipientType[];
};

export type NoticeRecipientType = {
  id: string;
  noticeId: string;
  staffId: string;
  isRead: boolean;
  readAt: Date | null;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
  createdAt: Date;
  staff?: StaffsType;
  notice?: NoticeType;
};

export type StaffNotificationType = {
  id: string;
  staffId: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type CombinedNotificationType =
  | (NoticeRecipientType & { itemType: "notice" })
  | (StaffNotificationType & { itemType: "action" });

export type SellerBusinessType = "retail" | "wholesale" | "showroom" | "other";

export type SellersType = {
  id: string;
  sellerId: string;
  username?: string | null;
  shopName: string;
  businessType: SellerBusinessType;
  tradeLicenseNumber: string;
  businessYears: number | null;
  shopStreetAddress: string;
  shopDistrict: string;
  shopPoliceStation: string | null;
  shopPostOffice: string | null;
  ownerName: string;
  phone: string;
  nidNumber: string;
  ownerPhotoKey: string;
  ownerPhotoUrl?: string | null;
  tradeLicensePhotoKey: string;
  shopFrontPhotoKey: string;
  shopFrontPhotoUrl?: string | null;
  shopInsidePhotoKey: string | null;
  nidFrontPhotoKey: string;
  nidBackPhotoKey: string;
  isVerified: boolean;
  isActiveSeller: boolean;
  profileCompleted: boolean;
  createdFrom: "public_form" | "dashboard";
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  customersCount?: number;
  purchasedUnits?: number;
  dueAmount?: number;
};

export type SellerPurchaseType = {
  id: string;
  purchaseId: string;
  invoiceNumber: string;
  sellerId: string;
  productType: ProductTypes;
  productModel: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  note: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};
