"use client";

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CustomerNotificationBell from "../features/customers/CustomerNotificationBell";

export function CustomerHeader() {
  const pathname = usePathname();

  const routeConfig: Record<string, { title: string }> = {
    "/customer/profile": { title: "Dashboard" },
    "/customer/services": { title: "Service History" },
    "/customer/complain": { title: "Complaints" },
    "/customer/vip-card": { title: "VIP Premium Card" },
    "/customer/notifications": { title: "Notifications" },
    "/customer/feedback": { title: "Feedback" },
    "/customer/plans": { title: "Subscriptions" },
    "/customer/referral": { title: "Referrals" },
    "/customer/support": { title: "Customer Support" },
  };

  const isHome = pathname === "/customer/profile";
  const current = routeConfig[pathname] || { title: "" };
  const { title } = current;

  return (
    <header className={`sticky top-0 z-50 text-white overflow-hidden w-full ${isHome ? "bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] rounded-b-[22px]" : "bg-[#0A1A3A]"}`}>
      <div className="max-w-4xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
        {isHome ? (
          <Link href="/customer/profile" className="flex items-center gap-2.5 min-w-0">
            <Image src="/logo.jpg" alt="SE" width={40} height={40} className="size-10 rounded-md object-cover shrink-0 bg-white" />
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-lg font-extrabold text-white truncate">SE Electronics</span>
              <span className="text-[11px] text-white/85 font-medium truncate">Smart Power &nbsp;|&nbsp; Better Tomorrow</span>
            </span>
          </Link>
        ) : (
          <>
            {/* LEFT BRAND LOGO */}
            <Link
              href="/customer/profile"
              className="flex items-center shrink-0 gap-2 hover:bg-white/10 p-1.5 rounded-md transition-colors"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-md flex items-center justify-center border border-white/20 overflow-hidden shrink-0">
                <span className="text-sm sm:text-base font-bold">SE</span>
              </div>
            </Link>

            {/* TITLE */}
            <h1 className="font-bold text-base flex-1 min-w-0">
              {title || "Welcome to SE Electronics"}
            </h1>
          </>
        )}

        {/* NOTIFICATIONS */}
        <div className="flex items-center gap-1 shrink-0">
          <CustomerNotificationBell variant="header" />
          {isHome && (
            <Link href="/customer/invoice" aria-label="My account" className="size-10 rounded-full bg-white/15 flex items-center justify-center"><User size={20} /></Link>
          )}
        </div>
      </div>
    </header>
  );
}
