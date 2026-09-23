"use client";

import { logout } from "@/actions";
import { ProgressBar } from "@/components";
import { appVersion } from "@/constants";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Briefcase,
  Clipboard,
  ClipboardList,
  CreditCard,
  Crown,
  FileText,
  History,
  HomeIcon,
  Image as ImageIcon,
  MessageSquare,
  Star,
  Store,
  UserCog,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useState } from "react";

const links = [
  {
    name: "Dashboard",
    href: "/",
    icon: HomeIcon,
    sectionTitle: "Dashboard",
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    sectionTitle: "Customers",
  },
  {
    name: "Maintenance Reminders",
    href: "/battery-reminders",
    icon: Zap,
    sectionTitle: "Maintenance",
  },
  {
    name: "Team Members",
    href: "/team-members",
    icon: Users,
    sectionTitle: "Team Members",
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
    sectionTitle: "Invoice",
  },
  {
    name: "Service List",
    href: "/services/repairs",
    icon: Wrench,
    sectionTitle: "Repairs",
  },
  {
    name: "Install List",
    href: "/services/installations",
    icon: Zap,
    sectionTitle: "Install",
  },
  {
    name: "Feedbacks",
    href: "/feedbacks",
    icon: Star,
    sectionTitle: "Feedbacks",
  },
  {
    name: "Applications",
    href: "/applications",
    icon: ClipboardList,
    sectionTitle: "Applications",
  },
  {
    name: "Manage Banners",
    href: "/banners",
    icon: ImageIcon,
    sectionTitle: "Banners",
  },
  {
    name: "Technicians",
    href: "/staffs/technicians",
    icon: UserCog,
    sectionTitle: "Technician ",
  },
  {
    name: "Electricians",
    href: "/staffs/electricians",
    icon: UserCog,
    sectionTitle: "Electrician",
  },
  {
    name: "Sellers",
    href: "/sellers",
    icon: Store,
    sectionTitle: "Sellers / Dealers",
  },
  {
    name: "VIP Cards",
    href: "/vips",
    icon: Briefcase,
    sectionTitle: "VIP Card",
  },
  {
    name: "Referral Payments",
    href: "/referral-payments",
    icon: ArrowUpRight,
    sectionTitle: "Referral Payment Requests",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    sectionTitle: "Payments",
  },
  {
    name: "Notices",
    href: "/notices",
    icon: Bell,
    sectionTitle: "System Notices",
  },
  {
    name: "Service History",
    href: "/staffs/service-history",
    icon: Clipboard,
    sectionTitle: "Service History",
  },
  {
    name: "Payment History",
    href: "/staffs/payment-history",
    icon: History,
    sectionTitle: "Payment History",
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
    sectionTitle: "Customer Messages",
  },
  {
    name: "Staff Reports",
    href: "/complaints",
    icon: AlertTriangle,
    sectionTitle: "Staff Complaint Reports",
  },
  {
    name: "Subscribers",
    href: "/subscribers",
    icon: Crown,
    sectionTitle: "Active Subscribers",
  },
];

export const SideNavContext = createContext<{ openSideNav: () => void } | null>(
  null,
);

export default function DashboardLayout({
  children,
  username,
  smsBalance,
}: {
  children: React.ReactNode;
  username: string;
  smsBalance: number | null;
}) {
  const pathname = usePathname();
  const [isLogginOut, setIsLogginOut] = useState(false);
  const [showSideNav, setShowSideNav] = useState(false);

  return (
    <>
      <ProgressBar />
      {showSideNav && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setShowSideNav(false)}
        />
      )}
      <div className="flex">
        <div
          className={clsx(
            "xl:flex flex-col h-[100vh] text-[#444444] min-w-[210px] p-4 border-r-[0.5px] border-r-borderColor bg-white",
            showSideNav
              ? "flex fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl"
              : "hidden",
          )}
        >
          <div className="flex mb-4 __center gap-4 justify-normal">
            <Image src="/logo.jpg" alt="" width={34} height={34} />
            <h1 className="font-semibold text-lg">{username}</h1>
            {showSideNav && (
              <button
                title="Show Sidebar"
                onClick={() => setShowSideNav(false)}
                className="ml-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* SMS Balance display */}
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-3 flex flex-start items-center gap-2 border border-borderColor">
              <span className="text-sm text-gray-500 font-medium block">
                SMS BAL:
              </span>
              <span className="text-lg font-bold text-brand">
                {smsBalance !== null
                  ? `৳ ${smsBalance.toLocaleString()}`
                  : "---"}
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <ul>
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href + link.name}>
                    <Link
                      onClick={() => setShowSideNav(false)}
                      href={link.href}
                      className={clsx(
                        "flex gap-4 px-4 py-2 my-2 rounded-lg hover:bg-gray-100",
                        {
                          "bg-gray-100": pathname === link.href,
                        },
                      )}
                    >
                      <Icon
                        size={20}
                        className={
                          pathname === link.href
                            ? "text-brand"
                            : "text-gray-500"
                        }
                      />
                      <h1 className="font-medium">{link.name}</h1>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-auto text-center">
            <button
              onClick={() => {
                setIsLogginOut(true);
                logout();
              }}
              disabled={isLogginOut}
              className="__btn bg-red-2 text-red shadow-none w-full gap-2.5"
            >
              {!isLogginOut && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              )}
              <span>{isLogginOut ? "Logging out..." : "Logout"}</span>
            </button>
            <span className="text-xs text-gray-500 mt-3 block">
              v{appVersion}
            </span>
          </div>
        </div>
        <section
          className={clsx(
            "flex-1 h-screen overflow-auto flex flex-col relative",
            {
              "pointer-events-none": showSideNav,
            },
          )}
        >
          <SideNavContext value={{ openSideNav: () => setShowSideNav(true) }}>
            <header className="mb-6 flex gap-4 items-center p-4">
              <button
                title="Show Sidebar"
                onClick={() => setShowSideNav(true)}
                className="xl:hidden"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
              <div>
                <span className="font-bold text-2xl">
                  {links.find((link) => link.href === pathname)?.sectionTitle ||
                    links.find((link) => link.href === pathname)?.name ||
                    "Dashboard Overview"}
                </span>
              </div>
            </header>
            <div className="flex-1 px-4 pb-4">{children}</div>
          </SideNavContext>
        </section>
      </div>
    </>
  );
}
