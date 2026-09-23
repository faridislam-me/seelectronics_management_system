import clsx from "clsx";
import { ChevronRight, LucideIcon, Pencil, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export const blueBg = "bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)]";

const chipColors = { navy: "bg-[#0a2f70]", green: "bg-[#1a9c4b]", blue: "bg-[#1f7cf0]", red: "bg-[#e0243f]", amber: "bg-[#e0a11b]" };
export type ChipColor = keyof typeof chipColors;

export function BlueHero({ avatar, initials, name, idLabel, id, chips, tagline = <>Together for a<br />Better Tomorrow</> }: {
  avatar?: string | null; initials?: string; name: string; idLabel: string; id: string;
  chips: { label: string; color: ChipColor; icon?: LucideIcon; dot?: boolean }[]; tagline?: React.ReactNode;
}) {
  return (
    <section className={clsx(blueBg, "text-white px-4 pt-3 pb-9 rounded-b-[44px] rounded-bl-[28px] relative overflow-hidden")}>
      <span className="absolute -right-10 -top-16 size-64 rounded-full bg-white/10" />
      <span className="absolute right-3 top-3 font-script text-lg leading-tight text-right text-white/95 rotate-[-6deg]">{tagline}</span>
      <div className="flex items-center gap-4 relative pr-16 mt-5">
        <div className="relative shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-[100px] rounded-full object-cover border-[4px] border-white shadow-[0_0_0_3px_#1f7cf0]" />
          ) : (
            <span className="size-[100px] rounded-full bg-[#1f7cf0] border-[4px] border-white shadow-[0_0_0_3px_#1f7cf0] flex items-center justify-center text-3xl font-extrabold">{initials}</span>
          )}
          <span className="absolute bottom-0 right-0 size-8 rounded-full bg-[#1f7cf0] border-[3px] border-white text-white flex items-center justify-center"><ShieldCheck size={16} strokeWidth={3} /></span>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[22px] font-extrabold leading-tight truncate">{name}</span>
          <span className="text-sm text-white/90">{idLabel}: <span className="font-bold text-white">{id}</span></span>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {chips.map((c) => (
              <span key={c.label} className={clsx("inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-[11px] font-extrabold tracking-wide", chipColors[c.color])}>
                {c.dot ? <span className="size-1.5 rounded-full bg-white" /> : c.icon ? <c.icon size={12} strokeWidth={2.8} /> : null}{c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlueBalanceCard({ label, value, icon: Icon, button, buttonHref, chevronHref, buttonIcon: ButtonIcon }: {
  label: string; value: string; icon: LucideIcon; button: string; buttonHref: string; chevronHref: string; buttonIcon?: LucideIcon;
}) {
  return (
    <div className="rounded-[22px] bg-[#0a2f70] bg-[linear-gradient(110deg,#0a2f70_0%,#0d3f96_60%,#0a2f70_100%)] text-white p-4 flex items-center gap-4 shadow-[0_10px_30px_rgba(10,47,112,0.35)] relative overflow-hidden">
      <span className="absolute -right-6 -bottom-10 size-40 rounded-full border-[14px] border-white/5" />
      <span className="size-16 rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0"><Icon size={30} strokeWidth={2} /></span>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-[13px] font-semibold tracking-[1px] text-white/90">{label}</span>
        <span className="text-[28px] font-extrabold leading-none truncate">{value}</span>
        <Link href={buttonHref} className="mt-2 self-end inline-flex items-center gap-2 px-4 h-10 rounded-full border-2 border-[#4c9bff] bg-[#0d3f96] text-sm font-bold">
          {ButtonIcon && <ButtonIcon size={16} strokeWidth={2.2} />}{button}
        </Link>
      </div>
      <Link href={chevronHref} aria-label="More" className="absolute right-4 top-5 text-white/90"><ChevronRight size={20} strokeWidth={2.5} /></Link>
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

export function BlueStatGrid({ cards }: { cards: { value: string | number; label: string; icon: LucideIcon; tone: StatTone; href: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map((c) => {
        const t = tones[c.tone];
        return (
          <Link key={c.label} href={c.href} className={clsx("rounded-2xl border p-3 flex flex-col gap-2 relative min-h-[112px]", t.bg, t.border)}>
            <span className="absolute right-2.5 top-3 text-[#9aa4b8]"><ChevronRight size={16} strokeWidth={2.5} /></span>
            <span className={clsx("size-10 rounded-full text-white flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.12)]", t.iconBg)}><c.icon size={18} strokeWidth={2.4} /></span>
            <span className="text-[24px] font-extrabold text-[#16213a] leading-none truncate">{c.value}</span>
            <span className={clsx("text-[13px] font-bold leading-tight", t.text)}>{c.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function BlueContactCard({ title = "Contact Details", editHref, rows }: { title?: string; editHref: string; rows: { label: string; value: React.ReactNode; icon: LucideIcon; href?: string }[] }) {
  return (
    <div className="bg-white rounded-[22px] p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <span className="size-10 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><User size={20} strokeWidth={2.2} /></span>
          <span className="text-[20px] font-extrabold text-[#16213a]">{title}</span>
        </span>
        <Link href={editHref} className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border-2 border-[#bcd4fb] text-[#1f7cf0] text-sm font-bold"><Pencil size={16} strokeWidth={2.2} />Edit</Link>
      </div>
      {rows.map((row) => (
        <Link key={row.label} href={row.href ?? editHref} className="flex items-center gap-3.5 py-2.5 border-t border-[#eef1f6] first:border-0">
          <span className="size-[52px] rounded-2xl bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><row.icon size={24} strokeWidth={2} /></span>
          <span className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-[#6b7690]">{row.label}</span>
            <span className="text-[17px] font-extrabold text-[#16213a] truncate">{row.value}</span>
          </span>
          <span className="text-[#9aa4b8]"><ChevronRight size={18} strokeWidth={2.5} /></span>
        </Link>
      ))}
    </div>
  );
}

export function BlueFooterBand({ quote = <>“সততা ও দক্ষতাই<br />আমাদের শক্তি”</> }: { quote?: React.ReactNode }) {
  return (
    <div className="relative mt-2 h-[120px] overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[62%] bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_90%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] rounded-tl-[90px] flex items-center justify-center pl-8">
        <span className="pl-4 border-l border-white/40 flex items-center gap-2">
          <span className="size-10 rounded-xl bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center">SE</span>
          <span className="flex flex-col leading-tight"><span className="text-sm font-extrabold text-white">SE Electronics</span><span className="text-[9px] text-white/85">Smart Solution &nbsp;Better Life</span></span>
        </span>
      </div>
      <div className="absolute inset-y-0 left-0 w-[40%] flex items-center justify-center px-3">
        <span className="text-[17px] font-bold text-[#0a2f70] text-center leading-snug">{quote}</span>
      </div>
    </div>
  );
}

export function BlueChip({ children, tone }: { children: React.ReactNode; tone: StatTone }) {
  const t = tones[tone];
  return <span className={clsx("text-[10px] font-extrabold tracking-[0.5px] px-2 py-1 rounded-lg whitespace-nowrap", t.bg, t.text)}>{children}</span>;
}

export function BlueCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("bg-white rounded-[22px] p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)]", className)}>{children}</div>;
}
