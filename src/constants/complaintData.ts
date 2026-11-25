export const COMPLAINT_OFFICERS = [
  {
    name: "মোঃ আতিকুর রহমান",
    phone: "০১৩১০৬৭৩৬০২",
    designation: "দায়িত্বরত কর্মকর্তা (প্রশাসনিক শাখা)",
    office: "সিলেট বিভাগীয় কার্যালয়",
  },
  {
    name: "মোঃ আজিম খাঁ",
    phone: "০১৩১০৬৭৩৬০১",
    designation: "দায়িত্বরত কর্মকর্তা (প্রশাসনিক শাখা)",
    office: "সিলেট বিভাগীয় কার্যালয়",
  },
  {
    name: "মোঃ সাহাব উদ্দিন মাহমুদ",
    phone: "০১৩১০৬৭৩৬০০",
    designation: "দায়িত্বরত কর্মকর্তা (প্রশাসনিক শাখা)",
    office: "সিলেট বিভাগীয় কার্যালয়",
  },
];

export const PUNISHMENT_TYPES = [
  { id: "warning", label: "তিরস্কার ও সতর্কীকরণ" },
  { id: "fine", label: "আর্থিক জরিমানা" },
  { id: "suspension", label: "সাময়িক বরখাস্ত" },
  { id: "demotion", label: "পদাবনতি" },
  { id: "termination", label: "চাকুরি অবসান" },
  { id: "not_guilty", label: "দোষী সাব্যস্ত হননি (নির্দোষ)" },
];

/** Bangla display label for each complaint status (documents + public verify page). */
export const COMPLAINT_STATUS_BN: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  under_trial: "দাখিলকৃত — যাচাইয়ের অপেক্ষায়",
  processing: "প্রক্রিয়াধীন / তদন্তাধীন",
  hearing: "শুনানি চলমান",
  completed: "নিষ্পত্তিকৃত",
  resolved: "নিষ্পত্তিকৃত",
  dismissed: "খারিজ",
  customer_absent: "গ্রাহক অনুপস্থিত — একতরফা নিষ্পত্তি",
};

/**
 * How the complainant describes themselves in the complaint letter. Only a
 * customer whose warranty is currently active (see isComplaintWarrantyActive in
 * lib/customerPurchases) is called "warranty-covered"; everyone else is simply
 * a customer of S E Electronics. Used by every copy of the letter.
 */
export const complaintCustomerStandingBn = (warrantyActive: boolean | null | undefined) =>
  warrantyActive
    ? "আপনার প্রতিষ্ঠানের একজন ওয়ারেন্টি ভুক্ত গ্রাহক"
    : "আপনার প্রতিষ্ঠান এস ই ইলেকট্রনিক্সের একজন গ্রাহক";

/**
 * Date the complaint letter refers to, as dd/mm/yyyy in Bangla digits (Bangladesh
 * time): the linked service's date when there is one, else the filing date.
 */
export const complaintIncidentDateBn = (c: {
  createdAt: Date | string;
  service?: { createdAt?: Date | string | null } | null;
}) => {
  const serviceAt = c.service?.createdAt ? new Date(c.service.createdAt) : null;
  const date = serviceAt && !isNaN(serviceAt.getTime()) ? serviceAt : new Date(c.createdAt);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "2-digit", year: "numeric" })
    .format(date)
    .replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
};
