"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, Wallet, User, ListTodo, Settings } from "lucide-react";
import clsx from "clsx";

export function StaffBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/staff/profile",
    },
    {
      label: "Tasks",
      icon: ListTodo,
      href: "/staff/tasks",
    },
    {
      label: "Services",
      icon: Wrench,
      href: "/staff/services",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/staff/settings",
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white px-1 pt-0.5 pb-[calc(2px+env(safe-area-inset-bottom,0px))] flex items-center justify-around z-50 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] rounded-t-md">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-0 px-1 py-0.5 min-w-14 transition-all duration-300 relative",
              isActive ? "text-brand" : "text-gray-400 hover:text-brand",
            )}
          >
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand rounded-full" />
            )}
            <div
              className={clsx(
                "px-2 py-0.5 rounded-md transition-all duration-300",
                isActive ? "bg-brand/10" : "",
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span
              className={clsx(
                "text-[9px] uppercase tracking-wider font-black leading-tight",
                isActive ? "opacity-100" : "opacity-60",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
