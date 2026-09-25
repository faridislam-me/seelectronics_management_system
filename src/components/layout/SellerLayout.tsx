"use client";

import { sellerLogout } from "@/actions";
import clsx from "clsx";
import { BlueBottomNav } from "@/components/ui/BlueDashboard";
import { Bell, Home, Package, Settings, Users } from "lucide-react";
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
      <span className={clsx("rounded-lg bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,120,0.35)]", size === "sm" ? "size-10 text-base" : "size-11 text-lg")}>SE</span>
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
              <Link href="/seller/profile" className="size-10 rounded-lg bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center shrink-0">SE</Link>
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

      <BlueBottomNav items={navItems} pathname={pathname} homeHref="/seller/profile" />
    </div>
  );
}
