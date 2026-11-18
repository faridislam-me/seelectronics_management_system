import type { ReactNode } from "react";
import { InstallmentNocTemplateData } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate, toBanglaNumber } from "@/utils";

/** Money as Bangla numerals with a ৳ suffix. */
const bdt = (n: number) =>
  `${toBanglaNumber(Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }))}৳`;

const bnDate = (d: Date | string | number | null) => (d ? toBanglaNumber(formatDate(d)) : "—");

const NAVY = "#0b3d91";
const NAVY_DARK = "#0a285f";
const GOLD = "#c99700";

/**
 * Official কিস্তি NOC certificate — designed to match the client's branded
 * "SE ELECTRONICS — Smart Power • Better Life / Powered by Trust" pad: a
 * blue-and-gold waved A4 certificate with a NOC banner, a certification
 * paragraph, a clean (no raw table) customer-info block, conditions, and
 * officer + chairman signatures with the office seal. All values are
 * data-driven; every image is optional and guarded on render.
 */
export default function InstallmentNocTemplate({
  data,
}: {
  data: InstallmentNocTemplateData;
}) {
  const productName = [data.productBrand, data.productModel].filter(Boolean).join(" ");
  const productLine = [productName, data.productType].filter(Boolean).join(" · ");

  // One styled "label : value" row, alternating light-blue shading like the pad.
  const InfoRow = ({
    icon,
    label,
    value,
    shaded,
  }: {
    icon?: string;
    label: string;
    value: string;
    shaded?: boolean;
  }) => (
    <div
      className="flex items-stretch border-b border-[#cdddf2] text-[12.5px]"
      style={{ background: shaded ? "#eef4fc" : "#ffffff" }}
    >
      <div className="w-[42%] flex items-center gap-2 px-3 py-[6px] border-r border-[#cdddf2]">
        {icon ? <span className="text-[13px]" style={{ color: NAVY }}>{icon}</span> : null}
        <span className="font-bold" style={{ color: NAVY_DARK }}>{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-2 px-3 py-[6px]">
        <span className="font-bold text-slate-400">:</span>
        <span className="font-semibold text-slate-900 break-words">{value}</span>
      </div>
    </div>
  );

  const Condition = ({ n, children }: { n: number; children: ReactNode }) => (
    <div className="flex items-start gap-2.5 mb-1.5">
      <span
        className="shrink-0 mt-[1px] flex items-center justify-center rounded-full text-white text-[11px] font-black"
        style={{ width: "18px", height: "18px", background: NAVY }}
      >
        {toBanglaNumber(n)}
      </span>
      <span className="text-[12px] leading-snug text-slate-800">{children}</span>
    </div>
  );

  // A section heading pill: navy gradient band with gold underline accents.
  const SectionHead = ({ title }: { title: string }) => (
    <div className="flex justify-center my-2.5">
      <div
        className="px-7 py-[5px] rounded-full text-white text-[13px] font-extrabold tracking-wide shadow-sm"
        style={{ background: `linear-gradient(90deg, ${NAVY_DARK}, ${NAVY})` }}
      >
        {title}
      </div>
    </div>
  );

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white overflow-hidden"
      style={{ fontFamily: `'SolaimanLipi', 'Tiro Bangla', sans-serif`, color: "#13213a" }}
    >
      {/* ── Decorative corner waves (navy + gold) ── */}
      <svg className="absolute top-0 left-0" width="100%" height="150" viewBox="0 0 800 150" preserveAspectRatio="none" style={{ zIndex: 0 }}>
        <path d="M0,0 L800,0 L800,34 C560,96 300,52 120,96 C60,110 24,104 0,92 Z" fill={NAVY} opacity="0.1" />
        <path d="M0,0 L800,0 L800,20 C520,70 260,30 96,66 C48,76 20,72 0,62 Z" fill={NAVY} opacity="0.16" />
        <path d="M520,0 L800,0 L800,70 C700,58 640,30 600,8 C580,-2 548,-4 520,0 Z" fill={GOLD} opacity="0.5" />
      </svg>
      <svg className="absolute bottom-0 left-0" width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="none" style={{ zIndex: 0 }}>
        <path d="M0,120 L800,120 L800,40 C560,2 300,52 110,24 C56,16 22,24 0,40 Z" fill={NAVY} opacity="0.08" />
        <path d="M0,120 L280,120 C220,96 140,104 70,84 C30,72 10,92 0,104 Z" fill={GOLD} opacity="0.45" />
      </svg>

      {/* ── Content ── */}
      <div className="relative px-[46px] pt-[30px]" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logo} alt="SE Electronics" className="w-[62px] h-[62px] object-contain" />
            ) : (
              <div className="w-[62px] h-[62px] rounded-full border-2 flex items-center justify-center font-black" style={{ borderColor: NAVY, color: NAVY }}>SE</div>
            )}
            <div className="leading-tight">
              <div className="text-[26px] font-black tracking-tight" style={{ color: NAVY }}>SE ELECTRONICS</div>
              <div className="text-[11px] font-semibold text-slate-500 tracking-wide">Smart Power • Better Life</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded px-2 py-[2px] text-[10.5px] font-bold text-white" style={{ background: NAVY }}>
                SE IPS BD <span className="opacity-60">|</span> SE POWER IPS
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-[2px]">Reliable Power | Trusted Service</div>
            </div>
          </div>
          <div className="text-right pt-1">
            <div className="text-[20px] italic font-extrabold" style={{ color: NAVY, fontFamily: "Georgia, serif" }}>Powered</div>
            <div className="text-[20px] italic font-extrabold -mt-1" style={{ color: GOLD, fontFamily: "Georgia, serif" }}>by Trust</div>
            <div className="h-[3px] w-[90px] ml-auto mt-[2px] rounded-full" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
          </div>
        </div>

        {/* Title band — centered NOC banner (no seal beside it). */}
        <div className="flex justify-center mt-5">
          <div className="w-full max-w-[520px]">
            <div
              className="rounded-[14px] px-6 py-2 text-center shadow-md"
              style={{ background: `linear-gradient(90deg, ${NAVY_DARK}, ${NAVY})`, border: `2px solid ${GOLD}` }}
            >
              <div className="text-white text-[22px] font-black leading-tight tracking-wide">NO OBJECTION CERTIFICATE</div>
              <div className="text-[15px] font-black" style={{ color: "#ffd873" }}>(NOC)</div>
            </div>
            <div className="flex justify-center -mt-[10px]">
              <div className="rounded-full bg-white px-5 py-[3px] text-[13px] font-extrabold shadow-sm" style={{ border: `2px solid ${NAVY}`, color: NAVY }}>
                কিস্তি গ্রাহকের জন্য
              </div>
            </div>
          </div>
        </div>

        {/* Ref + Date */}
        <div className="flex justify-between items-end mt-4 text-[12px] font-bold" style={{ color: NAVY_DARK }}>
          <div>Ref: SE/NOC/{new Date(data.issuedDate).getFullYear()}/<span className="font-extrabold">{data.planCode}</span></div>
          <div>Date: {bnDate(data.issuedDate)}</div>
        </div>

        {/* Certification paragraph */}
        <div className="mt-3 text-[12.5px] leading-[1.9] text-justify text-slate-800">
          এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, জনাব/জনাবা <span className="font-extrabold" style={{ color: NAVY }}>{data.customerName}</span>
          {data.customerAddress ? <>, ঠিকানা: <span className="font-semibold">{data.customerAddress}</span></> : null}। তিনি{" "}
          <span className="font-extrabold" style={{ color: NAVY }}>SE Electronics</span> এর নিকট হতে{" "}
          <span className="font-extrabold">{productName || "উক্ত পণ্য"}</span> ক্রয়ের পর কিস্তির মাধ্যমে পরিশোধের জন্য আবেদন
          করেছেন এবং তার কিস্তি সংক্রান্ত কোন প্রকার আপত্তি বা বিরোধ নেই। অতএব, তিনি আমাদের প্রতিষ্ঠান হতে উক্ত পণ্য
          কিস্তিতে ক্রয় করতে পারেন—এ মর্মে এ NOC প্রদান করা হলো।
        </div>

        {/* Customer info */}
        <SectionHead title="গ্রাহকের তথ্য" />
        <div className="rounded-md overflow-hidden border border-[#cdddf2]">
          <InfoRow icon="👤" label="গ্রাহকের নাম" value={data.customerName || "—"} shaded />
          <InfoRow icon="🆔" label="গ্রাহক আইডি" value={data.customerId || "—"} />
          <InfoRow icon="📱" label="মোবাইল নম্বর" value={data.customerPhone || "—"} shaded />
          <InfoRow icon="📍" label="ঠিকানা" value={data.customerAddress || "—"} />
          <InfoRow label="পণ্যের বিবরণ" value={productLine || "—"} shaded />
          <InfoRow label="কিস্তির পরিমাণ" value={`${bdt(data.monthlyAmount)} / মাস`} />
          <InfoRow label="কিস্তির মেয়াদ" value={`${toBanglaNumber(data.months)} মাস`} shaded />
          <InfoRow label="কিস্তি শুরুর তারিখ" value={bnDate(data.startDate)} />
        </div>

        {/* Conditions */}
        <SectionHead title="শর্তাবলি" />
        <div className="px-1">
          <Condition n={1}>এই NOC শুধুমাত্র উক্ত গ্রাহকের কিস্তি ব্যবস্থার জন্য প্রযোজ্য।</Condition>
          <Condition n={2}>কিস্তি পরিশোধের নিয়ম মেনে চলা গ্রাহকের দায়িত্ব।</Condition>
          <Condition n={3}>প্রতিষ্ঠানের নীতি অনুযায়ী যেকোনো সময় এই NOC বাতিল হতে পারে।</Condition>
          <Condition n={4}>বিস্তারিত জানতে আমাদের অফিস/সার্ভিস সেন্টারের সাথে যোগাযোগ করুন।</Condition>
        </div>

        {/* Signatures — LEFT: Manager (signature + name seal), MIDDLE: bigger
            QR, RIGHT: Chairman (signature + চেয়ারম্যান name seal). No complaint
            seal. */}
        <div className="grid grid-cols-3 items-end gap-2 mt-7">
          {/* Manager (left) */}
          <div className="text-center">
            {data.managerSign ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.managerSign} alt="manager sign" className="h-[58px] mx-auto object-contain" />
            ) : <div className="h-[58px]" />}
            <div className="border-t-2 mx-auto w-[86%] pt-1" style={{ borderColor: NAVY }}>
              <div className="text-[11.5px] font-extrabold text-slate-800">প্রতিষ্ঠানের ম্যানেজার</div>
              <div className="text-[11px] font-bold" style={{ color: NAVY }}>SE Electronics</div>
              <div className="text-[10px] text-slate-500">Sylhet</div>
            </div>
          </div>
          {/* QR (middle, enlarged) */}
          <div className="flex flex-col items-center justify-end gap-1">
            {data.qrcode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.qrcode} alt="qr" className="w-[92px] h-[92px] object-contain" />
            ) : <div className="h-[92px]" />}
            <div className="text-[10px] font-bold" style={{ color: NAVY }}>Scan for Service</div>
          </div>
          {/* Chairman (right) */}
          <div className="text-center">
            <div className="flex flex-col items-center">
              {data.chairmanSign ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.chairmanSign} alt="chairman sign" className="h-[50px] w-[150px] mx-auto object-contain" />
              ) : <div className="h-[50px]" />}
              {data.chairmanSeal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.chairmanSeal} alt="chairman seal" className="-mt-2 h-[42px] w-[170px] mx-auto object-contain" />
              ) : null}
            </div>
            <div className="border-t-2 mx-auto w-[86%] pt-1" style={{ borderColor: NAVY }}>
              <div className="text-[11.5px] font-extrabold text-slate-800">চেয়ারম্যান</div>
              <div className="text-[11px] font-bold" style={{ color: NAVY }}>SE Electronics</div>
              <div className="text-[10px] text-slate-500">Sylhet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom contact bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[46px] py-[9px] text-white text-[11.5px] font-bold"
        style={{ zIndex: 10, background: `linear-gradient(90deg, ${NAVY_DARK}, ${NAVY})` }}
      >
        <span>📍 Head Office : Airport Road, Badam Bagicha, Road 2, Sylhet-3100</span>
        <span>📞 01322-247774</span>
      </div>
    </div>
  );
}
