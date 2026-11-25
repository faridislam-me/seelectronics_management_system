import {
  GUARANTOR_NOTICE_LEVEL_META,
  bnDate,
  bnMoney,
  bnNumber,
  isGuarantorNoticeLevel,
} from "@/lib/guarantorNotice";

export interface GuarantorNoticeTemplateData {
  noticeNo: string;
  level: string;
  createdAt: Date | string;
  deadlineDate: Date | string | null;
  guarantorName: string | null;
  guarantorPhone: string;
  guarantorAddress: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerId: string | null;
  productModel: string;
  planCode: string;
  monthlyAmount: number | null;
  dueCount: number;
  dueAmount: number;
  remainingAmount: number;
  body: string;
  /** Letterhead / signature images (data URI or URL); each optional and guarded. */
  logo?: string;
  seal?: string;
  chairmanSign?: string;
  chairmanSeal?: string;
}

const NAVY = "#0b3d91";
const NAVY_DARK = "#0a285f";
const GOLD = "#c99700";

/**
 * Formal notice letter to an installment guarantor (জামিনদার) on the SE
 * Electronics letterhead. Rendered both by the PDF generator (static markup)
 * and by the public notice page, so it must stay free of client-only code.
 */
export default function GuarantorNoticeTemplate({ data }: { data: GuarantorNoticeTemplateData }) {
  const meta = GUARANTOR_NOTICE_LEVEL_META[isGuarantorNoticeLevel(data.level) ? data.level : "reminder"];
  const isLegal = data.level === "legal" || data.level === "final";
  const accent = isLegal ? "#b91c1c" : NAVY;
  const paragraphs = data.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className="flex border-b border-[#cdddf2] last:border-b-0 text-[12.5px]">
      <div className="w-[38%] px-3 py-[5px] font-bold border-r border-[#cdddf2] bg-[#eef4fc]" style={{ color: NAVY_DARK }}>
        {label}
      </div>
      <div className={`flex-1 px-3 py-[5px] break-words ${strong ? "font-extrabold" : "font-semibold"}`} style={strong ? { color: "#b91c1c" } : undefined}>
        {value}
      </div>
    </div>
  );

  return (
    <div
      className="relative w-[210mm] min-h-[297mm] mx-auto bg-white box-border flex flex-col"
      style={{ fontFamily: `'SolaimanLipi', 'Tiro Bangla', sans-serif`, color: "#13213a", lineHeight: 1.55 }}
    >
      {/* Letterhead */}
      <div className="px-[16mm] pt-[11mm]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt="SE Electronics" className="w-[62px] h-[62px] object-contain" />
            ) : (
              <div className="w-[62px] h-[62px] rounded-full border-2 flex items-center justify-center font-black" style={{ borderColor: NAVY, color: NAVY }}>SE</div>
            )}
            <div className="leading-tight">
              <div className="text-[26px] font-black tracking-tight" style={{ color: NAVY }}>SE ELECTRONICS</div>
              <div className="text-[13px] font-bold" style={{ color: NAVY_DARK }}>এস ই ইলেকট্রনিক্স</div>
              <div className="text-[10.5px] font-semibold text-slate-500">Smart Power • Better Life</div>
            </div>
          </div>
          <div className="text-right text-[10.5px] font-semibold text-slate-600 leading-snug">
            <div>Head Office: Airport Road, Badam Bagicha,</div>
            <div>Road 2, Sylhet-3100</div>
            <div className="font-bold" style={{ color: NAVY }}>Phone: 01322-247774</div>
          </div>
        </div>
        <div className="mt-2 h-[3px] rounded-full" style={{ background: `linear-gradient(90deg, ${NAVY_DARK}, ${NAVY} 60%, ${GOLD})` }} />
      </div>

      <div className="px-[16mm] pt-4 flex-1 flex flex-col">
        {/* Title */}
        <div className="flex justify-center">
          <div
            className="px-8 py-[5px] rounded-md text-white text-[18px] font-black tracking-wide"
            style={{ background: accent, border: `2px solid ${GOLD}` }}
          >
            {meta.title}
          </div>
        </div>

        {/* Ref + date */}
        <div className="flex justify-between items-end mt-3 text-[12.5px] font-bold" style={{ color: NAVY_DARK }}>
          <div>স্মারক নং: <span className="font-extrabold">{data.noticeNo}</span></div>
          <div>তারিখ: {bnDate(data.createdAt)}</div>
        </div>

        {/* Recipient */}
        <div className="mt-3 text-[13px]">
          <p className="font-bold">প্রাপক (জামিনদার),</p>
          <p className="font-extrabold">{data.guarantorName || "জামিনদার"}</p>
          <p>মোবাইল: {data.guarantorPhone}</p>
          {data.guarantorAddress ? <p>ঠিকানা: {data.guarantorAddress}</p> : null}
        </div>

        <p className="mt-3 text-[13px]">
          <span className="font-bold">বিষয়ঃ</span>{" "}
          <span className="font-bold underline underline-offset-2">{meta.subject}।</span>
        </p>

        {/* Customer + plan + dues */}
        <div className="mt-3 rounded-md overflow-hidden border border-[#cdddf2]">
          <Row label="গ্রাহকের নাম" value={`${data.customerName}${data.customerId ? ` (আইডি: ${data.customerId})` : ""}`} />
          <Row label="গ্রাহকের মোবাইল" value={data.customerPhone} />
          {data.customerAddress ? <Row label="গ্রাহকের ঠিকানা" value={data.customerAddress} /> : null}
          <Row label="পণ্য" value={data.productModel} />
          <Row
            label="কিস্তি নম্বর"
            value={`${data.planCode}${data.monthlyAmount ? ` · মাসিক কিস্তি ${bnMoney(data.monthlyAmount)}` : ""}`}
          />
          <Row label="বকেয়া কিস্তির সংখ্যা" value={`${bnNumber(data.dueCount)}টি`} />
          <Row label="বকেয়া অর্থের পরিমাণ" value={bnMoney(data.dueAmount)} strong />
          <Row label="মোট অপরিশোধিত অর্থ" value={bnMoney(data.remainingAmount)} />
          {data.deadlineDate ? <Row label="পরিশোধের শেষ তারিখ" value={bnDate(data.deadlineDate)} strong /> : null}
        </div>

        {/* Body */}
        <div className="mt-3 text-[13px] text-justify">
          <p className="font-bold mb-1">জনাব/জনাবা,</p>
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-2 whitespace-pre-wrap">{p}</p>
          ))}
        </div>

        {/* Signature block */}
        <div className="flex justify-between items-end mt-auto pt-6 pb-4">
          <div className="text-left w-[70mm]">
            {data.seal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.seal} alt="seal" className="w-[30mm] mb-1 object-contain" />
            ) : null}
            <p className="text-[12px] font-bold">জরুরি যোগাযোগঃ ০১৩২২২৪৭৭৭৪</p>
            <p className="text-[10.5px] text-slate-500">নোটিশ নং {data.noticeNo} · কিস্তি {data.planCode}</p>
          </div>
          <div className="text-center w-[64mm]">
            <div className="flex flex-col items-center">
              {data.chairmanSign ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.chairmanSign} alt="signature" className="h-[50px] w-[150px] object-contain" />
              ) : <div className="h-[50px]" />}
              {data.chairmanSeal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.chairmanSeal} alt="name seal" className="-mt-2 h-[42px] w-[170px] object-contain" />
              ) : null}
            </div>
            <div className="border-t-2 pt-1" style={{ borderColor: NAVY }}>
              <p className="text-[12px] font-extrabold">কর্তৃপক্ষের পক্ষে</p>
              <p className="text-[12px] font-bold" style={{ color: NAVY }}>এস ই ইলেকট্রনিক্স</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom contact bar */}
      <div
        className="flex items-center justify-between px-[16mm] py-[8px] text-white text-[11px] font-bold"
        style={{ background: `linear-gradient(90deg, ${NAVY_DARK}, ${NAVY})` }}
      >
        <span>Head Office : Airport Road, Badam Bagicha, Road 2, Sylhet-3100</span>
        <span>01322-247774</span>
      </div>
    </div>
  );
}

/** Maps a stored notice (+ its plan, when still present) to the template data. */
export function toGuarantorNoticeTemplateData(
  notice: {
    noticeNo: string;
    level: string;
    createdAt: Date | string;
    deadlineDate: Date | string | null;
    guarantorName: string | null;
    guarantorPhone: string;
    guarantorAddress: string | null;
    customerName: string;
    customerPhone: string;
    productModel: string;
    planCode: string;
    dueCount: number;
    dueAmount: number;
    remainingAmount: number;
    body: string;
  },
  plan: { customerAddress: string | null; customerId: string; monthlyAmount: number } | null,
  images: Pick<GuarantorNoticeTemplateData, "logo" | "seal" | "chairmanSign" | "chairmanSeal"> = {},
): GuarantorNoticeTemplateData {
  return {
    noticeNo: notice.noticeNo,
    level: notice.level,
    createdAt: notice.createdAt,
    deadlineDate: notice.deadlineDate,
    guarantorName: notice.guarantorName,
    guarantorPhone: notice.guarantorPhone,
    guarantorAddress: notice.guarantorAddress,
    customerName: notice.customerName,
    customerPhone: notice.customerPhone,
    customerAddress: plan?.customerAddress ?? null,
    customerId: plan?.customerId ?? null,
    productModel: notice.productModel,
    planCode: notice.planCode,
    monthlyAmount: plan?.monthlyAmount ?? null,
    dueCount: notice.dueCount,
    dueAmount: notice.dueAmount,
    remainingAmount: notice.remainingAmount,
    body: notice.body,
    ...images,
  };
}
