"use client";

import { CustomerAppFooter, CustomerAppNav, SEWordmark } from "@/components/ui/CustomerAppChrome";
import { Banknote, Bell, History, Home, Menu, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReferralProvider } from "./_components/ReferralProvider";

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-24 font-['Hind_Siliguri',sans-serif]">
      <header className="relative bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 pt-3 pb-7 rounded-b-[26px] overflow-hidden">
        <span className="absolute -right-10 -top-14 size-56 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <Link href="/customer/profile"><SEWordmark /></Link>
          <span className="h-10 w-px bg-white/40" />
          <span className="text-[clamp(16px,4.6vw,20px)] font-extrabold leading-tight flex-1 min-w-0">SE Electronics<br />Referral</span>
          <Link href="/customer/notifications" aria-label="Notifications" className="size-10 flex items-center justify-center relative"><Bell size={22} /><span className="absolute top-2 right-2 size-2 rounded-full bg-[#e5484d]" /></Link>
          <Link href="/customer/profile" aria-label="Menu" className="size-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center"><Menu size={20} /></Link>
        </div>
      </header>

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5 max-w-[560px] mx-auto">
        <ReferralProvider>{children}</ReferralProvider>
      </main>

      <CustomerAppFooter tagline="একসাথে এগিয়ে চলি" />

      <CustomerAppNav active={pathname} items={[
        { label: "হোম", icon: Home, href: "/customer/referral" },
        { label: "ক্যাশ আউট", icon: Banknote, href: "/customer/referral/cash-out" },
        { label: "ইতিহাস", icon: History, href: "/customer/referral/history" },
        { label: "প্রোফাইল", icon: User, href: "/customer/profile" },
      ]} />

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap");
      `}</style>
    </div>
  );
}
