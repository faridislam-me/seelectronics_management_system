import { verifyStaffSession } from "@/actions";
import { getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout";
import { ArrowLeft, Banknote, ClipboardList, Clock, FileText, Hourglass, LayoutDashboard, Wallet } from "lucide-react";
import Link from "next/link";

export default async function LoanPage() {
  const session = await verifyStaffSession();
  const statsRes = session.isAuth ? await getStaffProfileStats(session.userId as string) : null;
  const balance = statsRes?.success ? statsRes.data?.availableBalance || 0 : 0;

  const upcoming = [
    { icon: ClipboardList, title: "Loan Request", sub: "Apply from your dashboard" },
    { icon: FileText, title: "Loan Management", sub: "Track status & details" },
    { icon: Wallet, title: "Repayment", sub: "From your balance" },
  ];

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <Link href="/staff/profile" aria-label="Back" className="size-10 rounded-md bg-white border border-[#dfe6f2] text-[#0b3d91] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight">
            <span className="text-[clamp(19px,5.6vw,23px)] font-extrabold">Staff Loan</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">Loan request and management</span>
          </span>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-4 top-4 size-16 rounded-md bg-white/15 border border-white/25 flex items-center justify-center"><Banknote size={32} /></span>
          <div className="relative flex items-center gap-3 pr-20">
            <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wallet size={26} /></span>
            <span className="text-[clamp(22px,6.4vw,28px)] font-extrabold leading-tight">Loan<br />Service</span>
          </div>
          <span className="relative mt-2 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#f5c518] text-[#3a2a00] text-[11px] font-extrabold uppercase tracking-wide"><Hourglass size={13} />Coming Soon</span>
        </section>

        {/* Coming soon card (original text) */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-4 flex flex-col items-center text-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="relative size-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#e6f7f4] animate-ping [animation-duration:2.4s] opacity-60" />
            <span className="relative size-20 rounded-full bg-[#e6f7f4] border border-[#bfe9e1] text-[#0f8a78] flex items-center justify-center"><Banknote size={40} /></span>
          </span>
          <h1 className="text-[clamp(20px,6vw,26px)] font-extrabold uppercase tracking-tight text-[#0b2a66]">Feature Coming Soon</h1>
          <p className="text-[13px] font-medium leading-relaxed text-[#5b6784] max-w-md">
            The loan request and management feature is currently under development.
            You will soon be able to apply for loans directly from your dashboard.
          </p>
        </section>

        {/* Upcoming features */}
        <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
            <span className="size-7 rounded-md bg-[#0b3d91] text-white flex items-center justify-center"><Clock size={15} /></span>
            <span className="text-[14px] font-extrabold text-[#0b3d91]">What&apos;s coming</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#e6ebf4]">
            {upcoming.map((u) => (
              <div key={u.title} className="p-2.5 flex flex-col items-center text-center gap-1.5">
                <span className="size-10 rounded-md bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center"><u.icon size={20} /></span>
                <span className="text-[12px] font-extrabold leading-tight">{u.title}</span>
                <span className="text-[10.5px] font-medium text-[#5b6784] leading-tight">{u.sub}</span>
              </div>
            ))}
          </div>
        </section>

        <Link href="/staff/profile" className="h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(11,61,145,0.3)]"><LayoutDashboard size={18} />Back to Dashboard</Link>
      </div>
    </StaffLayout>
  );
}
