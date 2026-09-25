"use client";

import { getCustomerNotices } from "@/actions";
import { NoticeRecipientType } from "@/types";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NoticeBanner } from "../features/notices";
import { CustomerBottomNav } from "./CustomerBottomNav";
import { CustomerHeader } from "./CustomerHeader";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NoticeRecipientType[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getCustomerNotices();
      if (res.success) setNotifications(res.data as any);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <CustomerHeader />

      <NoticeBanner notifications={notifications} />

      <main className="flex-1 w-full max-w-4xl mx-auto pb-24 lg:pb-8 overflow-x-hidden">
        <div
          key={pathname}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full"
        >
          {children}
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
