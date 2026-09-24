import { BankInfo, Feedback, StaffServiveReport } from "@/types";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("productType", [
  "ips",
  "battery",
  "stabilizer",
  "others",
]);

export const serviceTypeEnum = pgEnum("serviceType", ["install", "repair"]);

export const serviceStatusEnum = pgEnum("serviceStatus", [
  "pending",
  "in_progress",
  "appointment_retry",
  "staff_departed",
  "staff_arrived",
  "service_center",
  "service_center_received",
  "completed",
  "canceled",
]);

export const subscriberStatusEnum = pgEnum("subscriberStatus", [
  "active",
  "inactive",
  "expired",
]);

export const applicationStatusEnum = pgEnum("applicationStatus", [
  "pending",
  "processing",
  "approved",
  "rejected",
  "expired",
]);

export const applicationTypesEnum = pgEnum("applicationTypes", [
  "service_application",
  "staff_application",
  "subscription_application",
  "vip_card_application",
  "seller_application",
]);

export const sellerBusinessTypeEnum = pgEnum("sellerBusinessType", [
  "retail",
  "wholesale",
  "showroom",
  "other",
]);

export const staffRoleEnum = pgEnum("staffRole", ["technician", "electrician"]);

export const paymentTypesEnum = pgEnum("paymentTypes", [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
]);

export const smsFrequencyEnum = pgEnum("smsFrequency", [
  "immediate",
  "daily_digest",
]);

export const smsLogStatusEnum = pgEnum("smsLogStatus", ["sent", "failed"]);

export const agreementTypesEnum = pgEnum("agreementTypes", [
  "application_declaration",
]);

export const paymentStatusEnum = pgEnum("paymentStatus", [
  "requested",
  "pending",
  "processing",
  "approved",
  "rejected",
  "completed",
  "credited",
]);

export const reportStatusEnum = pgEnum("reportStatus", [
  "pending",
  "processing",
  "resolved",
  "dismissed",
  "under_trial",
  "hearing",
  "completed",
]);

export const statusTypesEnum = pgEnum("statusTypes", ["system", "custom"]);

export const createdFromTypesEnum = pgEnum("serviceSourceTypes", [
  "public_form",
  "dashboard",
]);

export const resolvedByTypesEnum = pgEnum("resolvedByTypes", [
  "staff_member",
  "service_center",
]);

export const noticePriorityEnum = pgEnum("noticePriority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const noticeTargetEnum = pgEnum("noticeTarget", [
  "single",
  "multiple",
  "all",
]);

export const subscriptionTypesEnum = pgEnum("subscriptionTypes", [
  "battery_maintenance",
  "ips_and_battery_maintenance",
  "full_maintenance",
]);

export const admins = pgTable("admins", {
  id: uuid().defaultRandom().primaryKey(),
  username: varchar({ length: 255 }).unique().notNull(),
  password: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid().defaultRandom().primaryKey(),
    customerId: varchar({ length: 255 }).unique().notNull(),
    name: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    address: varchar({ length: 255 }).notNull(),
    invoiceNumber: varchar({ length: 255 }).unique().notNull(),
    isActiveCustomer: boolean().default(true).notNull(),
    profileCompleted: boolean().default(false).notNull(),
    vipCardNumber: varchar({ length: 16 }).unique(),
    vipStatus: applicationStatusEnum().default("pending"),
    vipExpiryDate: timestamp({ withTimezone: true }),
    referredByVipCard: varchar({ length: 16 }),
    referralBalance: numeric({
      precision: 12,
      scale: 2,
      mode: "number",
    }).default(0),
    isWarrantyStopped: boolean().default(false).notNull(),
    warrantyStoppedAt: timestamp({ withTimezone: true }),
    sellerId: varchar({ length: 255 }).references(() => sellers.sellerId, {
      onDelete: "set null",
    }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("customer_id_idx").on(table.customerId),
    index("customer_phone_idx").on(table.phone),
    index("invoice_number_fk_idx").on(table.invoiceNumber),
    index("customer_seller_id_idx").on(table.sellerId),
  ],
);

export const referralBonuses = pgTable(
  "referralBonuses",
  {
    id: uuid().defaultRandom().primaryKey(),
    referrerCustomerId: varchar({ length: 255 })
      .references(() => customers.customerId, { onDelete: "cascade" })
      .notNull(),
    referrerVipCard: varchar({ length: 16 }).notNull(),
    referredCustomerId: varchar({ length: 255 }).references(
      () => customers.customerId,
      { onDelete: "set null" },
    ),
    referredCustomerName: varchar({ length: 255 }).notNull(),
    purchaseAmount: numeric({
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    discountGiven: numeric({
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    bonusEarned: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("referral_bonus_referrer_idx").on(table.referrerCustomerId),
    index("referral_bonus_vip_card_idx").on(table.referrerVipCard),
  ],
);

export const referralPaymentRequests = pgTable(
  "referralPaymentRequests",
  {
    id: uuid().defaultRandom().primaryKey(),
    requestId: varchar({ length: 255 }).unique().notNull(),
    customerId: varchar({ length: 255 })
      .references(() => customers.customerId, { onDelete: "cascade" })
      .notNull(),
    vipCardNumber: varchar({ length: 16 }).notNull(),
    amount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    paymentMethod: paymentTypesEnum().notNull(),
    walletNumber: varchar({ length: 255 }).notNull(),
    status: paymentStatusEnum().default("requested").notNull(),
    transactionId: varchar({ length: 255 }),
    senderNumber: varchar({ length: 255 }),
    adminNote: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("referral_payment_customer_idx").on(table.customerId),
    index("referral_payment_status_idx").on(table.status),
  ],
);

export const referralPaymentRequestsRelations = relations(
  referralPaymentRequests,
  ({ one }) => ({
    customer: one(customers, {
      fields: [referralPaymentRequests.customerId],
      references: [customers.customerId],
    }),
  }),
);

export const referralBonusesRelations = relations(
  referralBonuses,
  ({ one }) => ({
    referrer: one(customers, {
      fields: [referralBonuses.referrerCustomerId],
      references: [customers.customerId],
      relationName: "referralEarnings",
    }),
    referred: one(customers, {
      fields: [referralBonuses.referredCustomerId],
      references: [customers.customerId],
      relationName: "referredBy",
    }),
  }),
);

export const customersRelations = relations(customers, ({ many, one }) => ({
  invoice: one(invoices, {
    fields: [customers.invoiceNumber],
    references: [invoices.invoiceNumber],
  }),
  seller: one(sellers, {
    fields: [customers.sellerId],
    references: [sellers.sellerId],
  }),
  services: many(services),
  feedbacks: many(feedbacks),
  notifications: many(customerNotifications),
  referralEarnings: many(referralBonuses, { relationName: "referralEarnings" }),
  referralPaymentRequests: many(referralPaymentRequests),
  referredByRecord: one(referralBonuses, {
    fields: [customers.customerId],
    references: [referralBonuses.referredCustomerId],
    relationName: "referredBy",
  }),
}));

export const invoices = pgTable(
  "invoices",
  {
    id: uuid().defaultRandom().primaryKey(),
    invoiceNumber: varchar({ length: 255 }).unique().notNull(),
    customerId: varchar({ length: 255 })
      .references(() => customers.customerId, { onDelete: "cascade" })
      .notNull(),
    customerName: varchar({ length: 255 }).notNull(),
    customerPhone: varchar({ length: 255 }).notNull(),
    customerAddress: text().notNull(),
    date: timestamp({ withTimezone: true }).defaultNow().notNull(),
    paymentType: paymentTypesEnum().notNull(),
    subtotal: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    total: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    dueAmount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    dueType: varchar({ length: 50 }).default("due").notNull(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invoice_number_idx").on(table.invoiceNumber),
    index("invoice_customer_id_idx").on(table.customerId),
  ],
);

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.customerId],
  }),
  products: many(products),
}));

export const products = pgTable("products", {
  id: uuid().defaultRandom().primaryKey(),
  invoiceId: uuid()
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  type: productTypeEnum().notNull(),
  model: varchar({ length: 255 }).notNull(),
  quantity: integer().default(1).notNull(),
  unitPrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
  warrantyStartDate: timestamp({ withTimezone: true }).notNull(),
  warrantyDurationMonths: integer().notNull(),
  warrantyEndDate: timestamp({ withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  invoice: one(invoices, {
    fields: [products.invoiceId],
    references: [invoices.id],
  }),
}));

export const services = pgTable(
  "services",
  {
    id: uuid().defaultRandom().primaryKey(),
    serviceId: varchar({ length: 255 }).unique().notNull(),
    customerId: varchar({ length: 255 }).references(
      () => customers.customerId,
      { onDelete: "set null" },
    ),
    customerName: varchar({ length: 255 }).notNull(),
    customerPhone: varchar({ length: 255 }).notNull(),
    customerAddress: varchar({ length: 255 }).notNull(),
    customerAddressDistrict: varchar({ length: 255 }),
    customerAddressPoliceStation: varchar({ length: 255 }),
    customerAddressPostOffice: varchar({ length: 255 }),
    staffId: varchar({ length: 255 }).references(() => staffs.staffId, {
      onDelete: "set null",
    }),
    staffRole: staffRoleEnum(),
    staffName: varchar({ length: 255 }),
    staffPhone: varchar({ length: 255 }),
    staffReport: json().$type<StaffServiveReport>(),
    type: serviceTypeEnum().default("repair"),
    productType: productTypeEnum().notNull(),
    productModel: varchar({ length: 255 }).notNull(),
    ipsBrand: varchar({ length: 255 }),
    productFrontPhotoKey: varchar({ length: 255 }),
    productBackPhotoKey: varchar({ length: 255 }),
    warrantyCardPhotoKey: varchar({ length: 255 }),
    powerRating: varchar({ length: 255 }),
    memoNumber: varchar({ length: 255 }),
    reportedIssue: text(),
    status: serviceStatusEnum().default("pending").notNull(), // current status of the service
    createdFrom: createdFromTypesEnum().notNull(),
    resolvedBy: resolvedByTypesEnum(),
    isActive: boolean().default(false).notNull(),
    ipAddress: varchar({ length: 255 }),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("service_id_idx").on(table.serviceId),
    index("service_customer_id_idx").on(table.customerId),
    index("service_staff_id_idx").on(table.staffId),
    index("service_is_active_idx").on(table.isActive),
    index("service_type_idx").on(table.type),
    index("service_customer_phone_idx").on(table.customerPhone),
    index("service_active_type_idx").on(table.isActive, table.type),
  ],
);

export const servicesRelations = relations(services, ({ many, one }) => ({
  statusHistory: many(serviceStatusHistory),
  customer: one(customers, {
    fields: [services.customerId],
    references: [customers.customerId],
  }),
  appointedStaff: one(staffs, {
    fields: [services.staffId],
    references: [staffs.staffId],
  }),
  application: one(applications, {
    fields: [services.serviceId],
    references: [applications.applicantId],
  }),
  feedback: one(feedbacks, {
    fields: [services.serviceId],
    references: [feedbacks.serviceId],
  }),
  task: one(tasks, {
    fields: [services.serviceId],
    references: [tasks.serviceId],
  }),
}));

export const serviceStatusHistory = pgTable(
  "serviceStatusHistory",
  {
    id: uuid().defaultRandom().primaryKey(),
    serviceId: varchar({ length: 255 })
      .references(() => services.serviceId, { onDelete: "cascade" })
      .notNull(),
    status: serviceStatusEnum(),
    statusType: statusTypesEnum().default("system").notNull(),
    customLabel: varchar({ length: 255 }),
    customNote: text(),
    cancelReason: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("status_history_service_id_idx").on(table.serviceId),
    index("status_history_status_idx").on(table.status),
  ],
);

export const serviceStatusHistoryRelations = relations(
  serviceStatusHistory,
  ({ one }) => ({
    service: one(services, {
      fields: [serviceStatusHistory.serviceId],
      references: [services.serviceId],
    }),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().defaultRandom().primaryKey(),
    subscriptionId: varchar({ length: 255 }).unique().notNull(),
    customerId: varchar({ length: 255 }),
    name: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    streetAddress: text().notNull(),
    district: varchar({ length: 100 }).notNull(),
    policeStation: varchar({ length: 100 }),
    postOffice: varchar({ length: 100 }),
    subscriptionDuration: integer().notNull(),
    subscriptionType: subscriptionTypesEnum().notNull(),
    batteryType: varchar({ length: 255 }).notNull(),
    ipsBrand: varchar({ length: 255 }),
    ipsPowerRating: varchar({ length: 255 }),
    paymentType: paymentTypesEnum().notNull(),
    basePrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    discountAmount: numeric({
      precision: 10,
      scale: 2,
      mode: "number",
    }).default(0),
    surchargeAmount: numeric({
      precision: 10,
      scale: 2,
      mode: "number",
    }).default(0),
    totalFee: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    walletNumber: varchar({ length: 255 }),
    transactionId: varchar({ length: 255 }),
    bankInfo: json().$type<BankInfo>(),
    isActive: boolean().default(false).notNull(),
    ipAddress: varchar({ length: 255 }).notNull(),
    userAgent: text().notNull(),
    status: subscriberStatusEnum().default("active").notNull(),
    servicesCompleted: integer().default(0).notNull(),
    expiryNotified: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_id_idx").on(table.subscriptionId),
    index("subscriber_name_idx").on(table.name),
    index("subscriber_phone_idx").on(table.phone),
    index("subscriber_address_idx").on(table.district),
  ],
);

export const staffs = pgTable(
  "staffs",
  {
    id: uuid().defaultRandom().primaryKey(),
    staffId: varchar({ length: 255 }).unique().notNull(),
    username: varchar({ length: 255 }).unique(), // nullable initially for existing data
    password: text(), // nullable initially for existing data
    name: varchar({ length: 255 }).notNull(),
    fatherName: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    currentStreetAddress: text().notNull(),
    currentDistrict: varchar({ length: 100 }).notNull(),
    currentPoliceStation: varchar({ length: 100 }),
    currentPostOffice: varchar({ length: 100 }),
    permanentStreetAddress: text().notNull(),
    permanentDistrict: varchar({ length: 100 }).notNull(),
    permanentPoliceStation: varchar({ length: 100 }),
    permanentPostOffice: varchar({ length: 100 }),
    photoKey: varchar({ length: 255 }).notNull(),
    nidFrontPhotoKey: varchar({ length: 255 }).notNull(),
    nidBackPhotoKey: varchar({ length: 255 }).notNull(),
    skills: text(), // JSON array of skills as text
    bio: text(), // Short biography/summary
    hasRepairExperience: boolean().default(false).notNull(),
    repairExperienceYears: integer().default(0),
    hasInstallationExperience: boolean().default(false).notNull(),
    installationExperienceYears: integer().default(0),
    role: staffRoleEnum().notNull(),
    isVerified: boolean().default(false).notNull(),
    isActiveStaff: boolean().default(true).notNull(), // can login if active
    profileCompleted: boolean().default(false).notNull(), // profile setup complete
    rating: numeric({ precision: 3, scale: 2, mode: "number" }).default(0), // calculated average
    totalServices: integer().default(0), // total services handled
    successfulServices: integer().default(0), // completed successfully
    canceledServices: integer().default(0), // services canceled
    pendingServices: integer().default(0), // services pending
    serviceCenterServices: integer().default(0), // services sent to service center
    paymentPreference: paymentTypesEnum().notNull(),
    walletNumber: varchar({ length: 255 }),
    bankInfo: json().$type<BankInfo>(),
    docs: text(), // JSON array of document URLs/keys
    createdFrom: createdFromTypesEnum().notNull(),
    smsNotificationEnabled: boolean().default(true).notNull(),
    smsWorkingHoursOnly: boolean().default(true).notNull(),
    smsFrequency: smsFrequencyEnum().default("immediate").notNull(),
    smsOptOut: boolean().default(false).notNull(),
    ipAddress: varchar({ length: 255 }),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_id_idx").on(table.staffId),
    index("staff_username_idx").on(table.username),
    index("staff_phone_idx").on(table.phone),
    index("staff_is_verified_idx").on(table.isVerified),
    index("staff_role_idx").on(table.role),
    index("staff_verified_role_idx").on(table.isVerified, table.role),
    index("staff_active_idx").on(table.isActiveStaff),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid().defaultRandom().primaryKey(),
    taskId: varchar({ length: 255 }).unique().notNull(),
    staffId: varchar({ length: 255 })
      .references(() => staffs.staffId, { onDelete: "cascade" })
      .notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    priority: noticePriorityEnum().default("normal").notNull(),
    dueDate: timestamp({ withTimezone: true }),
    serviceId: varchar({ length: 255 }).references(() => services.serviceId, {
      onDelete: "cascade",
    }),
    status: varchar({ length: 50 }).default("pending").notNull(),
    files: json().$type<string[]>(),
    comments: json().$type<any[]>(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_id_idx").on(table.taskId),
    index("task_staff_id_idx").on(table.staffId),
    index("task_service_id_idx").on(table.serviceId),
  ],
);

export const staffsRelations = relations(staffs, ({ many, one }) => ({
  services: many(services),
  payments: many(payments),
  agreements: many(userAgreements),
  notifications: many(staffNotifications),
  tasks: many(tasks),
  smsLogs: many(smsLogs),
  application: one(applications, {
    fields: [staffs.id],
    references: [applications.applicantId],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  staff: one(staffs, {
    fields: [tasks.staffId],
    references: [staffs.staffId],
  }),
  service: one(services, {
    fields: [tasks.serviceId],
    references: [services.serviceId],
  }),
}));

export const smsLogs = pgTable(
  "smsLogs",
  {
    id: uuid().defaultRandom().primaryKey(),
    staffId: varchar({ length: 255 }).references(() => staffs.staffId, {
      onDelete: "set null",
    }),
    phoneNumber: varchar({ length: 255 }).notNull(),
    message: text().notNull(),
    status: smsLogStatusEnum().notNull(),
    error: text(),
    carrier: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sms_log_staff_id_idx").on(table.staffId),
    index("sms_log_status_idx").on(table.status),
  ],
);

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  staff: one(staffs, {
    fields: [smsLogs.staffId],
    references: [staffs.staffId],
  }),
}));

export const applications = pgTable(
  "applications",
  {
    id: uuid().defaultRandom().primaryKey(),
    applicationId: varchar({ length: 255 }).unique().notNull(),
    applicantId: varchar({ length: 255 }).unique().notNull(),
    status: applicationStatusEnum().default("pending").notNull(),
    type: applicationTypesEnum().notNull(),
    rejectReason: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("application_id_idx").on(table.applicationId),
    index("applicant_id_idx").on(table.applicantId),
    index("application_status_idx").on(table.status),
    index("application_type_idx").on(table.type),
  ],
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  staff: one(staffs, {
    fields: [applications.applicantId],
    references: [staffs.staffId],
  }),
  service: one(services, {
    fields: [applications.applicantId],
    references: [services.serviceId],
  }),
  subscriber: one(subscriptions, {
    fields: [applications.applicantId],
    references: [subscriptions.subscriptionId],
  }),
  customer: one(customers, {
    fields: [applications.applicantId],
    references: [customers.customerId],
  }),
  seller: one(sellers, {
    fields: [applications.applicantId],
    references: [sellers.sellerId],
  }),
}));

export const agreements = pgTable("agreements", {
  id: uuid().defaultRandom().primaryKey(),
  type: agreementTypesEnum().notNull(),
  title: varchar({ length: 255 }),
  content: text().notNull(),
  version: varchar({ length: 10 }).default("1.0"),
  isActive: boolean().default(true),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const agreementsRelations = relations(agreements, ({ many }) => ({
  users: many(userAgreements),
}));

export const userAgreements = pgTable("userAgreements", {
  id: uuid().defaultRandom().primaryKey(),
  userId: varchar({ length: 255 }).notNull(),
  agreementId: uuid()
    .references(() => agreements.id, { onDelete: "cascade" })
    .notNull(),
  agreedAt: timestamp({ withTimezone: true }).defaultNow(),
  ipAddress: varchar({ length: 255 }).notNull(),
  userAgent: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const userAgreementsRelations = relations(userAgreements, ({ one }) => ({
  user: one(staffs, {
    fields: [userAgreements.userId],
    references: [staffs.staffId],
  }),
  agreement: one(agreements, {
    fields: [userAgreements.agreementId],
    references: [agreements.id],
  }),
}));

export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey(),
    paymentId: varchar({ length: 255 }).unique().notNull(),
    staffId: varchar({ length: 255 })
      .references(() => staffs.staffId, { onDelete: "cascade" })
      .notNull(),
    invoiceNumber: varchar({ length: 255 }).unique().notNull(),
    paymentMethod: paymentTypesEnum().notNull(),
    senderWalletNumber: varchar({ length: 255 }),
    senderBankInfo: json().$type<BankInfo>(),
    receiverWalletNumber: varchar({ length: 255 }),
    receiverBankInfo: json().$type<BankInfo>(),
    amount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    serviceId: varchar({ length: 255 }).references(() => services.serviceId, {
      onDelete: "set null",
    }),
    status: paymentStatusEnum().default("pending").notNull(),
    transactionId: varchar({ length: 255 }).unique(),
    description: text(),
    date: timestamp({ withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payment_staff_id_idx").on(table.staffId),
    index("payment_service_id_idx").on(table.serviceId),
    index("payment_status_idx").on(table.status),
    index("payment_date_idx").on(table.date),
  ],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  staff: one(staffs, {
    fields: [payments.staffId],
    references: [staffs.staffId],
  }),
  service: one(services, {
    fields: [payments.serviceId],
    references: [services.serviceId],
  }),
}));

export const staffComplaints = pgTable("staffComplaints", {
  id: uuid().defaultRandom().primaryKey(),
  complaintId: varchar({ length: 255 }).unique().notNull(),
  customerId: varchar({ length: 255 })
    .references(() => customers.customerId, { onDelete: "cascade" })
    .notNull(),
  staffId: varchar({ length: 255 })
    .references(() => staffs.staffId, { onDelete: "cascade" })
    .notNull(),
  serviceId: varchar({ length: 255 }).references(() => services.serviceId, {
    onDelete: "set null",
  }),
  subject: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  evidencePhotoKey: varchar({ length: 255 }),
  status: reportStatusEnum().default("under_trial").notNull(),
  adminNote: text(),
  customerNote: text(),
  hearingOfficerName: varchar({ length: 255 }),
  hearingOfficerPhone: varchar({ length: 255 }),
  hearingOfficerDesignation: varchar({ length: 255 }),
  punishmentType: varchar({ length: 50 }), // warning, suspension, demotion, termination
  punishmentStartDate: varchar({ length: 50 }),
  punishmentEndDate: varchar({ length: 50 }),
  punishmentFineAmount: varchar({ length: 50 }),
  punishmentNewPosition: varchar({ length: 255 }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const staffComplaintsRelations = relations(
  staffComplaints,
  ({ one }) => ({
    customer: one(customers, {
      fields: [staffComplaints.customerId],
      references: [customers.customerId],
    }),
    staff: one(staffs, {
      fields: [staffComplaints.staffId],
      references: [staffs.staffId],
    }),
    service: one(services, {
      fields: [staffComplaints.serviceId],
      references: [services.serviceId],
    }),
  }),
);

export const feedbacks = pgTable("feedbacks", {
  id: uuid().defaultRandom().primaryKey(),
  serviceId: varchar({ length: 255 })
    .references(() => services.serviceId, { onDelete: "cascade" })
    .unique()
    .notNull(),
  customerId: varchar({ length: 255 }).references(() => customers.customerId, {
    onDelete: "cascade",
  }),
  feedbacks: json().$type<Feedback[]>(),
  rating: doublePrecision(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const contactMessages = pgTable("contactMessages", {
  id: uuid().defaultRandom().primaryKey(),
  messageId: varchar({ length: 255 }).unique().notNull(),
  customerId: varchar({ length: 255 })
    .references(() => customers.customerId, { onDelete: "cascade" })
    .notNull(),
  subject: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  isRead: boolean().default(false).notNull(),
  adminReply: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const adminNotifications = pgTable(
  "adminNotifications",
  {
    id: uuid().defaultRandom().primaryKey(),
    type: varchar({ length: 50 }).notNull(), // 'complaint', 'service', etc.
    message: text().notNull(),
    link: varchar({ length: 255 }),
    isRead: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("admin_notifications_created_at_idx").on(table.createdAt)],
);

export const staffNotifications = pgTable("staffNotifications", {
  id: uuid().defaultRandom().primaryKey(),
  staffId: varchar({ length: 255 })
    .references(() => staffs.staffId, { onDelete: "cascade" })
    .notNull(),
  type: varchar({ length: 50 }).notNull(),
  message: text().notNull(),
  link: varchar({ length: 255 }),
  isRead: boolean().default(false).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const customerNotifications = pgTable("customerNotifications", {
  id: uuid().defaultRandom().primaryKey(),
  customerId: varchar({ length: 255 })
    .references(() => customers.customerId, { onDelete: "cascade" })
    .notNull(),
  type: varchar({ length: 50 }).notNull(),
  message: text().notNull(),
  link: varchar({ length: 255 }),
  isRead: boolean().default(false).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const staffNotificationsRelations = relations(
  staffNotifications,
  ({ one }) => ({
    staff: one(staffs, {
      fields: [staffNotifications.staffId],
      references: [staffs.staffId],
    }),
  }),
);

export const customerNotificationsRelations = relations(
  customerNotifications,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerNotifications.customerId],
      references: [customers.customerId],
    }),
  }),
);
export const contactMessagesRelations = relations(
  contactMessages,
  ({ one }) => ({
    customer: one(customers, {
      fields: [contactMessages.customerId],
      references: [customers.customerId],
    }),
  }),
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  service: one(services, {
    fields: [feedbacks.serviceId],
    references: [services.serviceId],
  }),
  customer: one(customers, {
    fields: [feedbacks.customerId],
    references: [customers.customerId],
  }),
}));

export const notices = pgTable("notices", {
  id: uuid().defaultRandom().primaryKey(),
  noticeId: varchar({ length: 255 }).unique().notNull(),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(), // Rich-text
  priority: noticePriorityEnum().default("normal").notNull(),
  targetType: noticeTargetEnum().default("all").notNull(),
  isDraft: boolean().default(false).notNull(),
  scheduledAt: timestamp({ withTimezone: true }),
  expiresAt: timestamp({ withTimezone: true }),
  createdBy: uuid().references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const noticeRecipients = pgTable("noticeRecipients", {
  id: uuid().defaultRandom().primaryKey(),
  noticeId: uuid()
    .references(() => notices.id, { onDelete: "cascade" })
    .notNull(),
  staffId: varchar({ length: 255 }).references(() => staffs.staffId, {
    onDelete: "cascade",
  }),
  customerId: varchar({ length: 255 }).references(() => customers.customerId, {
    onDelete: "cascade",
  }),
  isRead: boolean().default(false).notNull(),
  readAt: timestamp({ withTimezone: true }),
  isAcknowledged: boolean().default(false).notNull(),
  acknowledgedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const noticesRelations = relations(notices, ({ many, one }) => ({
  recipients: many(noticeRecipients),
  creator: one(admins, {
    fields: [notices.createdBy],
    references: [admins.id],
  }),
}));

export const noticeRecipientsRelations = relations(
  noticeRecipients,
  ({ one }) => ({
    notice: one(notices, {
      fields: [noticeRecipients.noticeId],
      references: [notices.id],
    }),
    staff: one(staffs, {
      fields: [noticeRecipients.staffId],
      references: [staffs.staffId],
    }),
    customer: one(customers, {
      fields: [noticeRecipients.customerId],
      references: [customers.customerId],
    }),
  }),
);

export const authTokens = pgTable("authTokens", {
  id: uuid().defaultRandom().primaryKey(),
  token: text().unique().notNull(),
  payload: json().$type<any>(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const banners = pgTable("banners", {
  id: uuid().defaultRandom().primaryKey(),
  imageKey: varchar({ length: 255 }).notNull(),
  isActiveCustomer: boolean().default(false).notNull(),
  isActiveStaff: boolean().default(false).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================
// SELLERS / DEALERS
// ============================================

export const sellers = pgTable(
  "sellers",
  {
    id: uuid().defaultRandom().primaryKey(),
    sellerId: varchar({ length: 255 }).unique().notNull(),
    username: varchar({ length: 255 }).unique(),
    password: text(),
    shopName: varchar({ length: 255 }).notNull(),
    businessType: sellerBusinessTypeEnum().default("retail").notNull(),
    tradeLicenseNumber: varchar({ length: 255 }).notNull(),
    businessYears: integer().default(0),
    shopStreetAddress: text().notNull(),
    shopDistrict: varchar({ length: 100 }).notNull(),
    shopPoliceStation: varchar({ length: 100 }),
    shopPostOffice: varchar({ length: 100 }),
    ownerName: varchar({ length: 255 }).notNull(),
    phone: varchar({ length: 255 }).notNull(),
    nidNumber: varchar({ length: 50 }).notNull(),
    ownerPhotoKey: varchar({ length: 255 }).notNull(),
    tradeLicensePhotoKey: varchar({ length: 255 }).notNull(),
    shopFrontPhotoKey: varchar({ length: 255 }).notNull(),
    shopInsidePhotoKey: varchar({ length: 255 }),
    nidFrontPhotoKey: varchar({ length: 255 }).notNull(),
    nidBackPhotoKey: varchar({ length: 255 }).notNull(),
    isVerified: boolean().default(false).notNull(),
    isActiveSeller: boolean().default(true).notNull(),
    profileCompleted: boolean().default(false).notNull(),
    createdFrom: createdFromTypesEnum().notNull(),
    ipAddress: varchar({ length: 255 }),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("seller_id_idx").on(table.sellerId),
    index("seller_username_idx").on(table.username),
    index("seller_phone_idx").on(table.phone),
    index("seller_is_verified_idx").on(table.isVerified),
    index("seller_active_idx").on(table.isActiveSeller),
  ],
);

export const sellerPurchases = pgTable(
  "sellerPurchases",
  {
    id: uuid().defaultRandom().primaryKey(),
    purchaseId: varchar({ length: 255 }).unique().notNull(),
    invoiceNumber: varchar({ length: 255 }).unique().notNull(),
    sellerId: varchar({ length: 255 })
      .references(() => sellers.sellerId, { onDelete: "cascade" })
      .notNull(),
    productType: productTypeEnum().notNull(),
    productModel: varchar({ length: 255 }).notNull(),
    quantity: integer().default(1).notNull(),
    unitPrice: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    totalAmount: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),
    paidAmount: numeric({ precision: 12, scale: 2, mode: "number" })
      .default(0)
      .notNull(),
    note: text(),
    date: timestamp({ withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("seller_purchase_seller_id_idx").on(table.sellerId),
    index("seller_purchase_date_idx").on(table.date),
  ],
);

export const sellersRelations = relations(sellers, ({ many, one }) => ({
  customers: many(customers),
  purchases: many(sellerPurchases),
  application: one(applications, {
    fields: [sellers.sellerId],
    references: [applications.applicantId],
  }),
}));

export const sellerPurchasesRelations = relations(
  sellerPurchases,
  ({ one }) => ({
    seller: one(sellers, {
      fields: [sellerPurchases.sellerId],
      references: [sellers.sellerId],
    }),
  }),
);
