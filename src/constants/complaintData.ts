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
