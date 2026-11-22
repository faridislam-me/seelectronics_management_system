"use client";

import { useEffect, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getCustomerUnreadNotificationCount } from "@/actions/customerActions";
import { formatDate } from "@/utils";
import clsx from "clsx";

export default function CustomerNotificationBell({
  variant = "header",
}: {
  variant?: "header" | "card";
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const res = await getCustomerUnreadNotificationCount();
    if (res.success) {
      setUnreadCount(res.count);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/customer/notifications"
      className={clsx(
        "relative flex items-center justify-center transition-all duration-300",
        variant === "header"
          ? "size-10 rounded-md text-white"
          : "size-10 rounded-md bg-white text-[#0A1A3A] hover:bg-gray-100",
      )}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span
          className={clsx(
            "absolute -top-1 -right-1 bg-[#FF5252] text-white text-[10px] font-black rounded-full flex items-center justify-center border shadow-sm size-5",
            variant === "header" ? "border-[#0A1A3A]" : "border-white",
          )}
        >
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
