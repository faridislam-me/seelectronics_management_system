import clsx from "clsx";
import { ArrowLeft, LucideIcon } from "lucide-react";
import Link from "next/link";

/** SE wordmark used in the customer app headers. */
export function SEWordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex flex-col items-center leading-none shrink-0">
      <span className={clsx("font-extrabold italic text-white tracking-[-1px] leading-none", size === "sm" ? "text-[24px]" : "text-[30px]")}>SE</span>
      <span className={clsx("text-white/90 font-extrabold tracking-[2px]", size === "sm" ? "text-[7px]" : "text-[8px]")}>ELECTRONICS</span>
    </span>
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
        <SEWordmark size="sm" />
        <span className="h-9 w-px bg-white/40" />
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
    <div className="relative mt-3 pt-5 pb-2 text-center bg-[#0b3d91] bg-[radial-gradient(120%_120%_at_50%_100%,#1b5fd0_0%,#0b3d91_60%,#072a66_100%)] text-white rounded-t-[30px]">
      <div className="flex items-center justify-center gap-3 px-6">
        <span className="h-px flex-1 max-w-16 bg-white/40" />
        <span className="font-script text-[clamp(15px,4.4vw,19px)] leading-none">{tagline}</span>
        <span className="h-px flex-1 max-w-16 bg-white/40" />
      </div>
      <p className="mt-1 text-[12px] font-bold tracking-wide text-white/90">www.seelectronicsbd.com</p>
    </div>
  );
}

/** Dark blue bottom navigation used by the customer app screens. */
export function CustomerAppNav({ items, active }: { items: { label: string; icon: LucideIcon; href: string }[]; active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b3d91] bg-[linear-gradient(180deg,#0d47a8_0%,#072a66_100%)] text-white grid px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom,0px))]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
            <span className={clsx("size-9 rounded-md flex items-center justify-center", isActive ? "bg-white/15" : "")}><item.icon size={21} strokeWidth={2.2} /></span>
            <span className="text-[11px] font-bold">{item.label}</span>
            <span className={clsx("h-0.5 w-8 rounded-full", isActive ? "bg-[#7fb4ff]" : "bg-transparent")} />
          </Link>
        );
      })}
    </nav>
  );
}
