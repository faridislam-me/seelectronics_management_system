/** Certificates admin can award to a seller / dealer. */
export const SELLER_CERTIFICATE_TYPES = {
  honor: {
    title: "সম্মাননা সার্টিফিকেট",
    english: "Certificate of Honour",
    short: "সম্মাননা",
    body: "এস ই ইলেকট্রনিকস-এর একজন বিশ্বস্ত ও নিষ্ঠাবান বিক্রয় প্রতিনিধি হিসেবে আপনার আন্তরিক সহযোগিতা, সততা ও দীর্ঘদিনের পথচলার স্বীকৃতিস্বরূপ এই সম্মাননা সার্টিফিকেট প্রদান করা হলো।",
    accent: "#0b3d91",
  },
  top_sales: {
    title: "সর্বোচ্চ বিক্রয় সার্টিফিকেট",
    english: "Certificate of Top Sales",
    short: "বেশি বিক্রি",
    body: "এস ই ইলেকট্রনিকস-এর পণ্য বিক্রয়ে অসাধারণ সাফল্য ও সর্বোচ্চ বিক্রয় অর্জনের স্বীকৃতিস্বরূপ এই সার্টিফিকেট প্রদান করা হলো। আপনার এই অর্জন আমাদের সকলের জন্য অনুপ্রেরণা।",
    accent: "#b45309",
  },
  customer_service: {
    title: "কাস্টমার সার্ভিস সার্টিফিকেট",
    english: "Certificate of Excellent Customer Service",
    short: "কাস্টমার সার্ভিস",
    body: "গ্রাহকদের প্রতি আন্তরিক ব্যবহার, দ্রুত সেবা প্রদান এবং এস ই ইলেকট্রনিকস-এর মান বজায় রেখে চমৎকার কাস্টমার সার্ভিস নিশ্চিত করার স্বীকৃতিস্বরূপ এই সার্টিফিকেট প্রদান করা হলো।",
    accent: "#047857",
  },
} as const;

export type SellerCertificateType = keyof typeof SELLER_CERTIFICATE_TYPES;

export const isSellerCertificateType = (v: unknown): v is SellerCertificateType =>
  typeof v === "string" && v in SELLER_CERTIFICATE_TYPES;

/** Stored in authTokens.payload (type "seller-certificate"). */
export type SellerCertificatePayload = {
  type: "seller-certificate";
  certType: SellerCertificateType;
  certNo: string;
  sellerId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  district: string;
  /** e.g. "২০২৬" or "অক্টোবর ২০২৬" — shown under the title when set */
  period?: string;
  /** extra line from admin, shown under the body text when set */
  note?: string;
  issuedAt: string;
};
