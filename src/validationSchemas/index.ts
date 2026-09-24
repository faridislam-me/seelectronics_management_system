import {
  createdFromTypesEnum,
  noticePriorityEnum,
  noticeTargetEnum,
  paymentTypesEnum,
  productTypeEnum,
  serviceStatusEnum,
  serviceTypeEnum,
  staffRoleEnum,
  sellerBusinessTypeEnum,
  statusTypesEnum,
  subscriptionTypesEnum,
} from "@/db/schema";
import { z } from "zod";

// Local helper to handle boolean values sent as strings from forms
const formBool = () =>
  z.preprocess((val) => {
    if (val === "true" || val === "on" || val === true) return true;
    if (val === "false" || val === "off" || val === false || val === "" || val === null || val === undefined) return false;
    return !!val;
  }, z.boolean());

export const CustomerDataSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  invoice: z.object({
    date: z.coerce.date(),
    paymentType: z.enum(paymentTypesEnum.enumValues),
    subtotal: z.coerce.number(),
    total: z.coerce.number(),
    dueAmount: z.coerce.number(),
  }),
  products: z.array(
    z.object({
      type: z.enum(productTypeEnum.enumValues),
      model: z.string().min(1),
      warrantyDurationMonths: z.coerce.number(),
      warrantyStartDate: z.coerce.date(),
      quantity: z.coerce.number(),
      unitPrice: z.coerce.number(),
    }),
  ),
});

const BaseStaffDataSchema = z.object({
  name: z.string().min(1),
  fatherName: z.string().min(1),
  phone: z.string().min(1),

  currentStreetAddress: z.string().min(1),
  currentDistrict: z.string().min(1),
  currentPoliceStation: z.string().min(1),
  currentPostOffice: z.string().min(1),

  permanentStreetAddress: z.string().min(1),
  permanentDistrict: z.string().min(1),
  permanentPoliceStation: z.string().min(1),
  permanentPostOffice: z.string().min(1),

  photo: z.any(),
  nidFrontPhoto: z.any(),
  nidBackPhoto: z.any(),

  hasRepairExperience: formBool(),
  repairExperienceYears: z.coerce.number().optional(),

  hasInstallationExperience: formBool(),
  installationExperienceYears: z.coerce.number().optional(),

  paymentPreference: z.enum(paymentTypesEnum.enumValues),
  walletNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  branchName: z.string().optional(),
  docs: z.array(z.string()).optional(),
});

export const StaffDataSchema = BaseStaffDataSchema.extend({
  sendConfirmationSMS: formBool().optional(),
  agreed: formBool().optional(),
  token: z.string().optional(),
}).transform((data) => {
  const {
    bankName,
    accountHolderName,
    accountNumber,
    branchName,
    ...restData
  } = data;
  return {
    ...restData,
    ...(restData.paymentPreference === "bank" && {
      bankInfo: {
        bankName,
        accountHolderName,
        accountNumber,
        branchName,
      },
    }),
  };
});

export const UpdateStaffDataSchema = BaseStaffDataSchema.extend({
  photo: z.any().optional(),
  nidFrontPhoto: z.any().optional(),
  nidBackPhoto: z.any().optional(),
  docs: z.array(z.string()).optional(),
}).transform((data) => {
  const {
    bankName,
    accountHolderName,
    accountNumber,
    branchName,
    photo,
    nidFrontPhoto,
    nidBackPhoto,
    ...restData
  } = data;
  return {
    ...restData,
    ...(restData.paymentPreference === "bank" && {
      bankInfo: {
        bankName: bankName!,
        accountHolderName: accountHolderName!,
        accountNumber: accountNumber!,
        branchName: branchName!,
      },
    }),
    ...(photo instanceof File && photo.size > 0 && { photo }),
    ...(nidFrontPhoto instanceof File &&
      nidFrontPhoto.size > 0 && { nidFrontPhoto }),
    ...(nidBackPhoto instanceof File &&
      nidBackPhoto.size > 0 && { nidBackPhoto }),
  };
});

const ServiceReport = z.object({
  resolved: z.boolean(),
  explanation: z.string().optional(),
  travelCost: z.number().optional(),
  reason: z.string().optional(),
});

export const ServiceDataSchema = z.object({
  id: z.uuid().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  customerAddressDistrict: z.string().optional().nullable(),
  customerAddressPoliceStation: z.string().optional().nullable(),
  customerAddressPostOffice: z.string().optional().nullable(),

  staffId: z.string().optional().nullable(),
  staffRole: z.enum(staffRoleEnum.enumValues).optional().nullable(),
  staffName: z.string().optional().nullable(),
  staffPhone: z.string().optional().nullable(),
  staffReport: ServiceReport.optional(),
  type: z.enum(serviceTypeEnum.enumValues).optional(),

  productType: z.enum(productTypeEnum.enumValues),
  productModel: z.string().min(1),
  ipsBrand: z.string().optional().nullable(),
  powerRating: z.string().optional().nullable(),
  reportedIssue: z.string().optional().nullable(),

  productFrontPhoto: z.any().optional(),
  productBackPhoto: z.any().optional(),
  warrantyCardPhoto: z.any().optional(),

  memoNumber: z.string().optional().nullable(),
  createdFrom: z.enum(createdFromTypesEnum.enumValues).optional(),
});

export const UpdateServiceDataSchema = ServiceDataSchema.extend({
  serviceStatus: z.enum([
    ...serviceStatusEnum.enumValues,
    "custom",
    "new_note",
  ]),
  sendCompletionSMS: formBool().optional(),
  customLabel: z.string().optional(),
  customNote: z.string().optional(),
  cancelReason: z.string().optional(),
  productFrontPhoto: z.any().optional(),
  productBackPhoto: z.any().optional(),
  warrantyCardPhoto: z.any().optional(),
}).transform((data) => {
  const { warrantyCardPhoto, productFrontPhoto, productBackPhoto } = data;
  if (warrantyCardPhoto && warrantyCardPhoto.size === 0) {
    delete data.warrantyCardPhoto;
  }
  if (productFrontPhoto && productFrontPhoto.size === 0) {
    delete data.productFrontPhoto;
  }
  if (productBackPhoto && productBackPhoto.size === 0) {
    delete data.productBackPhoto;
  }
  return data;
});

export const AddToServiceSchema = z.object({
  productId: z.uuid(),
  serviceType: z.enum(serviceTypeEnum.enumValues),
});

export const UpdateServiceInfoSchema = z.object({
  customerName: z.string().optional(),
  customerPhoneNumber: z.string().optional(),
  customerAddress: z.string().optional(),
  productType: z.string().optional(),
  productModel: z.string().optional(),
  technicianId: z.string().optional(),
  technicianName: z.string().optional(),
  technicianPhoneNumber: z.string().optional(),
  technicianComment: z
    .object({
      resolved: z.boolean(),
      explanation: z.string().optional(),
      travelCost: z.number().optional(),
      reason: z.string().optional(),
    })
    .optional(),
  status: z
    .enum([
      "pending",
      "in_progress",
      "appointment_retry",
      "service_center",
      "completed",
      "canceled",
    ])
    .optional(),
  statusTrack: z
    .array(
      z.enum([
        "pending",
        "in_progress",
        "appointment_retry",
        "service_center",
        "completed",
        "canceled",
      ]),
    )
    .optional(),
  messageInfo: z
    .object({
      customerName: z.string().min(1),
      customerPhoneNumber: z.string().min(1),
      messageType: z.enum(["install", "repair"]),
    })
    .optional(),
});

export const AppointmentDataSchema = z.object({
  serviceId: z.string().min(1),
  serviceType: z.enum(serviceTypeEnum.enumValues),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  productModel: z.string().min(1),
  staffName: z.string().min(1),
  staffPhone: z.string().min(1),
  staffId: z.string().optional(),
});

export const CustomerLoginSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export const LoginCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const FeedbackDataSchema = z.object({
  customerId: z.string().optional().nullable(),
  serviceId: z.string().min(1),
  feedbacks: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      amount: z.number().optional(),
      comment: z.string().optional(),
    }),
  ),
  rating: z.number().optional().nullable(),
});

const BankInfo = z.object({
  bankName: z.string().min(1),
  accountHolderName: z.string().min(1),
  accountNumber: z.string().min(1),
  branchName: z.string().min(1),
});

const BasePaymentSchema = z.object({
  staffId: z.string().min(1),
  paymentMethod: z.enum(paymentTypesEnum.enumValues),
  date: z.coerce.date(),
  description: z.string().optional(),
  amount: z.coerce.number(),
});

const WalletPaymentSchema = BasePaymentSchema.extend({
  senderWalletNumber: z.string().min(1),
  receiverWalletNumber: z.string().min(1),
  transactionId: z.string().min(1),
});

const BankPaymentSchema = BasePaymentSchema.extend({
  senderBankInfo: BankInfo,
  receiverBankInfo: BankInfo,
});

const CashPaymentSchema = BasePaymentSchema.extend({
  paymentMethod: z.literal("cash"),
});

export const PaymentDataSchema = z.union([
  WalletPaymentSchema,
  BankPaymentSchema,
  CashPaymentSchema,
]);

export const InvoiceDataSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  date: z.coerce.date(),
  sendDownloadLink: z.boolean().optional(),
  products: z.array(
    z.object({
      type: z.enum(productTypeEnum.enumValues),
      model: z.string().min(1),
      warrantyDurationMonths: z.coerce.number(),
      warrantyStartDate: z.coerce.date(),
      quantity: z.coerce.number(),
      unitPrice: z.coerce.number(),
    }),
  ),
  paymentType: z.enum(paymentTypesEnum.enumValues),
  subtotal: z.number(),
  total: z.number(),
  dueAmount: z.number(),
});

export const NoticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(noticePriorityEnum.enumValues),
  targetType: z.enum(noticeTargetEnum.enumValues),
  isDraft: z.boolean().default(false),
  scheduledAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  recipientIds: z.array(z.string()).optional(), // For single/multiple targets
});

export const TaskSchema = z.object({
  staffId: z.string().min(1, "Staff selection is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(noticePriorityEnum.enumValues),
  dueDate: z.coerce.date().nullable().optional(),
  files: z.array(z.string()).optional(),
});

export const StaffSMSPreferencesSchema = z.object({
  smsNotificationEnabled: z.boolean(),
  smsWorkingHoursOnly: z.boolean(),
  smsFrequency: z.enum(["immediate", "daily_digest"]),
  smsOptOut: z.boolean(),
});


export const BaseSubscriptionDataSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  streetAddress: z.string().min(1),
  district: z.string().min(1),
  policeStation: z.string().min(1),
  postOffice: z.string().min(1),
  subscriptionDuration: z.coerce.number().int(),
  subscriptionType: z.enum(subscriptionTypesEnum.enumValues),
  batteryType: z.string().min(1),
  ipsBrand: z.string().optional().or(z.literal("")),
  ipsPowerRating: z.string().optional().or(z.literal("")),
  paymentType: z.enum(paymentTypesEnum.enumValues),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  servicesCompleted: z.coerce.number().int().optional(),
});

export const SubscriptionDataSchema = z.union([
  BaseSubscriptionDataSchema.extend({
    walletNumber: z.string().min(1),
    transactionId: z.string().min(1),
  }),
  BaseSubscriptionDataSchema.extend({
    bankName: z.string().min(1),
    accountHolderName: z.string().min(1),
    accountNumber: z.string().min(1),
    branchName: z.string().min(1),
  }),
]);

export const ServiceReportDataSchema = z.object({
  serviceStatus: z.object({
    serviceId: z.string().min(1),
    status: z.enum(serviceStatusEnum.enumValues).optional(),
    statusType: z.enum(statusTypesEnum.enumValues).optional(),
    customLabel: z.string().optional(),
    customNote: z.string().optional(),
  }),
  serviceReport: ServiceReport.optional(),
  messageData: z
    .object({
      messageType: z.enum(serviceTypeEnum.enumValues),
      customerName: z.string().min(1),
      customerPhone: z.string().min(1),
    })
    .optional(),
});


// ============================================
// SELLERS
// ============================================

const BaseSellerDataSchema = z.object({
  shopName: z.string().min(1),
  businessType: z.enum(sellerBusinessTypeEnum.enumValues),
  tradeLicenseNumber: z.string().min(1),
  businessYears: z.coerce.number().optional(),
  shopStreetAddress: z.string().min(1),
  shopDistrict: z.string().min(1),
  shopPoliceStation: z.string().optional(),
  shopPostOffice: z.string().optional(),
  ownerName: z.string().min(1),
  phone: z.string().min(1),
  nidNumber: z.string().min(1),

  ownerPhoto: z.any(),
  tradeLicensePhoto: z.any(),
  shopFrontPhoto: z.any(),
  shopInsidePhoto: z.any().optional(),
  nidFrontPhoto: z.any(),
  nidBackPhoto: z.any(),
});

export const SellerDataSchema = BaseSellerDataSchema.extend({
  sendConfirmationSMS: formBool().optional(),
  agreed: formBool().optional(),
  token: z.string().optional(),
});

export const UpdateSellerDataSchema = BaseSellerDataSchema.extend({
  ownerPhoto: z.any().optional(),
  tradeLicensePhoto: z.any().optional(),
  shopFrontPhoto: z.any().optional(),
  shopInsidePhoto: z.any().optional(),
  nidFrontPhoto: z.any().optional(),
  nidBackPhoto: z.any().optional(),
});

export const SellerPurchaseDataSchema = z.object({
  productType: z.enum(productTypeEnum.enumValues),
  productModel: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
  date: z.coerce.date(),
});
