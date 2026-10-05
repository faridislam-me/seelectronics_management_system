"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Activity,
  Crown,
  FileText,
  Bell,
  Users,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { getCustomerDashboardStatus } from "@/actions";

export function CustomerBottomNav() {
  const pathname = usePathname();
  const [isDashboardDisabled, setIsDashboardDisabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isMisuse, setIsMisuse] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await getCustomerDashboardStatus();
      if (res.success && res.isWarrantyStopped) {
        setIsDashboardDisabled(true);
        setIsMisuse((res as any).warrantyStopReason === "misuse");
      }
    };
    fetchStatus();
  }, []);

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/customer/profile",
    },
    {
      label: "History",
      icon: Activity,
      href: "/customer/services",
    },
    {
      label: "Complaint",
      icon: FileText,
      href: "/customer/complain",
    },
    {
      label: "VIP Card",
      icon: Crown,
      href: "/customer/vip-card",
    },

    {
      label: "Alerts",
      icon: Bell,
      href: "/customer/notifications",
    },
  ];

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white px-1 pt-1.5 pb-[calc(6px+var(--sab))] flex items-center justify-around z-50 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] rounded-t-[20px]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          if (isDashboardDisabled) {
            return (
              <button
                key={item.label}
                onClick={() => setShowPopup(true)}
                className={clsx(
                  "flex flex-col items-center gap-0 py-0.5 px-1 min-w-[52px] transition-all duration-300 relative opacity-50 cursor-not-allowed",
                  "text-gray-400",
                )}
              >
                <div className="px-2.5 py-1 rounded-md transition-all duration-300">
                  <item.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-center opacity-60">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-0 py-0.5 px-1 min-w-[52px] transition-all duration-300 relative",
                isActive ? "text-[#0A1A3A]" : "text-gray-400 hover:text-brand",
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#0A1A3A] rounded-full" />
              )}
              <div
                className={clsx(
                  "px-2.5 py-1 rounded-md transition-all duration-300",
                  isActive ? "bg-brand/10" : "",
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={clsx(
                  "text-[8px] uppercase tracking-wider font-extrabold text-center",
                  isActive ? "opacity-100 font-black" : "opacity-60",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Popup for Dashboard Disabled */}
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600 size-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ওয়ারেন্টি বাতিল
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 font-semibold whitespace-pre-line">
                {isMisuse
                  ? "প্রিয় গ্রাহক আপনার পণ্যের অপব্যবহার/ক্ষতি প্রমাণিত হওয়ায় আপনার পণ্যটির ওয়ারেন্টি বাতিল করা হয়েছে। বিস্তারিত জানতে কাস্টমার কেয়ারে যোগাযোগ করুন।"
                  : "প্রিয় গ্রাহক আপনার পন্যের বকেয়া টাকা পরিশোধ না করায় আপনার পন্যটির ওয়ারেন্টি বাতিল করা হয়েছে । পুনারায় ওয়ারেন্টি বহাল রাখতে সেইলার এর সাথে যোগাযোগ করুন।"}
              </p>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
