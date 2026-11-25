// Shared (client + server safe) helpers for guarantor notices (জামিনদারকে নোটিশ):
// escalation levels, default Bangla templates, the SMS text and the overdue math.

export const GUARANTOR_NOTICE_LEVELS = ["reminder", "legal", "final"] as const;
export type GuarantorNoticeLevel = (typeof GUARANTOR_NOTICE_LEVELS)[number];

export const GUARANTOR_NOTICE_LEVEL_META: Record<
  GuarantorNoticeLevel,
  { step: number; label: string; title: string; subject: string; defaultDays: number; cls: string }
> = {
  reminder: {
    step: 1,
    label: "প্রথম নোটিশ (তাগাদা)",
    title: "তাগাদা নোটিশ",
    subject: "বকেয়া কিস্তি পরিশোধের বিষয়ে জামিনদারকে তাগাদা নোটিশ",
    defaultDays: 7,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  legal: {
    step: 2,
    label: "আইনি নোটিশ",
    title: "আইনি নোটিশ (Legal Notice)",
    subject: "বকেয়া কিস্তি পরিশোধের জন্য জামিনদারের প্রতি আইনি নোটিশ",
    defaultDays: 7,
    cls: "bg-red-50 text-red-700 border-red-200",
  },
  final: {
    step: 3,
    label: "চূড়ান্ত নোটিশ (দ্বিতীয়বার যোগাযোগ)",
    title: "চূড়ান্ত নোটিশ",
    subject: "বকেয়া কিস্তি পরিশোধের বিষয়ে জামিনদারের প্রতি চূড়ান্ত নোটিশ",
    defaultDays: 3,
    cls: "bg-rose-100 text-rose-800 border-rose-300",
  },
};

export const isGuarantorNoticeLevel = (v: unknown): v is GuarantorNoticeLevel =>
  typeof v === "string" && (GUARANTOR_NOTICE_LEVELS as readonly string[]).includes(v);

/** Tokens are 24 lowercase hex chars (96 random bits). */
export const GUARANTOR_NOTICE_TOKEN_RE = /^[a-f0-9]{24}$/;

export const guarantorNoticePath = (token: string) => `/guarantor-notice/${token}`;

export const bnNumber = (v: string | number) =>
  String(v).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** ৳ amount with Bangla numerals. */
export const bnMoney = (n: number) =>
  `৳${bnNumber(Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }))}`;

/** dd/mm/yyyy in Bangla numerals, Dhaka time. */
export const bnDate = (d: Date | string | number | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return bnNumber(dt.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" }));
};

type ScheduleLike = {
  dueDate: string | Date;
  amount: number;
  status: string;
};

/**
 * Overdue snapshot of a plan: installments whose due date has passed and that
 * are neither paid nor "claimed" (the customer already submitted a payment that
 * is waiting for admin verification). `remainingAmount` covers every unpaid row.
 */
export function computeGuarantorDues(schedule: ScheduleLike[], now: Date = new Date()) {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const overdue = schedule.filter(
    (s) =>
      s.status !== "paid" &&
      s.status !== "claimed" &&
      new Date(s.dueDate).getTime() < now.getTime(),
  );
  const oldest = overdue.reduce<Date | null>((min, s) => {
    const d = new Date(s.dueDate);
    return !min || d < min ? d : min;
  }, null);
  return {
    dueCount: overdue.length,
    dueAmount: round2(overdue.reduce((sum, s) => sum + Number(s.amount || 0), 0)),
    remainingAmount: round2(
      schedule.filter((s) => s.status !== "paid").reduce((sum, s) => sum + Number(s.amount || 0), 0),
    ),
    oldestDueDate: oldest,
  };
}

export type GuarantorNoticeContext = {
  customerName: string;
  customerPhone: string;
  productModel: string;
  planCode: string;
  dueCount: number;
  dueAmount: number;
  remainingAmount: number;
  oldestDueDate?: Date | string | null;
  /** Days the guarantor is given to act, counted from today. */
  deadlineDays: number;
  now?: Date;
};

export const guarantorDeadline = (days: number, now: Date = new Date()) =>
  new Date(now.getTime() + Math.max(0, days) * 24 * 60 * 60 * 1000);

/** Default notice body (the paragraphs between the salutation and the signature). */
export function buildGuarantorNoticeBody(level: GuarantorNoticeLevel, c: GuarantorNoticeContext) {
  const deadline = bnDate(guarantorDeadline(c.deadlineDays, c.now));
  const days = bnNumber(c.deadlineDays);
  const intro = `আপনি অবগত আছেন যে, জনাব/জনাবা ${c.customerName} (মোবাইল: ${c.customerPhone}) এস ই ইলেকট্রনিক্স থেকে কিস্তিতে "${c.productModel}" পণ্যটি ক্রয় করেছেন (কিস্তি নম্বর: ${c.planCode}) এবং আপনি উক্ত কিস্তি চুক্তির জামিনদার।`;
  const dues = `বর্তমানে ${bnNumber(c.dueCount)}টি কিস্তি বাবদ মোট ${bnMoney(c.dueAmount)} বকেয়া রয়েছে${
    c.oldestDueDate ? ` (সর্বপ্রথম বকেয়া কিস্তির নির্ধারিত তারিখ: ${bnDate(c.oldestDueDate)})` : ""
  }। উক্ত কিস্তি চুক্তির মোট অপরিশোধিত অর্থের পরিমাণ ${bnMoney(c.remainingAmount)}।`;

  if (level === "reminder") {
    return [
      intro,
      `দুঃখের সাথে জানানো যাচ্ছে যে, গ্রাহক নির্ধারিত সময়ে কিস্তি পরিশোধ করেননি। ${dues} গ্রাহকের সাথে যোগাযোগ করা সত্ত্বেও বকেয়া অর্থ পরিশোধ করা হয়নি।`,
      `অতএব, জামিনদার হিসেবে আপনাকে অনুরোধ করা যাচ্ছে যে, আগামী ${deadline} তারিখের মধ্যে (${days} দিনের মধ্যে) গ্রাহকের মাধ্যমে অথবা নিজ দায়িত্বে বকেয়া অর্থ পরিশোধের ব্যবস্থা গ্রহণ করুন। নির্ধারিত সময়ের মধ্যে পরিশোধ না হলে কর্তৃপক্ষ পরবর্তী ধাপে আইনি নোটিশ প্রদান করতে বাধ্য হবে।`,
    ].join("\n\n");
  }

  if (level === "legal") {
    return [
      `এতদ্বারা আপনাকে এই আইনি নোটিশ প্রদান করা যাচ্ছে যে, জনাব/জনাবা ${c.customerName} (মোবাইল: ${c.customerPhone}) এস ই ইলেকট্রনিক্স থেকে কিস্তিতে "${c.productModel}" পণ্যটি ক্রয় করেছেন (কিস্তি নম্বর: ${c.planCode})। উক্ত কিস্তি চুক্তিতে আপনি জামিনদার হিসেবে অঙ্গীকার করেছেন যে, গ্রাহক কিস্তি পরিশোধে ব্যর্থ হলে বকেয়া অর্থ পরিশোধের দায়ভার আপনি বহন করবেন।`,
      `গ্রাহক চুক্তির শর্ত ভঙ্গ করে নির্ধারিত সময়ে কিস্তি পরিশোধ করেননি। ${dues} এ বিষয়ে ইতিপূর্বে গ্রাহক ও আপনার সাথে যোগাযোগ করা হলেও অদ্যাবধি বকেয়া অর্থ পরিশোধ করা হয়নি।`,
      `অতএব, এই নোটিশ প্রাপ্তির ${days} দিনের মধ্যে, অর্থাৎ ${deadline} তারিখের মধ্যে, সম্পূর্ণ বকেয়া ${bnMoney(c.dueAmount)} এস ই ইলেকট্রনিক্স-এর অফিসে পরিশোধ করার জন্য আপনাকে বিশেষভাবে অনুরোধ করা হলো।`,
      `উল্লিখিত সময়ের মধ্যে বকেয়া পরিশোধে ব্যর্থ হলে কর্তৃপক্ষ গ্রাহক ও জামিনদার উভয়ের বিরুদ্ধে দেশের প্রচলিত আইন অনুযায়ী বকেয়া অর্থ আদায়ের জন্য প্রয়োজনীয় আইনানুগ ব্যবস্থা গ্রহণ করতে বাধ্য হবে এবং সেক্ষেত্রে যাবতীয় খরচ ও দায়ভার আপনাদের উপর বর্তাবে।`,
    ].join("\n\n");
  }

  return [
    intro,
    `এ বিষয়ে ইতিপূর্বে আপনাকে নোটিশ প্রদান ও যোগাযোগ করা হয়েছে, কিন্তু অদ্যাবধি বকেয়া অর্থ পরিশোধ করা হয়নি। ${dues}`,
    `এটি আপনার প্রতি চূড়ান্ত নোটিশ। আগামী ${deadline} তারিখের মধ্যে (${days} দিনের মধ্যে) সম্পূর্ণ বকেয়া ${bnMoney(c.dueAmount)} পরিশোধ করার জন্য আপনাকে শেষবারের মতো অনুরোধ করা হলো।`,
    `উক্ত সময়ের মধ্যে পরিশোধ না হলে আর কোনো নোটিশ প্রদান ছাড়াই কর্তৃপক্ষ গ্রাহক ও জামিনদার উভয়ের বিরুদ্ধে প্রচলিত আইন অনুযায়ী আইনানুগ ব্যবস্থা গ্রহণ করবে এবং এর যাবতীয় দায়ভার আপনাদের উপর বর্তাবে।`,
  ].join("\n\n");
}

/** Short SMS sent to the guarantor's mobile with the link to the notice document. */
export function guarantorNoticeSms(p: {
  level: GuarantorNoticeLevel;
  customerName: string;
  planCode: string;
  dueAmount: number;
  url: string;
}) {
  const head =
    p.level === "legal" ? "আইনি নোটিশ" : p.level === "final" ? "চূড়ান্ত নোটিশ" : "নোটিশ";
  return `SE Electronics ${head}: আপনি ${p.customerName}-এর কিস্তির (${p.planCode}) জামিনদার। বকেয়া ৳${p.dueAmount}। দ্রুত পরিশোধের ব্যবস্থা নিন। নোটিশ: ${p.url}`;
}
