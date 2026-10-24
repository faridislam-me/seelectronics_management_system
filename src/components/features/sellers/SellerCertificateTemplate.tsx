import { SELLER_CERTIFICATE_TYPES } from "@/constants/sellerCertificates";
import type { SellerCertificateTemplateData } from "@/lib/sellerCertificate";

const GOLD = "#c9a227";
const GOLD_DK = "#9a7b18";
const NAVY = "#0a2f70";

const bnDate = (iso: string) =>
  new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });

/** Serrated (postage-stamp edge) circle path. */
function serratedCircle(cx: number, cy: number, rOuter: number, rInner: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / teeth;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Round "BEST SERVICE POINT" stamp: serrated outer edge, double ring, star on top, three-line label. */
function ServiceSeal({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" className="size-full">
      <path d={serratedCircle(60, 60, 56, 52.5, 44)} fill="#ffffff" stroke={accent} strokeWidth={1.2} />
      <circle cx={60} cy={60} r={49} fill="none" stroke={accent} strokeWidth={2.2} />
      <circle cx={60} cy={60} r={45} fill="none" stroke={accent} strokeWidth={0.8} />
      {/* star */}
      <path d="M60 22.5l3.1 6.9 7.5.7-5.7 5 1.7 7.4L60 38.7l-6.6 3.8 1.7-7.4-5.7-5 7.5-.7z" fill={accent} />
      <g fill={accent} fontFamily="Inter, Arial, sans-serif" fontWeight="800" textAnchor="middle" letterSpacing="1.2">
        <text x="60" y="60" fontSize="12">BEST</text>
        <text x="60" y="74.5" fontSize="12">SERVICE</text>
        <text x="60" y="89" fontSize="12">POINT</text>
      </g>
      {/* small dots left/right of the star, like an engraved stamp */}
      <circle cx={34} cy={50} r={1.3} fill={accent} />
      <circle cx={86} cy={50} r={1.3} fill={accent} />
    </svg>
  );
}

/** Archimedean spiral polyline (curl) centred on cx,cy. */
function spiral(cx: number, cy: number, r0: number, r1: number, turns: number, dir: 1 | -1, phase = 0) {
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = phase + dir * t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
}

/** Sine wave path across the given width. */
function wave(y: number, width: number, amp: number, len: number) {
  const pts: string[] = [];
  for (let x = 0; x <= width; x += 2) pts.push(`${x} ${(y + amp * Math.sin((x / len) * Math.PI * 2)).toFixed(2)}`);
  return `M${pts.join(" L")}`;
}

/**
 * Symmetric scroll-work flourish (blue curls) with a double wavy band beneath,
 * matching the reference certificate: the seal sits on top of the centre curls.
 */
function Flourish({ accent }: { accent: string }) {
  const W = 760;
  const half = (
    <g fill="none" stroke="url(#flourishGrad)" strokeWidth={3} strokeLinecap="round">
      {/* big centre curl */}
      <path d={spiral(352, 28, 2, 28, 1.3, -1, Math.PI * 0.5)} />
      {/* second curl, smaller, sitting on the line */}
      <path d={spiral(410, 24, 1.5, 13, 1.2, 1, Math.PI)} />
      {/* main line out to the end */}
      <path d="M352 52 C 380 52, 395 40, 420 36 C 470 30, 560 30, 640 30" />
      {/* small lower swash under the second curl */}
      <path d="M396 44 c 14 10 36 10 56 2" strokeWidth={1.5} opacity={0.8} />
      {/* end curl */}
      <path d={spiral(652, 30, 1, 9, 1.1, -1, Math.PI)} strokeWidth={2} />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} 90`} className="h-[20mm] w-[220mm]">
      <defs>
        <linearGradient id="flourishGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5b3fb5" />
          <stop offset="0.5" stopColor={accent} />
          <stop offset="1" stopColor="#2fb3d6" />
        </linearGradient>
      </defs>
      <g transform={`translate(${W / 2 - 380},0)`}>{half}</g>
      <g transform={`translate(${W / 2 + 380},0) scale(-1,1)`}>{half}</g>
      {/* centre knot under the seal */}
      <circle cx={W / 2} cy={52} r={3} fill={accent} />
      {/* double wavy band */}
      <path d={wave(74, W, 2.2, 16)} fill="none" stroke={accent} strokeWidth={1.6} opacity={0.9} />
      <path d={wave(81, W, 2.2, 16)} fill="none" stroke={accent} strokeWidth={1.1} opacity={0.6} />
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

        {/* "Best service point" seal sitting on the scroll-work flourish, above the footer */}
        <div className="mt-auto flex w-full flex-col items-center pb-2">
          <div className="relative z-10 size-[24mm]">
            <ServiceSeal accent={accent} />
          </div>
          <div className="-mt-[7mm]">
            <Flourish accent={accent} />
          </div>
        </div>

        {/* Footer: date + number, QR, signature + seals */}
        <div className="w-full grid grid-cols-3 items-end">
          <div className="text-left">
            <div className="text-[16.5px] font-bold">{bnDate(data.issuedAt)}</div>
            <div className="mt-1 w-[52mm] border-t border-[#94a3b8]" />
            <div className="text-[13.5px] font-semibold text-[#5b6784]">প্রদানের তারিখ</div>
            <div className="mt-2 text-[12.5px] font-bold text-[#5b6784]" style={{ fontFamily: "Inter, sans-serif" }}>Certificate No: {data.certNo}</div>
          </div>

          <div className="flex items-end justify-center">
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
