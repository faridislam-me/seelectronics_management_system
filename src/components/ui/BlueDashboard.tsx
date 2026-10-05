import clsx from "clsx";
import { BadgeCheck, ChevronRight, LucideIcon, Pencil, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

/** Flat left-to-right gradient shared by the staff header (seamless mode) and the profile hero, so they read as one block. */
export const profileBlueBg = "bg-[#0b3d91] bg-[linear-gradient(100deg,#0f48aa_0%,#0b3d91_50%,#0a3480_100%)]";
export const blueBg = "bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)]";
/** Shared corner radii (kept small on purpose, per client feedback). */
export const R = { card: "rounded-md", hero: "rounded-b-[16px]", btn: "rounded-md", chip: "rounded", tile: "rounded-md" };

const chipColors = { glass: "bg-white/20 border border-white/25", navy: "bg-[#0a2f70]", green: "bg-[#1a9c4b]", blue: "bg-[#1f7cf0]", red: "bg-[#e0243f]", amber: "bg-[#e0a11b]" };
export type ChipColor = keyof typeof chipColors;

export function BlueHero({ avatar, initials, name, idLabel, id, chips, tagline = <>Together for a<br />Better Tomorrow</>, verified = false, variant = "default", compact = false }: {
  avatar?: string | null; initials?: string; name: string; idLabel: string; id: string;
  chips: { label: string; color: ChipColor; icon?: LucideIcon; dot?: boolean }[]; tagline?: React.ReactNode; verified?: boolean;
  /** "profile" = large photo with verified badge, pill chips and script tagline with swoosh (staff profile mockup). */
  variant?: "default" | "profile";
  /** profile variant only: medium photo and a short band (seller home). */
  compact?: boolean;
}) {
  const fallback = (initials || name).trim().slice(0, 2).toUpperCase();
  if (variant === "profile") {
    return (
      <section className={clsx(profileBlueBg, "text-white px-3 relative overflow-hidden", compact ? "pt-0 pb-7" : "pt-1 pb-12")}>
        <span className="absolute -right-16 -top-24 size-80 rounded-full bg-white/[0.07]" />
        <span className="absolute left-[30%] -top-10 size-56 rounded-full bg-[#1f7cf0]/15 blur-2xl" />
        {/* soft light wave: rises from the lower-left and sweeps up to the right */}
        <svg className={clsx("absolute inset-x-0 bottom-0 w-full", compact ? "h-[22px]" : "h-[46px]")} viewBox="0 0 400 46" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 10 C 70 34, 170 46, 270 40 C 330 36, 372 24, 400 6 L400 46 L0 46 Z" fill="#eef3fb" />
          <path d="M0 10 C 70 34, 170 46, 270 40 C 330 36, 372 24, 400 6" fill="none" stroke="#7fb4ff" strokeOpacity="0.55" strokeWidth="1.5" />
        </svg>
        {/* tagline floats top-right so it takes no vertical space */}
        <div className={clsx("absolute right-3 z-10", compact ? "top-0 scale-90 origin-top-right" : "top-1")}>
          <span className="relative block font-script text-[clamp(13px,3.6vw,17px)] leading-[1.05] text-right text-white/95 rotate-[-7deg] pr-1 pb-2">
            {tagline}
            <svg className="absolute right-0 -bottom-1 w-[88%] h-3 text-[#4c9bff]" viewBox="0 0 120 12" fill="none" aria-hidden="true"><path d="M2 10C40 3 80 1 118 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </span>
        </div>
        <div className={clsx("relative flex items-center gap-3", compact ? "pt-3" : "pt-7")}>
          <div className="relative shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className={clsx(compact ? "size-[clamp(58px,17vw,68px)] border-[3px] shadow-[0_0_0_3px_#3d8bff,0_6px_14px_rgba(0,20,70,0.3)]" : "size-[clamp(92px,28vw,116px)] border-[4px] shadow-[0_0_0_4px_#3d8bff,0_8px_22px_rgba(0,20,70,0.35)]", "rounded-full object-cover object-top border-white bg-[#1f7cf0]")} />
            ) : (
              <span className={clsx(compact ? "size-[clamp(58px,17vw,68px)] border-[3px] text-xl" : "size-[clamp(92px,28vw,116px)] border-[4px] shadow-[0_0_0_4px_#3d8bff,0_8px_22px_rgba(0,20,70,0.35)] text-3xl", "rounded-full bg-[#1f7cf0] border-white flex items-center justify-center font-extrabold")}>{fallback}</span>
            )}
            {verified && <span className="absolute bottom-1 -right-0.5 size-[30px] rounded-full bg-[#1f7cf0] border-[3px] border-white text-white flex items-center justify-center shadow"><BadgeCheck size={16} strokeWidth={2.6} /></span>}
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className={clsx("font-extrabold leading-tight break-words", compact ? "text-[clamp(16px,5vw,20px)]" : "text-[clamp(19px,6vw,27px)]")}>{name}</span>
            <span className="text-[clamp(12.5px,3.6vw,15px)] text-white/90">{idLabel}: <span className="font-bold text-white">{id}</span></span>
            <div className="flex flex-nowrap gap-1 mt-1 min-w-0">
              {chips.map((c) => (
                <span key={c.label} className={clsx("inline-flex items-center gap-0.5 px-1.5 h-[22px] rounded-full text-[clamp(8.5px,2.35vw,10.5px)] font-extrabold tracking-normal whitespace-nowrap shrink-0", chipColors[c.color])}>
                  {c.dot ? <span className="size-1.5 rounded-full bg-white" /> : c.icon ? <c.icon size={11} strokeWidth={2.8} /> : null}{c.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={clsx(blueBg, R.hero, "text-white px-4 pt-3 pb-8 relative overflow-hidden")}>
      <span className="absolute -right-10 -top-16 size-64 rounded-full bg-white/10" />
      {/* Tagline sits on its own row so it never collides with the name */}
      <div className="relative flex justify-end min-h-[34px]">
        <span className="font-script text-[clamp(15px,4vw,19px)] leading-[1.05] text-right text-white/90 rotate-[-6deg] pr-1">{tagline}</span>
      </div>
      <div className="flex items-center gap-3.5 relative -mt-1">
        <div className="relative shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-[clamp(72px,20vw,92px)] rounded-full object-cover object-top border-[3px] border-white shadow-[0_0_0_3px_#1f7cf0] bg-[#1f7cf0]" />
          ) : (
            <span className="size-[clamp(72px,20vw,92px)] rounded-full bg-[#1f7cf0] border-[3px] border-white shadow-[0_0_0_3px_#1f7cf0] flex items-center justify-center text-2xl font-extrabold">{fallback}</span>
          )}
          <span className="absolute bottom-0 right-0 size-7 rounded-full bg-[#1f7cf0] border-[3px] border-white text-white flex items-center justify-center"><ShieldCheck size={14} strokeWidth={3} /></span>
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-[clamp(16px,4.8vw,22px)] font-extrabold leading-tight inline-flex items-center gap-1.5 flex-wrap">{name}{verified && <BadgeCheck size={22} className="shrink-0" fill="#1f7cf0" stroke="#ffffff" strokeWidth={2.2} />}</span>
          <span className="text-[clamp(12px,3.4vw,14px)] text-white/90">{idLabel}: <span className="font-bold text-white">{id}</span></span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {chips.map((c) => (
              <span key={c.label} className={clsx("inline-flex items-center gap-1 px-1.5 h-[22px] text-[9.5px] font-extrabold tracking-wide whitespace-nowrap", R.chip, chipColors[c.color])}>
                {c.dot ? <span className="size-1.5 rounded-full bg-white" /> : c.icon ? <c.icon size={10} strokeWidth={2.8} /> : null}{c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlueBalanceCard({ label, value, icon: Icon, button, buttonHref, chevronHref, buttonIcon: ButtonIcon, compact = false, layout = "default" }: {
  label: string; value: string; icon: LucideIcon; button: string; buttonHref: string; chevronHref: string; buttonIcon?: LucideIcon; compact?: boolean;
  /** "row" = big amount with the button on the right of the same row (staff profile mockup). */
  layout?: "default" | "row";
}) {
  if (layout === "row") {
    return (
      <div className={clsx(compact ? "rounded-md p-2 pr-2 gap-2.5 shadow-[0_6px_18px_rgba(10,47,112,0.3)]" : "rounded-[14px] p-3 pr-2.5 gap-3 shadow-[0_10px_30px_rgba(10,47,112,0.35)]", "bg-[#0a2f70] bg-[linear-gradient(110deg,#0a2a66_0%,#0d3a8c_55%,#0a2f70_100%)] text-white flex items-center relative overflow-hidden")}>
        {/* subtle diagonal light streak */}
        <span className="pointer-events-none absolute -top-6 left-[42%] h-[180%] w-16 rotate-[28deg] bg-gradient-to-b from-white/0 via-white/[0.07] to-white/0" />
        <span className="pointer-events-none absolute -top-6 left-[52%] h-[180%] w-4 rotate-[28deg] bg-white/[0.05]" />
        <span className={clsx("relative rounded-full bg-[#1c4fa8] flex items-center justify-center shrink-0", compact ? "size-10 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.08)]" : "size-[clamp(56px,16vw,70px)] shadow-[inset_0_0_0_6px_rgba(255,255,255,0.08)]")}><Icon size={compact ? 20 : 30} strokeWidth={2} /></span>
        <div className={clsx("relative flex flex-col min-w-0 flex-1", compact ? "gap-0.5 pr-3" : "gap-1.5 pr-4")}>
          <span className={clsx("font-semibold tracking-[1.2px] text-white/90", compact ? "text-[10px]" : "text-[clamp(11px,3.1vw,13px)]")}>{label}</span>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className={clsx("font-extrabold leading-none truncate", compact ? "text-[clamp(17px,5.2vw,22px)]" : "text-[clamp(23px,7.4vw,32px)]")}>{value}</span>
            <Link href={buttonHref} className={clsx("inline-flex items-center gap-1 px-2.5 border-[1.5px] border-[#4c9bff] bg-[#0d3f96]/50 font-bold shrink-0 whitespace-nowrap", compact ? "h-7 rounded-md text-[11px]" : "h-8 rounded-full text-[clamp(10.5px,3vw,12px)]")}>
              {ButtonIcon && <ButtonIcon size={13} strokeWidth={2.2} />}{button}
            </Link>
          </div>
        </div>
        <Link href={chevronHref} aria-label="More" className={clsx("absolute right-2 text-white/90", compact ? "top-1.5" : "top-2.5")}><ChevronRight size={compact ? 15 : 18} strokeWidth={2.5} /></Link>
      </div>
    );
  }
  return (
    <div className={clsx(compact ? "rounded-md p-2.5 gap-2.5" : clsx(R.card, "p-3.5 sm:p-4 gap-3 sm:gap-4"), "bg-[#0a2f70] bg-[linear-gradient(110deg,#0a2f70_0%,#0d3f96_60%,#0a2f70_100%)] text-white flex items-center shadow-[0_10px_30px_rgba(10,47,112,0.35)] relative overflow-hidden")}>
      <span className="absolute -right-6 -bottom-10 size-40 rounded-full border-[14px] border-white/5" />
      <span className={clsx("rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0", compact ? "size-10" : "size-[clamp(48px,14vw,64px)]")}><Icon size={compact ? 20 : 26} strokeWidth={2} /></span>
      <div className={clsx("flex flex-1 min-w-0", compact ? "flex-row items-center gap-3" : "flex-col gap-0.5 pr-6")}>
        <div className="flex flex-col min-w-0 flex-1">
          <span className={clsx("font-semibold tracking-[1px] text-white/90", compact ? "text-[10px]" : "text-[clamp(11px,3vw,13px)]")}>{label}</span>
          <span className={clsx("font-extrabold leading-tight truncate", compact ? "text-[clamp(17px,5vw,22px)]" : "text-[clamp(20px,6.5vw,28px)]")}>{value}</span>
        </div>
        <Link href={buttonHref} className={clsx("inline-flex items-center gap-1.5 border-2 border-[#4c9bff] bg-[#0d3f96] font-bold shrink-0", compact ? "rounded-md px-2.5 h-8 text-[12px]" : clsx(R.btn, "mt-1.5 self-start sm:self-end px-3.5 h-9 text-[13px]"))}>
          {ButtonIcon && <ButtonIcon size={14} strokeWidth={2.2} />}{button}
        </Link>
      </div>
      {!compact && <Link href={chevronHref} aria-label="More" className="absolute right-3 top-4 text-white/90"><ChevronRight size={20} strokeWidth={2.5} /></Link>}
    </div>
  );
}

const tones = {
  green: { bg: "bg-[#e9f9ef]", border: "border-[#bfe8cd]", iconBg: "bg-[#1a9c4b]", text: "text-[#178a42]" },
  blue: { bg: "bg-[#e8f1ff]", border: "border-[#bcd4fb]", iconBg: "bg-[#1f7cf0]", text: "text-[#1b6fd6]" },
  purple: { bg: "bg-[#f3e9ff]", border: "border-[#dcc6fb]", iconBg: "bg-[#8b3fe8]", text: "text-[#7a35d2]" },
  amber: { bg: "bg-[#fff6e3]", border: "border-[#f5dfa0]", iconBg: "bg-[#e0a11b]", text: "text-[#b8620b]" },
  red: { bg: "bg-[#ffe9ec]", border: "border-[#f7c3ca]", iconBg: "bg-[#e0243f]", text: "text-[#c81f38]" },
  teal: { bg: "bg-[#e6f7f8]", border: "border-[#b7e5e8]", iconBg: "bg-[#1aa5b0]", text: "text-[#13929c]" },
};
export type StatTone = keyof typeof tones;

const softTiles = {
  green: "bg-[#d4f3e0] text-[#1a9c4b]",
  blue: "bg-[#d6e7ff] text-[#1f7cf0]",
  purple: "bg-[#e6d6fb] text-[#8b3fe8]",
  amber: "bg-[#ffe9b8] text-[#e0a11b]",
  red: "bg-[#ffd6dc] text-[#e0243f]",
  teal: "bg-[#cdeff1] text-[#1aa5b0]",
};

export function BlueStatGrid({ cards, compact = false, cols = 3, iconStyle = "solid", layout = "default" }: {
  cards: { value: string | number; label: string; icon: LucideIcon; tone: StatTone; href: string }[];
  compact?: boolean; cols?: 2 | 3 | 4; iconStyle?: "solid" | "soft";
  /** "horizontal" = round icon left of the number, label under the number (staff profile mockup). */
  layout?: "default" | "horizontal";
}) {
  if (layout === "horizontal") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => {
          const t = tones[c.tone];
          return (
            <Link key={c.label} href={c.href} className={clsx("rounded-[12px] border p-2 pr-4 relative min-h-[76px] flex flex-col justify-center gap-1", t.bg, t.border)}>
              <span className="absolute right-1.5 top-2 text-[#9aa4b8]"><ChevronRight size={14} strokeWidth={2.5} /></span>
              <span className="flex items-center gap-1.5 min-w-0">
                <span className={clsx("size-[clamp(26px,8vw,34px)] rounded-full text-white flex items-center justify-center shrink-0 ring-4 ring-white/70", t.iconBg)}><c.icon size={16} strokeWidth={2.4} /></span>
                <span className="text-[clamp(16px,5vw,22px)] font-extrabold text-[#16213a] leading-none truncate">{c.value}</span>
              </span>
              <span className={clsx("text-[clamp(10px,3vw,12.5px)] font-bold leading-tight pl-0.5", t.text)}>{c.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }
  if (compact) {
    return (
      <div className={clsx("grid gap-2", cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-4" : "grid-cols-3")}>
        {cards.map((c) => {
          const t = tones[c.tone];
          return (
            <Link key={c.label} href={c.href} className={clsx("rounded-md border p-1.5 flex flex-col items-center justify-center text-center gap-1 min-h-[72px]", t.bg, t.border)}>
              {iconStyle === "soft" ? (
                <span className={clsx("size-7 rounded-md flex items-center justify-center", softTiles[c.tone])}><c.icon size={16} strokeWidth={2.2} /></span>
              ) : (
                <span className={clsx("size-6 rounded-full text-white flex items-center justify-center", t.iconBg)}><c.icon size={12} strokeWidth={2.4} /></span>
              )}
              <span className="text-[clamp(14px,4.2vw,18px)] font-extrabold text-[#16213a] leading-none truncate max-w-full">{c.value}</span>
              <span className={clsx("text-[clamp(9px,2.6vw,11px)] font-bold leading-tight", t.text)}>{c.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
      {cards.map((c) => {
        const t = tones[c.tone];
        return (
          <Link key={c.label} href={c.href} className={clsx(R.tile, "border p-2.5 sm:p-3 flex flex-col items-center text-center gap-1.5 sm:gap-2 relative min-h-[104px]", t.bg, t.border)}>
            <span className="absolute right-2 top-2.5 text-[#9aa4b8]"><ChevronRight size={15} strokeWidth={2.5} /></span>
            {iconStyle === "soft" ? (
              <span className={clsx("size-9 sm:size-10 rounded-md flex items-center justify-center", softTiles[c.tone])}><c.icon size={20} strokeWidth={2.2} /></span>
            ) : (
              <span className={clsx("size-9 sm:size-10 rounded-full text-white flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.12)]", t.iconBg)}><c.icon size={17} strokeWidth={2.4} /></span>
            )}
            <span className="text-[clamp(15px,4.6vw,24px)] font-extrabold text-[#16213a] leading-none truncate max-w-full">{c.value}</span>
            <span className={clsx("text-[clamp(11px,3.2vw,13px)] font-bold leading-tight", t.text)}>{c.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function BlueContactCard({ title = "Contact Details", editHref, rows, compact = false, icon: TitleIcon = User, hideEdit = false }: { title?: string; editHref: string; rows: { label: string; value: React.ReactNode; icon: LucideIcon; href?: string }[]; compact?: boolean; icon?: LucideIcon; hideEdit?: boolean }) {
  return (
    <div className={clsx(compact ? "rounded-md p-3 gap-1" : clsx(R.card, "p-3.5 sm:p-4 gap-2"), "bg-white shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex flex-col")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2.5 min-w-0">
          <span className={clsx("rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0", compact ? "size-7" : "size-9")}><TitleIcon size={compact ? 15 : 18} strokeWidth={2.2} /></span>
          <span className={clsx("font-extrabold text-[#16213a] truncate", compact ? "text-[15px]" : "text-[clamp(16px,4.6vw,20px)]")}>{title}</span>
        </span>
        {!hideEdit && <Link href={editHref} className={clsx("inline-flex items-center gap-1.5 border-2 border-[#bcd4fb] text-[#1f7cf0] font-bold shrink-0", compact ? "rounded-md px-2.5 h-7 text-xs" : clsx(R.btn, "px-3 h-9 text-sm"))}><Pencil size={compact ? 13 : 15} strokeWidth={2.2} />Edit</Link>}
      </div>
      {rows.map((row) => (
        <Link key={row.label} href={row.href ?? editHref} className={clsx("flex items-center gap-3 border-t border-[#eef1f6] first:border-0", compact ? "py-1.5" : "py-2.5")}>
          <span className={clsx("bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0", compact ? "size-8 rounded-md" : clsx(R.tile, "size-11 sm:size-[52px]"))}><row.icon size={compact ? 16 : 22} strokeWidth={2} /></span>
          <span className="flex flex-col flex-1 min-w-0">
            <span className={clsx("font-semibold text-[#6b7690]", compact ? "text-[10.5px] leading-none" : "text-[12px] sm:text-[13px]")}>{row.label}</span>
            <span className={clsx("font-extrabold text-[#16213a] truncate", compact ? "text-[13.5px]" : "text-[clamp(14px,4.2vw,17px)]")}>{row.value}</span>
          </span>
          <span className="text-[#9aa4b8]"><ChevronRight size={18} strokeWidth={2.5} /></span>
        </Link>
      ))}
    </div>
  );
}

export function BlueFooterBand({ quote = <>সততা ও দক্ষতাই<br />আমাদের শক্তি</> }: { quote?: React.ReactNode }) {
  return (
    <div className="relative mt-1 h-[68px] overflow-hidden">
      {/* soft light wash behind the quote */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#f3f7ff_0%,#e6eefc_60%,#dbe7fb_100%)]" />
      {/* blue panel */}
      <div className="absolute inset-y-0 right-0 w-[60%] bg-[#0b3d91] bg-[radial-gradient(120%_120%_at_100%_0%,#2f7ff0_0%,#0b3d91_45%,#072a66_100%)] rounded-tl-[26px] shadow-[-8px_0_24px_rgba(11,61,145,0.18)] flex items-center pl-7 pr-3">
        <span className="absolute -right-6 -top-10 size-28 rounded-full bg-white/10" />
        <span className="absolute right-6 bottom-2 size-10 rounded-full bg-white/5" />
        <span className="relative pl-3 border-l-2 border-white/40 flex items-center gap-2.5">
          <span className="flex flex-col leading-tight"><span className="text-[14px] font-extrabold text-white">SE Electronics</span><span className="text-[9.5px] text-white/85 font-medium">Smart Solution &nbsp;Better Life</span></span>
        </span>
        {/* leaf accent */}
        <svg className="absolute right-1 bottom-0 w-7 h-9 text-[#2ecc71] opacity-90" viewBox="0 0 40 52" fill="none" aria-hidden="true">
          <path d="M20 50C20 30 26 14 38 2c2 14-2 34-18 48Z" fill="currentColor" />
          <path d="M20 50C12 38 6 30 2 20c12 4 18 14 18 30Z" fill="#1a9c4b" />
          <path d="M20 50c1-14 6-26 16-42" stroke="#0f6f33" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      {/* quote */}
      <div className="absolute inset-y-0 left-0 w-[42%] flex items-center justify-center px-3">
        <span className="relative text-center">
          <span className="absolute -left-3 -top-3 text-[26px] leading-none font-serif text-[#1f7cf0]/60">“</span>
          <span className="text-[clamp(13px,4vw,17px)] font-extrabold text-[#0a2f70] leading-snug">{quote}</span>
          <span className="absolute -right-3 -bottom-4 text-[26px] leading-none font-serif text-[#1f7cf0]/60">”</span>
        </span>
      </div>
    </div>
  );
}

export function BlueChip({ children, tone }: { children: React.ReactNode; tone: StatTone }) {
  const t = tones[tone];
  return <span className={clsx("text-[10px] font-extrabold tracking-[0.5px] px-2 py-1 rounded-md whitespace-nowrap", t.bg, t.text)}>{children}</span>;
}

export function BlueCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx(R.card, "bg-white p-3.5 sm:p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)]", className)}>{children}</div>;
}

/** Floating bottom navigation shared by the staff and seller portals. */
export function BlueBottomNav({ items, pathname, homeHref }: { items: { label: string; icon: LucideIcon; href: string }[]; pathname: string; homeHref: string }) {
  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[414px] h-14 bg-white rounded-t-[20px] rounded-b-md shadow-[0_-4px_24px_rgba(11,61,145,0.15)] grid grid-cols-4 items-center px-1 z-50">
      {items.map((item) => {
        const active = item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={clsx("relative flex flex-col items-center justify-center gap-0.5 h-14", active ? "text-[#1f7cf0]" : "text-[#6b7690]")}>
            <item.icon size={20} strokeWidth={2} />
            <span className="text-[clamp(9.5px,2.8vw,11px)] font-bold leading-tight">{item.label}</span>
            {active && <span className="absolute bottom-0.5 w-8 h-0.5 rounded-full bg-[#1f7cf0]" />}
          </Link>
        );
      })}
    </nav>
  );
}
