import { SELLER_CERTIFICATE_TYPES } from "@/constants/sellerCertificates";
import type { SellerCertificateTemplateData } from "@/lib/sellerCertificate";

const GOLD = "#c9a227";
const NAVY = "#0a2f70";

const bnDate = (iso: string) =>
  new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

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
      <img src={data.logo} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[105mm] opacity-[0.05] rounded-full" />

      <div className="absolute inset-[16mm] flex flex-col items-center text-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo} alt="SE Electronics" className="size-[17mm] rounded-full border-2 object-cover" style={{ borderColor: GOLD }} />
          <div className="text-left leading-tight">
            <div className="text-[25px] font-extrabold tracking-[4px]" style={{ color: NAVY, fontFamily: "Inter, sans-serif" }}>SE ELECTRONICS</div>
            <div className="text-[13px] font-semibold text-[#5b6784]">এস ই ইলেকট্রনিকস · বাদাম বাগিচা, সিলেট</div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-[7mm] text-[50px] font-bold leading-none" style={{ color: accent }}>{kind.title}</div>
        <div className="mt-2 flex items-center gap-3">
          <span className="h-[1.5px] w-[30mm]" style={{ background: GOLD }} />
          <span className="text-[14px] font-bold uppercase tracking-[5px]" style={{ color: GOLD, fontFamily: "Inter, sans-serif" }}>{kind.english}</span>
          <span className="h-[1.5px] w-[30mm]" style={{ background: GOLD }} />
        </div>
        {data.period && (
          <div className="mt-2 px-4 py-[3px] rounded-sm text-white text-[14px] font-bold" style={{ background: accent }}>{data.period}</div>
        )}

        {/* Recipient */}
        <div className="mt-[9mm] text-[17px] font-semibold text-[#5b6784]">এই সার্টিফিকেট গর্বের সাথে প্রদান করা হলো</div>
        <div className="mt-1 min-w-[150mm] max-w-[220mm] border-b-2 px-6 pb-1 text-[44px] font-bold leading-tight" style={{ borderColor: GOLD, color: NAVY }}>
          {data.shopName}
        </div>
        <div className="mt-2.5 text-[16px] font-semibold text-[#334155]">
          স্বত্বাধিকারী: <b>{data.ownerName}</b>
          <span className="mx-2 text-[#c0c7d4]">|</span>সেলার আইডি: <b style={{ fontFamily: "Inter, sans-serif" }}>{data.sellerId}</b>
          {data.district && (<><span className="mx-2 text-[#c0c7d4]">|</span>জেলা: <b>{data.district}</b></>)}
        </div>

        <p className="mt-[8mm] max-w-[220mm] text-[18.5px] leading-[1.8] text-[#2b3445]">{kind.body}</p>
        {data.note && <p className="mt-2 max-w-[220mm] text-[16.5px] font-semibold italic" style={{ color: accent }}>{data.note}</p>}

        {/* Footer: date + number, medal + QR, signature */}
        <div className="mt-auto w-full grid grid-cols-3 items-end">
          <div className="text-left">
            <div className="text-[15px] font-bold">{bnDate(data.issuedAt)}</div>
            <div className="mt-1 w-[52mm] border-t border-[#94a3b8]" />
            <div className="text-[12.5px] font-semibold text-[#5b6784]">প্রদানের তারিখ</div>
            <div className="mt-2 text-[11.5px] font-bold text-[#5b6784]" style={{ fontFamily: "Inter, sans-serif" }}>Certificate No: {data.certNo}</div>
          </div>

          <div className="flex items-end justify-center gap-4">
            <div className="relative size-[30mm] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${GOLD}, #f6e27a, ${GOLD}, #a8841a, ${GOLD})` }} />
              <div className="absolute inset-[2.2mm] rounded-full border-2 border-white/70" style={{ background: accent }} />
              <div className="relative flex flex-col items-center text-white leading-none">
                <svg viewBox="0 0 24 24" className="size-[9mm]" fill="#f6e27a"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" /></svg>
                <span className="mt-1 text-[10px] font-extrabold tracking-[1.5px]" style={{ fontFamily: "Inter, sans-serif" }}>SE AWARD</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrcode} alt="QR" className="size-[22mm] bg-white p-[1mm] border" style={{ borderColor: "#e2e8f0" }} />
          </div>

          <div className="relative flex flex-col items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.seal} alt="" className="absolute right-[66mm] bottom-0 size-[25mm] object-contain opacity-85 mix-blend-multiply" />
            {/* the signature artwork already carries the chairman's name and title */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.sign} alt="Signature" className="w-[62mm] object-contain mix-blend-multiply" />
          </div>
        </div>
      </div>
    </div>
  );
}
