// Local-only seed for the seller module work. Never run against production.
import "dotenv/config";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL || /neon\.tech/.test(process.env.DATABASE_URL)) {
  console.error("Refusing to seed a non-local database");
  process.exit(1);
}
const db = drizzle(process.env.DATABASE_URL, { schema });

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(schema.admins).values({ username: "admin", password: hash }).onConflictDoNothing();
  await db.insert(schema.agreements).values({ type: "application_declaration", title: "Declaration", content: "আমি এই মর্মে ঘোষণা করিতেছি যে, আমি SE ELECTRONICS কোম্পানির সকল নির্দেশনা মানিয়া চলিব।", isActive: true }).onConflictDoNothing();

  await db.insert(schema.staffs).values({
    staffId: "SETJ1RPU08", username: "shabuddin", password: hash, name: "Shabuddin Mahamud", fatherName: "আহিল মাহমুদ", phone: "01310673600",
    currentStreetAddress: "Ambarkhana", currentDistrict: "sylhet", currentPoliceStation: "kotwali", currentPostOffice: "Sylhet",
    permanentStreetAddress: "Ambarkhana", permanentDistrict: "sylhet", permanentPoliceStation: "kotwali", permanentPostOffice: "Sylhet",
    photoKey: "media/staff/x/profile.webp", nidFrontPhotoKey: "media/staff/x/f.webp", nidBackPhotoKey: "media/staff/x/b.webp",
    hasRepairExperience: true, repairExperienceYears: 10, role: "technician", isVerified: true, isActiveStaff: true, profileCompleted: true,
    paymentPreference: "bkash", walletNumber: "01310673600", createdFrom: "dashboard", successfulServices: 0, pendingServices: 0,
  }).onConflictDoNothing();

  await db.insert(schema.sellers).values({
    sellerId: "SESELL0001", username: "bismillah", password: hash, shopName: "Bismillah Electronics", businessType: "retail", tradeLicenseNumber: "TL-778899", businessYears: 6,
    shopStreetAddress: "Zindabazar", shopDistrict: "sylhet", shopPoliceStation: "kotwali", shopPostOffice: "Sylhet", ownerName: "Abdul Karim", phone: "01722222222", nidNumber: "1234567890123",
    ownerPhotoKey: "media/seller/x/owner.webp", tradeLicensePhotoKey: "media/seller/x/tl.webp", shopFrontPhotoKey: "media/seller/x/shop.webp", nidFrontPhotoKey: "media/seller/x/nf.webp", nidBackPhotoKey: "media/seller/x/nb.webp",
    paymentPreference: "bank", bankInfo: { bankName: "Islami Bank", accountHolderName: "Abdul Karim", accountNumber: "20501234567", branchName: "Zindabazar" },
    isVerified: true, isActiveSeller: true, profileCompleted: true, createdFrom: "dashboard",
  }).onConflictDoNothing();
  await db.insert(schema.sellers).values({
    sellerId: "SESELL0002", shopName: "Karim Traders", businessType: "wholesale", tradeLicenseNumber: "TL-112233", shopStreetAddress: "Bandar Bazar", shopDistrict: "sylhet", ownerName: "Rahim Uddin", phone: "01733333333", nidNumber: "9876543210123",
    ownerPhotoKey: "media/seller/y/owner.webp", tradeLicensePhotoKey: "media/seller/y/tl.webp", shopFrontPhotoKey: "media/seller/y/shop.webp", nidFrontPhotoKey: "media/seller/y/nf.webp", nidBackPhotoKey: "media/seller/y/nb.webp",
    paymentPreference: "bkash", walletNumber: "01733333333", isVerified: false, createdFrom: "public_form",
  }).onConflictDoNothing();
  await db.insert(schema.applications).values({ applicationId: "SEAPPSELL1", applicantId: "SESELL0002", type: "seller_application", status: "pending" }).onConflictDoNothing();

  await db.insert(schema.sellerPurchases).values([
    { purchaseId: "SEPUR00001", invoiceNumber: "48213391", sellerId: "SESELL0001", productType: "ips", productModel: "SE-1200VA", quantity: 5, unitPrice: 25000, totalAmount: 125000, paidAmount: 100000, date: new Date("2026-09-18") },
    { purchaseId: "SEPUR00002", invoiceNumber: "47120885", sellerId: "SESELL0001", productType: "battery", productModel: "200Ah", quantity: 10, unitPrice: 18000, totalAmount: 180000, paidAmount: 180000, date: new Date("2026-09-02") },
  ]).onConflictDoNothing();

  await db.insert(schema.customers).values({ customerId: "SECUST0001", invoiceNumber: "90011223", name: "Rahima Akter", phone: "01711111111", address: "Ambarkhana, Sylhet", sellerId: "SESELL0001" }).onConflictDoNothing();
  const [inv] = await db.insert(schema.invoices).values({ invoiceNumber: "90011223", customerId: "SECUST0001", customerName: "Rahima Akter", customerPhone: "01711111111", customerAddress: "Ambarkhana, Sylhet", paymentType: "cash", subtotal: 32000, total: 32000, dueAmount: 0 }).onConflictDoNothing().returning();
  if (inv) {
    const start = new Date("2026-03-01");
    await db.insert(schema.products).values({ invoiceId: inv.id, type: "ips", model: "SE-1200VA", quantity: 1, unitPrice: 32000, warrantyStartDate: start, warrantyDurationMonths: 18 });
  }
  await db.insert(schema.services).values({
    serviceId: "SE7K2M9QAB", customerId: "SECUST0001", customerName: "Rahima Akter", customerPhone: "01711111111", customerAddress: "Ambarkhana, Sylhet", customerAddressDistrict: "sylhet",
    staffId: "SETJ1RPU08", staffRole: "technician", staffName: "Shabuddin Mahamud", staffPhone: "01310673600", type: "repair", productType: "ips", productModel: "SE-1200VA", status: "in_progress", createdFrom: "dashboard", isActive: true,
  }).onConflictDoNothing();
  await db.update(schema.staffs).set({ totalServices: 1, pendingServices: 1 }).where(schema.staffs.staffId === undefined ? undefined as any : (await import("drizzle-orm")).eq(schema.staffs.staffId, "SETJ1RPU08"));
  await db.insert(schema.payments).values({ paymentId: "SEPAY00001", staffId: "SETJ1RPU08", invoiceNumber: "55001122", paymentMethod: "bkash", amount: 2360, status: "credited", receiverWalletNumber: "01310673600" }).onConflictDoNothing();

  console.log("Seeded: admin/admin123, staff shabuddin/admin123, seller bismillah/admin123, pending seller application SEAPPSELL1");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
