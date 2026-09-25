"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffNotificationBell } from "../features/notices";
import { StaffBalanceBar } from "../features/staff/StaffBalanceBar";

interface StaffHeaderProps {
  balance: number;
}

const routeConfig: Record<string, { title: string; showBalance?: boolean }> = {
  "/staff/profile": { title: "Dashboard", showBalance: true },
  "/staff/details": { title: "Profile", showBalance: true },
  "/staff/profile/edit": { title: "Edit Profile" },
  "/staff/services": { title: "Services" },
  "/staff/payment": { title: "Payment" },
  "/staff/payment/payment-history": { title: "Payment History" },
  "/staff/payment/request": { title: "Payment Request" },
  "/staff/payment/settings": { title: "Payment Settings" },
  "/staff/payments": { title: "Staff Payments" },
  "/staff/tracking": { title: "History" },
  "/staff/feedbacks": { title: "Feedbacks" },
  "/staff/complaints": { title: "Complaints" },
  "/staff/notifications": { title: "Notifications" },
  "/staff/notices": { title: "Notices" },
  "/staff/tasks": { title: "Tasks" },
  "/staff/customers": { title: "Customer List" },
  "/staff/id-card": { title: "ID Card" },
  "/staff/certificate": { title: "Experience Certificate" },
  "/staff/loan": { title: "Loan Application" },
  "/staff/resume": { title: "Staff Resume" },
  "/staff/jorori-seba": { title: "Emergency Services" },
  "/staff/support": { title: "Staff Support" },
  "/staff/settings": { title: "Settings" },
};

function getHeaderConfig(pathname: string): {
  title: string;
  showBalance: boolean;
} {
  if (routeConfig[pathname]) {
    return {
      title: routeConfig[pathname].title,
      showBalance: routeConfig[pathname].showBalance ?? false,
    };
  }

  // Dynamic route matches
  if (pathname.startsWith("/staff/payment/")) {
    return { title: "Payment Details", showBalance: false };
  }
  if (pathname.startsWith("/staff/customers/")) {
    return { title: "Customer Details", showBalance: false };
  }
  if (pathname.startsWith("/staff/complaints/")) {
    return { title: "Complaint Details", showBalance: false };
  }
  if (pathname.startsWith("/staff/profile/")) {
    return { title: "Profile", showBalance: false };
  }

  // Fallback: format route slug
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment) {
    const formatted = lastSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { title: formatted, showBalance: false };
  }

  return { title: "Dashboard", showBalance: false };
}

export function StaffHeader({ balance }: StaffHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/staff/profile";

  return (
    <header className="sticky top-0 z-50 text-white shadow-lg overflow-hidden w-full bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)]">
      <div className="max-w-4xl mx-auto px-3 h-[60px] flex items-center justify-between gap-2">
        {/* Brand block (same on every staff page) */}
        <Link href="/staff/profile" className="flex items-center gap-2 min-w-0 flex-1">
          <span className="size-10 rounded-md bg-[#1f7cf0] text-white text-[17px] font-extrabold flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,120,0.35)] shrink-0">SE</span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-extrabold text-white leading-tight truncate">SE Electronics</span>
            <span className="text-[10.5px] text-white/85 font-medium truncate">Smart Solution &nbsp;Better Life</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {isHome && <StaffBalanceBar amount={balance} compact />}
          <StaffNotificationBell />
          <Link href="/staff/settings" aria-label="Menu" className="size-8 flex items-center justify-center text-white"><MoreVertical size={20} strokeWidth={2.2} /></Link>
        </div>
      </div>
    </header>
  );
}
