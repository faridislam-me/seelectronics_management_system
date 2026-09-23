"use client";

import { sellerLogout } from "@/actions";
import clsx from "clsx";
import { Bell, Home, Package, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const routeTitles: Record<string, string> = {
  "/seller/profile": "Dashboard",
  "/seller/purchases": "Purchases",
  "/seller/customers": "My Customers",
  "/seller/services": "Customer Services",
  "/seller/details": "Shop Profile",
  "/seller/settings": "Settings",
};

const navItems = [
  { label: "Home", icon: Home, href: "/seller/profile" },
  { label: "Stock", icon: Package, href: "/seller/purchases" },
  { label: "Customers", icon: Users, href: "/seller/customers" },
  { label: "Settings", icon: Settings, href: "/seller/settings" },
];

export function SELogo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={clsx("rounded-2xl bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,120,0.35)]", size === "sm" ? "size-10 text-base rounded-xl" : "size-12 text-xl")}>SE</span>
      <span className="flex flex-col leading-tight">
        <span className={clsx("font-extrabold text-white", size === "sm" ? "text-sm" : "text-xl")}>SE Electronics</span>
        <span className={clsx("text-white/85 font-medium", size === "sm" ? "text-[9px]" : "text-[11px]")}>Smart Solution &nbsp;Better Life</span>
      </span>
    </span>
  );
}

export function SellerLayout({ children, badge = 0 }: { children: React.ReactNode; badge?: number }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const isHome = pathname === "/seller/profile";
  const title = routeTitles[pathname] || "Seller Portal";

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {isHome ? <Link href="/seller/profile"><SELogo /></Link> : (
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/seller/profile" className="size-10 rounded-xl bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center shrink-0">SE</Link>
              <h1 className="font-bold text-base sm:text-lg truncate">{title}</h1>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Link href="/seller/services" aria-label="Notifications" className="relative size-11 flex items-center justify-center">
              <Bell size={24} strokeWidth={2} />
              {badge > 0 && <span className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-[#e5484d] text-[11px] font-extrabold flex items-center justify-center">{badge}</span>}
            </Link>
            <form action={() => { setLoggingOut(true); sellerLogout(); }}>
              <button aria-label="Logout" title="Logout" disabled={loggingOut} className="size-11 flex items-center justify-center disabled:opacity-50"><Settings size={24} strokeWidth={2} /></button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto pb-28 overflow-x-hidden">
        <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">{children}</div>
      </main>

      <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[414px] h-[76px] bg-white rounded-[24px] shadow-[0_-4px_24px_rgba(11,61,145,0.15)] grid grid-cols-4 items-center px-2 z-50">
        {navItems.map((item) => {
          const active = item.href === "/seller/profile" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={clsx("relative flex flex-col items-center justify-center gap-1 min-h-11", active ? "text-[#1f7cf0]" : "text-[#6b7690]")}>
              <item.icon size={24} strokeWidth={2} />
              <span className="text-[13px] font-bold">{item.label}</span>
              {active && <span className="absolute -bottom-2 w-14 h-1 rounded-full bg-[#1f7cf0]" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
