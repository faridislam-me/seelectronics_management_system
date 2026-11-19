import { getPublicWinners } from "@/actions/lotteryActions";
import { MapPin, Phone, Trophy, User } from "lucide-react";

export const metadata = {
  title: "SE Electronics লটারি বিজয়ী",
  description: "SE Electronics লটারির বিজয়ীদের তালিকা",
};

export const dynamic = "force-dynamic";

// English → Bengali numerals for rank labels.
const toBn = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const rankLabel = (rank: number) =>
  rank === 1
    ? "১ম পুরস্কার"
    : rank === 2
      ? "২য় পুরস্কার"
      : rank === 3
        ? "৩য় পুরস্কার"
        : `${toBn(rank)} নম্বর বিজয়ী`;

// Rank-specific accent (gold / silver / bronze, then a navy default).
const rankTone = (rank: number) =>
  rank === 1
    ? { badge: "from-amber-400 to-amber-600", ring: "ring-amber-300" }
    : rank === 2
      ? { badge: "from-slate-300 to-slate-500", ring: "ring-slate-300" }
      : rank === 3
        ? { badge: "from-orange-400 to-orange-600", ring: "ring-orange-300" }
        : { badge: "from-[#1259c9] to-[#1f7cf0]", ring: "ring-[#9fb6e0]" };

// Confetti + star pieces for the celebratory header (generated per request).
const CONFETTI = Array.from({ length: 56 }, (_, i) => {
  const colors = ["#f59e0b", "#e11d48", "#2563eb", "#22c55e", "#a855f7", "#f97316"];
  return {
    left: Math.round(Math.random() * 100),
    color: colors[i % colors.length],
    size: 6 + Math.round(Math.random() * 6),
    delay: Math.round(Math.random() * 2500) / 1000,
    dur: 2.6 + Math.round(Math.random() * 1800) / 1000,
    star: i % 4 === 0,
  };
});

export default async function LotteryWinnersPage() {
  const res = await getPublicWinners();
  const data = res.success ? res.data : null;
  const winners = data?.winners ?? [];
  const contactPhone = data?.shopMobile || "09649355555";

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col items-center px-3 py-3 text-[#16213a]">
      <style>{WINNERS_FX_CSS}</style>
      <div className="w-full max-w-md flex flex-col gap-3">
        {/* Celebratory header with confetti + stars rain */}
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-6 text-center shadow-[0_6px_18px_rgba(10,47,112,0.3)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="win-confetti"
                style={{
                  left: `${c.left}%`,
                  background: c.star ? "transparent" : c.color,
                  width: c.star ? "auto" : `${c.size}px`,
                  height: c.star ? "auto" : `${c.size * 1.6}px`,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.dur}s`,
                  color: c.color,
                  fontSize: c.star ? `${c.size + 6}px` : undefined,
                }}
              >
                {c.star ? "★" : ""}
              </span>
            ))}
          </div>
          <div className="relative">
            <span className="win-pop mx-auto size-16 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mb-2">
              <Trophy size={34} />
            </span>
            <h1 className="win-glow text-[30px] font-black leading-tight">অভিনন্দন! 🎉</h1>
            <p className="text-[13px] text-white/90 mt-1 font-semibold">
              {data?.campaignName?.trim() || "SE Electronics লটারি"} — বিজয়ীদের তালিকা
            </p>
          </div>
        </div>

        {/* Winner list */}
        {winners.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {winners.map((w) => {
              const tone = rankTone(w.rank);
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-[#dfe6f2] p-3 shadow-sm"
                >
                  {/* Winner photo (circular frame) */}
                  <div className={`shrink-0 rounded-full ring-2 ${tone.ring} ring-offset-2 ring-offset-white`}>
                    {w.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.photoUrl}
                        alt={w.name}
                        className="size-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="size-16 rounded-full bg-[#e6eefb] text-[#0b3d91] flex items-center justify-center">
                        <User size={28} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold text-white px-2.5 py-1 rounded-full bg-gradient-to-r ${tone.badge}`}
                    >
                      <Trophy size={12} /> {rankLabel(w.rank)}
                    </span>
                    <p className="text-[16px] font-extrabold text-[#16213a] leading-snug mt-1.5 break-words">
                      {w.name}
                    </p>
                    {w.address && (
                      <p className="text-[12.5px] font-semibold text-[#5b6784] leading-snug inline-flex items-start gap-1 mt-0.5 break-words">
                        <MapPin size={13} className="shrink-0 mt-0.5 text-[#0b3d91]" />
                        {w.address}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#dfe6f2] p-6 text-center shadow-sm">
            <span className="mx-auto size-14 rounded-full bg-[#eef3fb] text-[#0b3d91] flex items-center justify-center mb-3">
              <Trophy size={26} />
            </span>
            <p className="text-[15px] font-extrabold text-[#0b3d91]">এখনো কোনো বিজয়ী ঘোষণা করা হয়নি</p>
            <p className="text-[12.5px] font-semibold text-[#5b6784] mt-1">
              ড্র শেষে বিজয়ীদের তালিকা এখানে দেখানো হবে।
            </p>
          </div>
        )}

        {/* Brand + contact footer */}
        <div className="rounded-xl bg-white border border-[#dfe6f2] p-4 text-center shadow-sm">
          <p className="text-[15px] font-black text-[#0b3d91]">SE Electronics</p>
          <p className="text-[11.5px] font-semibold text-[#5b6784] mt-0.5">Always With You</p>
          <a
            href={`tel:${contactPhone}`}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-[#0b3d91]"
          >
            <Phone size={15} /> যোগাযোগ: {contactPhone}
          </a>
        </div>
      </div>
    </div>
  );
}

const WINNERS_FX_CSS = `
@keyframes winGlow {
  0%, 100% { text-shadow: 0 0 0 rgba(255,255,255,0); }
  50% { text-shadow: 0 0 14px rgba(255,255,255,.75); }
}
.win-glow { animation: winGlow 1.4s ease-in-out infinite; }
@keyframes winPop {
  0% { transform: scale(.4); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); }
}
.win-pop { animation: winPop .5s cubic-bezier(.2,1.3,.4,1) both; }
@keyframes winConfettiFall {
  0% { transform: translateY(-120%) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(260px) rotate(720deg); opacity: 1; }
}
.win-confetti {
  position: absolute;
  top: -20px;
  display: inline-block;
  line-height: 1;
  border-radius: 2px;
  animation-name: winConfettiFall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@media (prefers-reduced-motion: reduce) {
  .win-glow, .win-pop, .win-confetti { animation: none; }
  .win-confetti { display: none; }
}
`;
