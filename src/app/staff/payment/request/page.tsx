import { verifyStaffSession } from "@/actions";
import { getStaffById, getStaffProfileStats } from "@/actions/staffActions";
import { StaffPaymentRequestForm } from "@/components/features/staff/StaffPaymentRequestForm";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { methodThemes } from "@/components/features/payments/paymentThemes";
import clsx from "clsx";
import { AlertCircle, ArrowLeft, RefreshCw, User, Wallet } from "lucide-react";
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

  const themeKey = method === "cash" ? "cash" : method && methodThemes[method] ? method : "bank";
  const theme = methodThemes[themeKey];

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2 flex flex-col gap-2.5 overflow-x-hidden">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <Link href="/staff/payment" aria-label="Back" className="size-10 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[clamp(18px,5.2vw,22px)] font-extrabold truncate">Withdraw</span>
            <span className="text-[12px] font-semibold text-[#5b6784] truncate">Instant Payout Request</span>
          </span>
        </div>

        {/* Staff + available balance */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
          <span className="absolute -right-6 -bottom-12 size-36 rounded-full border-[14px] border-white/5" />
          <div className="relative flex items-center gap-2.5">
            {staffData?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staffData.photoUrl} alt={staffData.name || ""} className="size-12 rounded-md object-cover border-2 border-white/70 bg-white shrink-0" />
            ) : (
              <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><User size={24} /></span>
            )}
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="text-[15px] font-extrabold truncate">{staffData?.name}</span>
              <span className="text-[12px] font-semibold text-white/85 truncate">{staffData?.phone}</span>
            </span>
          </div>
          <div className="relative mt-3 flex items-center gap-2.5 rounded-md bg-white/10 border border-white/15 p-2.5">
            <span className="size-11 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Wallet size={22} /></span>
            <span className="flex flex-col min-w-0">
              <span className="text-[10.5px] font-bold tracking-[1.5px] text-white/85">AVAILABLE BALANCE</span>
              <span className="text-[clamp(22px,6.6vw,30px)] font-extrabold leading-tight truncate">৳ {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
          </div>
        </section>

        {/* Payout destination */}
        {canRequest && meta && (
          <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-extrabold">Payout Destination</span>
              <Link href="/staff/payment/settings" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[#bcd4fb] bg-white text-[12px] font-bold text-[#1f7cf0] shrink-0">
                <RefreshCw size={13} strokeWidth={2.4} />Change Method
              </Link>
            </div>
            <div className={clsx("relative overflow-hidden flex items-center gap-2.5 rounded-md border p-2.5", theme.card, theme.border)}>
              {meta.logo && (
                <span aria-hidden className="pointer-events-none absolute -right-2 -bottom-3 size-20 opacity-[0.12]">
                  <Image src={meta.logo} alt="" fill sizes="80px" className="object-contain" />
                </span>
              )}
              <span className="relative size-11 rounded-md bg-white border border-[#e6ebf4] flex items-center justify-center shrink-0 overflow-hidden">
                {meta.logo ? (
                  <Image src={meta.logo} alt={method} width={40} height={40} className="size-8 object-contain" />
                ) : (
                  <Wallet size={22} className="text-[#1a9c4b]" />
                )}
              </span>
              <span className="relative flex flex-col min-w-0 flex-1 gap-0.5">
                <span className="text-[14px] font-extrabold truncate">{meta.label}</span>
                <span className="text-[12px] font-semibold text-[#3d4a63] tracking-wider truncate">{destination}</span>
              </span>
              <span className={clsx("relative shrink-0 h-6 px-2 rounded-md text-[10px] font-extrabold inline-flex items-center", theme.chip)}>{theme.label}</span>
            </div>
          </section>
        )}

        {!canRequest && (
          <div className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-2.5 flex gap-2.5">
            <span className="shrink-0 size-9 rounded-md bg-[#ffe9b8] flex items-center justify-center"><AlertCircle size={18} className="text-[#b8620b]" /></span>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-extrabold text-[#8a4a05]">উত্তোলনের তথ্য অনুপস্থিত</p>
              <p className="text-[13px] text-[#8a4a05]/80 font-medium leading-relaxed">পেমেন্ট অনুরোধ করার আগে আপনার পেমেন্ট পদ্ধতি (বিকাশ, নগদ, রকেট বা ব্যাংক) সেট করতে হবে।</p>
              <Link href="/staff/payment/settings" className="self-start mt-1 inline-flex items-center h-9 px-3.5 rounded-md bg-[#e0a11b] text-white text-sm font-bold">Go to Settings</Link>
            </div>
          </div>
        )}

        {canRequest && <StaffPaymentRequestForm staffId={userId} />}
      </div>
    </StaffLayout>
  );
}
