import { SELLER_CERTIFICATE_TYPES } from "@/constants/sellerCertificates";
import type { SellerCertificateTemplateData } from "@/lib/sellerCertificate";

const GOLD = "#c9a227";
const GOLD_DK = "#9a7b18";
const NAVY = "#0a2f70";

const bnDate = (iso: string) =>
  new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

/** A laurel-wreath coin medallion (leaves on both sides) with a star + accent centre. */
function LaurelMedal({ accent }: { accent: string }) {
  const cx = 60;
  const cy = 60;
  const R = 44; // wreath radius
  // Two branches rising from the bottom to an open gap at the top.
  const branch = (side: 1 | -1) =>
    Array.from({ length: 9 }, (_, i) => {
      // 268° (bottom) sweeping up to 150° on the left / 30° on the right
      const a = 268 - side * (i * 13);
      const rad = (a * Math.PI) / 180;
      const x = cx + R * Math.cos(rad);
      const y = cy - R * Math.sin(rad);
      // leaf points outward along the radius
      const rot = 90 - a + side * 18;
      return (
        <ellipse
          key={`${side}-${i}`}
          cx={x}
          cy={y}
          rx={3.4}
          ry={7.4}
          fill={GOLD}
          stroke={GOLD_DK}
          strokeWidth={0.5}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      );
    });

  return (
    <svg viewBox="0 0 120 120" className="size-full">
      {/* laurel branches */}
      <path d={`M60 ${cy + R} A ${R} ${R} 0 0 1 ${cx + R * Math.cos((150 * Math.PI) / 180)} ${cy - R * Math.sin((150 * Math.PI) / 180)}`} fill="none" stroke={GOLD_DK} strokeWidth={1.1} />
      <path d={`M60 ${cy + R} A ${R} ${R} 0 0 0 ${cx + R * Math.cos((30 * Math.PI) / 180)} ${cy - R * Math.sin((30 * Math.PI) / 180)}`} fill="none" stroke={GOLD_DK} strokeWidth={1.1} />
      {branch(1)}
      {branch(-1)}
      {/* ribbon knot at the bottom */}
      <circle cx={60} cy={cy + R} r={3.2} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.6} />
      {/* coin medallion */}
      <circle cx={60} cy={60} r={30} fill={GOLD} />
      <circle cx={60} cy={60} r={30} fill="none" stroke={GOLD_DK} strokeWidth={1.4} />
      <circle cx={60} cy={60} r={26} fill={accent} />
      <circle cx={60} cy={60} r={26} fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.75} />
      {/* star + label */}
      <path d="M60 42l3.6 8.2 8.9.8-6.7 5.9 2 8.7L60 70l-7.8 4.3 2-8.7-6.7-5.9 8.9-.8z" fill="#f6e27a" />
      <text x="60" y="84" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800" letterSpacing="1.4" fontFamily="Inter, sans-serif">
        SE AWARD
      </text>
    </svg>
  );
}

/** A4 landscape (297mm x 210mm) seller award certificate, used for the preview and the PDF. */
export default function SellerCertificateTemplate({ data }: { data: SellerCertificateTemplateData }) {
  const kind = SELLER_CERTIFICATE_TYPES[data.certType] || SELLER_CERTIFICATE_TYPES.honor;
  const accent = kind.accent;

  return (
    <div
      className="relative w-[297mm] h-[210mm] overflow-hidden bg-white text-[#16213a]"
      style={{ fontFamily: "'SolaimanLipi', 'Tiro Bangla', 'Noto Sans Bengali', sans-serif", background: "radial-gradient(circle at 50% 40%, #ffffff 0%, #fbf8ef 70%, #f4ecd6 100%)" }}
    >
      {/* Frame: navy band, gold rule, corner ornaments */}
      <div className="absolute inset-[7mm] border-[5px]" style={{ borderColor: NAVY }} />
      <div className="absolute inset-[10mm] border-[1.5px]" style={{ borderColor: GOLD }} />
      {(["left-[7mm] top-[7mm]", "right-[7mm] top-[7mm] rotate-90", "right-[7mm] bottom-[7mm] rotate-180", "left-[7mm] bottom-[7mm] -rotate-90"] as const).map((pos) => (
        <svg key={pos} className={`absolute ${pos} size-[26mm]`} viewBox="0 0 100 100">
          <path d="M22 22 H70 M22 22 V70" stroke={GOLD} strokeWidth="3" fill="none" />
          <circle cx="22" cy="22" r="7" fill={GOLD} />
        </svg>
      ))}

      {/* Watermark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.logo} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110mm] opacity-[0.05] rounded-full" />

      <div className="absolute inset-[15mm] flex flex-col items-center text-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo} alt="SE Electronics" className="size-[18mm] rounded-full border-2 object-cover" style={{ borderColor: GOLD }} />
          <div className="text-left leading-tight">
            <div className="text-[29px] font-extrabold tracking-[4px]" style={{ color: NAVY, fontFamily: "Inter, sans-serif" }}>SE ELECTRONICS</div>
            <div className="text-[14.5px] font-semibold text-[#5b6784]">এস ই ইলেকট্রনিকস · বাদাম বাগিচা, সিলেট</div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-[6mm] text-[56px] font-bold leading-none" style={{ color: accent }}>{kind.title}</div>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="h-[1.5px] w-[32mm]" style={{ background: GOLD }} />
          <span className="text-[15.5px] font-bold uppercase tracking-[5px]" style={{ color: GOLD, fontFamily: "Inter, sans-serif" }}>{kind.english}</span>
          <span className="h-[1.5px] w-[32mm]" style={{ background: GOLD }} />
        </div>
        {data.period && (
          <div className="mt-2 px-4 py-[3px] rounded-sm text-white text-[15px] font-bold" style={{ background: accent }}>{data.period}</div>
        )}

        {/* Recipient */}
        <div className="mt-[8mm] text-[20px] font-semibold text-[#5b6784]">এই সার্টিফিকেট গর্বের সাথে প্রদান করা হলো</div>
        <div className="mt-1.5 min-w-[160mm] max-w-[230mm] border-b-2 px-6 pb-1 text-[48px] font-bold leading-tight" style={{ borderColor: GOLD, color: NAVY }}>
          {data.shopName}
        </div>
        <div className="mt-3 text-[18px] font-semibold text-[#334155]">
          স্বত্বাধিকারী: <b>{data.ownerName}</b>
          <span className="mx-2 text-[#c0c7d4]">|</span>সেলার আইডি: <b style={{ fontFamily: "Inter, sans-serif" }}>{data.sellerId}</b>
          {data.district && (<><span className="mx-2 text-[#c0c7d4]">|</span>জেলা: <b>{data.district}</b></>)}
        </div>

        <p className="mt-[7mm] max-w-[225mm] text-[21px] leading-[1.85] text-[#2b3445]">{kind.body}</p>
        {data.note && <p className="mt-2 max-w-[225mm] text-[18px] font-semibold italic" style={{ color: accent }}>{data.note}</p>}

        {/* Footer: date + number, laurel medal + QR, signature + seals */}
        <div className="mt-auto w-full grid grid-cols-3 items-end">
          <div className="text-left">
            <div className="text-[16.5px] font-bold">{bnDate(data.issuedAt)}</div>
            <div className="mt-1 w-[52mm] border-t border-[#94a3b8]" />
            <div className="text-[13.5px] font-semibold text-[#5b6784]">প্রদানের তারিখ</div>
            <div className="mt-2 text-[12.5px] font-bold text-[#5b6784]" style={{ fontFamily: "Inter, sans-serif" }}>Certificate No: {data.certNo}</div>
          </div>

          <div className="flex items-end justify-center gap-4">
            <div className="size-[36mm]">
              <LaurelMedal accent={accent} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrcode} alt="QR" className="size-[22mm] bg-white p-[1mm] border" style={{ borderColor: "#e2e8f0" }} />
          </div>

          <div className="relative flex flex-col items-center">
            {/* round office seal, stamped over the signature on the left */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.seal} alt="" className="absolute -left-[9mm] -bottom-[2mm] size-[28mm] object-contain opacity-[0.82] mix-blend-multiply -rotate-[8deg]" />
            {/* handwritten signature */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.sign} alt="Signature" className="w-[52mm] object-contain mix-blend-multiply -mb-1" />
            <div className="w-[56mm] border-t border-[#94a3b8]" />
            {/* chairman name seal */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.nameSeal} alt="সাহাব উদ্দিন মাহমুদ, চেয়ারম্যান" className="mt-1 w-[50mm] object-contain mix-blend-multiply" />
          </div>
        </div>
      </div>
    </div>
  );
}
