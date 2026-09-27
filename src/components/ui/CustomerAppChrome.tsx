import clsx from "clsx";
import { ArrowLeft, LucideIcon } from "lucide-react";
import Link from "next/link";

/** Brand text used in customer app headers (plain text, no standalone "SE" mark). */
export function SEWordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className={clsx("shrink-0 font-extrabold text-white leading-tight tracking-wide", size === "sm" ? "text-[13px]" : "text-[15px]")}>SE Electronics</span>
  );
}

/** Blue app header with a curved bottom edge. */
export function CustomerAppHeader({ title, subtitle, backHref, right }: { title: React.ReactNode; subtitle?: React.ReactNode; backHref?: string; right?: React.ReactNode }) {
  return (
    <header className="relative bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 pt-3 pb-7 rounded-b-[26px] overflow-hidden">
      <span className="absolute -right-10 -top-14 size-56 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        {backHref && (
          <Link href={backHref} aria-label="Back" className="size-10 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><ArrowLeft size={20} strokeWidth={2.4} /></Link>
        )}
        <span className="flex flex-col min-w-0 flex-1 leading-tight">
          <span className="text-[clamp(16px,4.6vw,20px)] font-extrabold truncate">{title}</span>
          {subtitle && <span className="text-[clamp(11px,3.2vw,13px)] font-semibold text-white/85 truncate">{subtitle}</span>}
        </span>
        {right}
      </div>
    </header>
  );
}

/** Wave footer with a tagline and the website. */
export function CustomerAppFooter({ tagline }: { tagline: string }) {
  return (
    <div className="relative mt-2 pt-2 pb-1 text-center text-[#0b3d91]">
      <div className="flex items-center justify-center gap-3 px-6">
        <span className="h-px flex-1 max-w-16 bg-[#0b3d91]/30" />
        <span className="font-script text-[clamp(15px,4.4vw,19px)] leading-none">{tagline}</span>
        <span className="h-px flex-1 max-w-16 bg-[#0b3d91]/30" />
      </div>
      <p className="mt-1 text-[12px] font-bold tracking-wide text-[#5b6784]">www.seelectronicsbd.com</p>
    </div>
  );
}

/** Dark blue bottom navigation used by the customer app screens. */
export function CustomerAppNav({ items, active }: { items: { label: string; icon: LucideIcon; href: string }[]; active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b3d91] bg-[linear-gradient(180deg,#0d47a8_0%,#072a66_100%)] text-white grid px-1 pt-2 pb-[calc(6px+env(safe-area-inset-bottom,0px))] rounded-t-[20px] shadow-[0_-6px_20px_rgba(7,42,102,0.25)]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link key={item.label} href={item.href} className={clsx("relative min-w-0 flex flex-col items-center gap-0 py-0.5 px-0.5", isActive ? "text-white" : "text-white/75")}>
            <span className={clsx("h-7 w-10 rounded-md flex items-center justify-center", isActive ? "bg-white/15" : "")}><item.icon size={19} strokeWidth={2.2} /></span>
            <span className="max-w-full text-center text-[clamp(9.5px,2.8vw,11px)] font-bold leading-tight truncate">{item.label}</span>
            {isActive && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-[#7fb4ff]" />}
          </Link>
        );
      })}
    </nav>
  );
}
