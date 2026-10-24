import { SELLER_CERTIFICATE_TYPES } from "@/constants/sellerCertificates";
import type { SellerCertificateTemplateData } from "@/lib/sellerCertificate";

const GOLD = "#c9a227";
const NAVY = "#0a2f70";

const bnDate = (iso: string) =>
  new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

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
          <img src={data.logo} alt="SE Electronics" className="size-[14mm] rounded-full border-2 object-cover" style={{ borderColor: GOLD }} />
          <div className="text-left leading-tight">
            <div className="text-[26px] font-extrabold tracking-[4px]" style={{ color: NAVY, fontFamily: "Inter, sans-serif" }}>SE ELECTRONICS</div>
            <div className="text-[13.5px] font-semibold text-[#5b6784]">এস ই ইলেকট্রনিকস · বাদাম বাগিচা, সিলেট</div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-[3mm] text-[50px] font-bold leading-none" style={{ color: accent }}>{kind.title}</div>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="h-[1.5px] w-[32mm]" style={{ background: GOLD }} />
          <span className="text-[15.5px] font-bold uppercase tracking-[5px]" style={{ color: GOLD, fontFamily: "Inter, sans-serif" }}>{kind.english}</span>
          <span className="h-[1.5px] w-[32mm]" style={{ background: GOLD }} />
        </div>
        {data.period && (
          <div className="mt-2 px-4 py-[3px] rounded-sm text-white text-[15px] font-bold" style={{ background: accent }}>{data.period}</div>
        )}

        {/* Recipient */}
        <div className="mt-[4mm] text-[18px] font-semibold text-[#5b6784]">এই সার্টিফিকেট গর্বের সাথে প্রদান করা হলো</div>
        <div className="mt-1 min-w-[160mm] max-w-[230mm] border-b-2 px-6 pb-0.5 text-[42px] font-bold leading-tight" style={{ borderColor: GOLD, color: NAVY }}>
          {data.shopName}
        </div>
        <div className="mt-1.5 text-[17px] font-semibold text-[#334155]">
          স্বত্বাধিকারী: <b>{data.ownerName}</b>
          <span className="mx-2 text-[#c0c7d4]">|</span>সেলার আইডি: <b style={{ fontFamily: "Inter, sans-serif" }}>{data.sellerId}</b>
          {data.district && (<><span className="mx-2 text-[#c0c7d4]">|</span>জেলা: <b>{data.district}</b></>)}
        </div>

        <p className="mt-[2.5mm] max-w-[236mm] text-[19px] leading-[1.55] text-[#2b3445]">{kind.body}</p>
        {data.note && <p className="mt-1 max-w-[230mm] text-[16.5px] leading-[1.45] font-semibold italic" style={{ color: accent }}>{data.note}</p>}

        {/* "Best service point" stamp on scroll-work (client-supplied artwork), centred above the footer.
            flex-1 + min-h-0 lets it shrink when the text above is long so the footer never overflows the page. */}
        <div className="flex min-h-0 flex-1 w-full items-center justify-center py-[1mm]">
          {/* banner wants ~34mm; it only shrinks below that when the text above runs long */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.banner} alt="Best Service Point" className="h-[34mm] max-h-full w-auto max-w-[200mm] object-contain" />
        </div>

        {/* Footer: date + number, QR, signature + seals */}
        <div className="w-full shrink-0 grid grid-cols-3 items-end">
          <div className="flex items-end gap-[4mm] text-left">
            <div>
              <div className="text-[16.5px] font-bold">{bnDate(data.issuedAt)}</div>
              <div className="mt-1 w-[52mm] border-t border-[#94a3b8]" />
              <div className="text-[13.5px] font-semibold text-[#5b6784]">প্রদানের তারিখ</div>
              <div className="mt-2 text-[12.5px] font-bold text-[#5b6784]" style={{ fontFamily: "Inter, sans-serif" }}>Certificate No: {data.certNo}</div>
            </div>
            {/* round office seal, on the left as the client asked */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.seal} alt="" className="size-[26mm] shrink-0 object-contain opacity-[0.85] mix-blend-multiply -rotate-[8deg]" />
          </div>

          <div className="flex items-end justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qrcode} alt="QR" className="size-[26mm] bg-white p-[1mm] border" style={{ borderColor: "#e2e8f0" }} />
          </div>

          <div className="relative flex flex-col items-center">
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
