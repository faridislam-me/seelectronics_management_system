import { verifyStaffSession } from "@/actions";
import { getStaffById, getStaffProfileStats } from "@/actions/staffActions";
import { StaffPaymentRequestForm } from "@/components/features/staff/StaffPaymentRequestForm";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { AlertCircle, ChevronDown, RefreshCw, User, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function maskNumber(value: string) {
  if (!value || value.length < 4) return "****";
  return value.slice(-4).padStart(value.length, "*");
}

const methodMeta: Record<string, { label: string; logo?: string; bg: string }> = {
  bkash: { label: "Transfer to bKash", logo: "/bkash.png", bg: "bg-white" },
  nagad: { label: "Transfer to Nagad", logo: "/nagad.png", bg: "bg-white" },
  rocket: { label: "Transfer to Rocket", logo: "/rocket.png", bg: "bg-white" },
  bank: { label: "Bank Account Transfer", logo: "/bank.png", bg: "bg-white" },
  cash: { label: "Hand Cash Withdrawal", bg: "bg-[#e9f9ef]" },
};

export default async function StaffPaymentRequestPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const [profileRes, statsRes] = await Promise.all([
    getStaffById(userId),
    getStaffProfileStats(userId),
  ]);

  const staffData = profileRes.success ? profileRes.data : null;
  const stats = statsRes.success ? statsRes.data : null;

  const method = staffData?.paymentPreference ?? "";
  const hasWallet = ["bkash", "nagad", "rocket"].includes(method) && !!staffData?.walletNumber;
  const hasBank = method === "bank" && !!staffData?.bankInfo;
  const canRequest = method === "cash" || hasWallet || hasBank;
  const meta = methodMeta[method];
  const balance = Number(stats?.availableBalance || 0);
  const destination = hasWallet
    ? maskNumber(staffData!.walletNumber!)
    : hasBank
      ? `${staffData!.bankInfo!.bankName} · ${maskNumber(staffData!.bankInfo!.accountNumber)}`
      : method === "cash"
        ? "Collect at Office"
        : "";

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a]">
        {/* Hero: avatar, name, phone */}
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#dfe9fb_0%,#eef3fb_100%)] px-2 pt-4 pb-3">
          <span className="absolute -left-10 -top-10 size-40 rounded-full bg-[#1f7cf0]/10" />
          <span className="absolute -right-8 bottom-0 size-32 rounded-full bg-[#1f7cf0]/10" />
          <Image src="/logo.jpg" alt="SE Electronics" width={44} height={44} className="absolute right-3 top-3 size-11 rounded-md object-cover bg-white shadow-sm" />
          <div className="relative flex flex-col items-center text-center">
            {staffData?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staffData.photoUrl} alt={staffData.name || ""} className="size-[76px] rounded-full object-cover border-[3px] border-white shadow-[0_0_0_2px_#1f7cf0] bg-white" />
            ) : (
              <span className="size-[76px] rounded-full bg-[#1f7cf0] border-[3px] border-white shadow-[0_0_0_2px_#1f7cf0] flex items-center justify-center text-white"><User size={34} /></span>
            )}
            <h2 className="mt-2 text-[clamp(17px,4.8vw,21px)] font-extrabold leading-tight">{staffData?.name}</h2>
            <p className="text-[13px] font-semibold text-[#5b6784]">{staffData?.phone}</p>
          </div>
        </section>

        <div className="px-2 pb-4 flex flex-col gap-2.5">
          {/* Available balance */}
          <div className="rounded-md bg-[#0b3d91] bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_10px_30px_rgba(10,47,112,0.35)] relative overflow-hidden">
            <span className="absolute -right-8 -bottom-12 size-40 rounded-full border-[14px] border-white/5" />
            <span className="size-14 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Wallet size={28} strokeWidth={2} /></span>
            <span className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold tracking-[1.5px] text-white/85">AVAILABLE BALANCE</span>
              <span className="text-[clamp(24px,7vw,32px)] font-extrabold leading-tight">৳ {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
          </div>

          {/* Payout destination */}
          {canRequest && meta && (
            <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
              <span className="text-[15px] font-extrabold">Payout Destination</span>
              <div className="flex items-center gap-3 rounded-md bg-[#f5f7fb] border border-[#e6ebf4] p-2.5">
                <span className={`size-12 rounded-md ${meta.bg} border border-[#e6ebf4] flex items-center justify-center shrink-0 overflow-hidden`}>
                  {meta.logo ? (
                    <Image src={meta.logo} alt={method} width={40} height={40} className="size-9 object-contain" />
                  ) : (
                    <Wallet size={22} className="text-[#1a9c4b]" />
                  )}
                </span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-[14px] font-extrabold truncate">{meta.label}</span>
                  <span className="text-[12px] font-semibold text-[#5b6784] tracking-wider truncate">{destination}</span>
                </span>
                <ChevronDown size={18} className="text-[#5b6784] shrink-0" />
              </div>
              <Link href="/staff/payment/settings" className="self-end inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1f7cf0] underline underline-offset-2">
                <RefreshCw size={13} strokeWidth={2.4} />Change Method
              </Link>
            </div>
          )}

          {!canRequest && (
            <div className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-3 flex gap-3">
              <span className="shrink-0 size-9 rounded-full bg-[#ffe9b8] flex items-center justify-center"><AlertCircle size={18} className="text-[#b8620b]" /></span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-extrabold text-[#8a4a05]">উত্তোলনের তথ্য অনুপস্থিত</p>
                <p className="text-[13px] text-[#8a4a05]/80 font-medium leading-relaxed">পেমেন্ট অনুরোধ করার আগে আপনার পেমেন্ট পদ্ধতি (বিকাশ, নগদ, রকেট বা ব্যাংক) সেট করতে হবে।</p>
                <Link href="/staff/payment/settings" className="self-start mt-1 inline-flex items-center h-9 px-3.5 rounded-md bg-[#e0a11b] text-white text-sm font-bold">Go to Settings</Link>
              </div>
            </div>
          )}

          {canRequest && <StaffPaymentRequestForm staffId={userId} />}
        </div>
      </div>
    </StaffLayout>
  );
}
