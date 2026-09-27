import { verifyStaffSession } from "@/actions";
import { getStaffById, getStaffProfileStats } from "@/actions/staffActions";
import { StaffPaymentSettingsForm } from "@/components/features/staff/StaffPaymentSettingsForm";
import { StaffLayout } from "@/components/layout";
import { ArrowLeft, Info, Wallet } from "lucide-react";
import Link from "next/link";

export default async function StaffPaymentSettingsPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const [profileRes, statsRes] = await Promise.all([
    getStaffById(userId),
    getStaffProfileStats(userId),
  ]);

  const staffData = profileRes.success ? profileRes.data : null;
  const stats = statsRes.success ? statsRes.data : null;

  if (!staffData) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4">
        <p className="rounded-md bg-white border border-[#dfe6f2] p-4 text-[#3d4a63] font-bold">
          Staff profile data not available.
        </p>
      </div>
    );
  }

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5 overflow-x-hidden">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <Link href="/staff/payment" aria-label="Back" className="size-10 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[clamp(18px,5.2vw,22px)] font-extrabold truncate">Payout Settings</span>
            <span className="text-[12px] font-semibold text-[#5b6784] truncate">Payout Configuration</span>
          </span>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2.5">
            <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wallet size={22} /></span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-[10.5px] font-bold uppercase tracking-[1.5px] text-white/85">Preferred Withdrawal Gateway</span>
              <span className="text-[15px] font-extrabold">Account &amp; Identity Verification</span>
            </span>
          </div>
          <p className="relative mt-2 text-[12.5px] font-medium leading-relaxed text-white/90">
            Configure your preferred payout gateway. Ensure the account details
            (bKash/Nagad/Bank) are accurate to avoid processing delays.
          </p>
        </section>

        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <StaffPaymentSettingsForm
            initialPaymentPreference={staffData.paymentPreference}
            initialWalletNumber={staffData.walletNumber}
            initialBankInfo={staffData.bankInfo ?? null}
          />
        </section>

        {/* Info Card */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex gap-2.5">
          <span className="size-8 rounded-md bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><Info size={16} /></span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-[#0b3d91] uppercase tracking-tight">Important Note</p>
            <p className="text-[12px] font-medium text-[#1b4f9c] mt-0.5 leading-relaxed">
              Changes to payment settings may require up to 24 hours for
              verification by our administrative team.
            </p>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
