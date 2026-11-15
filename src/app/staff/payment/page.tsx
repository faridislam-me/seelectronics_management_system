import { verifyStaffSession } from "@/actions";
import { getStaffPaymentHistory } from "@/actions/paymentRequestActions";
import { getStaffProfileStats } from "@/actions/staffActions";
import { PaymentCompactList } from "@/components/features/payments/StaffPaymentCards";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { PaymentDataType } from "@/types";
import { ChevronRight, CreditCard, History, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";

export default async function StaffPaymentHubPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const [statsRes, paymentsRes] = await Promise.all([getStaffProfileStats(userId), getStaffPaymentHistory(userId)]);
  const stats = statsRes.success ? statsRes.data : null;
  const paymentsList = (paymentsRes.success ? (paymentsRes.data ?? []) : []) as PaymentDataType[];

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2 flex flex-col gap-2.5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-4 top-4 size-16 rounded-md bg-white/15 border border-white/25 flex items-center justify-center"><CreditCard size={30} /></span>
          <div className="relative flex items-center gap-3 pr-20">
            <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wallet size={26} /></span>
            <span className="text-[clamp(22px,6.4vw,28px)] font-extrabold leading-tight">All Payment<br />History</span>
          </div>
          <p className="relative mt-2 text-[13px] leading-relaxed text-white/90 max-w-[70%]">Track your all payment records in one place. Stay updated with your transactions.</p>
        </section>

        {/* Mobile recharge from the staff's available balance */}
        <Link href="/staff/payment/recharge" className="rounded-md bg-white border-2 border-[#1f7cf0] p-3 flex items-center gap-3 shadow-[0_6px_18px_rgba(31,124,240,0.12)]">
          <span className="size-11 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Smartphone size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[15px] font-extrabold text-[#0b3d91]">মোবাইল রিচার্জ</span>
            <span className="text-[11.5px] text-[#5b6784]">আপনার ব্যালেন্স থেকে ইনস্ট্যান্ট রিচার্জ</span>
          </span>
          <ChevronRight size={18} className="text-[#1f7cf0]" />
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/staff/payment/request" className="rounded-md bg-[#1f7cf0] text-white p-2.5 flex items-center gap-2.5 shadow-[0_8px_20px_rgba(31,124,240,0.35)]">
            <span className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><CreditCard size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">Withdraw</span><span className="text-[11px] text-white/85">Instant Payout Request</span></span>
            <ChevronRight size={16} />
          </Link>
          <Link href="/staff/payment/payment-history" className="rounded-md bg-white border-2 border-[#1f7cf0] p-2.5 flex items-center gap-2.5">
            <span className="size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><History size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">All History</span><span className="text-[11px] text-[#5b6784]">Detailed statements</span></span>
            <ChevronRight size={16} className="text-[#1f7cf0]" />
          </Link>
        </div>

        <PaymentCompactList payments={paymentsList} />
      </div>
    </StaffLayout>
  );
}
