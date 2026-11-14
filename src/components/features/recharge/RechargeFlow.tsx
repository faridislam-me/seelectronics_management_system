"use client";

import { getMyDriveInfo } from "@/actions/driveBalanceActions";
import { getDrivePackages, requestMobileRecharge } from "@/actions/rechargeActions";
import OperatorIcon, { OPERATOR_META } from "@/components/features/recharge/OperatorIcon";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Home,
  Loader2,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useReferral } from "@/app/customer/referral/_components/ReferralProvider";

export type RechargeType = "recharge" | "regular_pack" | "drive_pack" | "drive_offer";

const OPERATOR_KEYS = ["grameenphone", "banglalink", "robi", "airtel", "teletalk", "skitto"];

const TYPE_META: Record<
  RechargeType,
  {
    title: string;
    subtitle: string;
    mode: "amount" | "pack";
    balanceSource: "referral" | "drive";
    requiresKyc: boolean;
    bannerClass: string;
    accent: string; // hex
    balanceLabel: string;
  }
> = {
  recharge: {
    title: "রিচার্জ",
    subtitle: "রেফারেল ব্যালেন্স থেকে ইনস্ট্যান্ট রিচার্জ",
    mode: "amount",
    balanceSource: "referral",
    requiresKyc: false,
    bannerClass: "bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] shadow-[0_8px_22px_rgba(11,61,145,0.25)]",
    accent: "#0b3d91",
    balanceLabel: "ব্যবহারযোগ্য ব্যালেন্স",
  },
  regular_pack: {
    title: "রেগুলার প্যাক",
    subtitle: "রেফারেল ব্যালেন্স থেকে বান্ডেল কিনুন",
    mode: "pack",
    balanceSource: "referral",
    requiresKyc: false,
    bannerClass: "bg-[linear-gradient(105deg,#9c1458,#e84393)] shadow-[0_8px_22px_rgba(156,20,88,0.25)]",
    accent: "#e84393",
    balanceLabel: "ব্যবহারযোগ্য ব্যালেন্স",
  },
  drive_pack: {
    title: "ড্রাইভ প্যাক",
    subtitle: "ড্রাইভ ব্যালেন্স থেকে বান্ডেল কিনুন",
    mode: "pack",
    balanceSource: "drive",
    requiresKyc: true,
    bannerClass: "bg-[linear-gradient(105deg,#00695c,#00b894)] shadow-[0_8px_22px_rgba(0,105,92,0.25)]",
    accent: "#00695c",
    balanceLabel: "ড্রাইভ ব্যালেন্স",
  },
  drive_offer: {
    title: "ড্রাইভ অফার",
    subtitle: "ড্রাইভ ব্যালেন্স থেকে বিশেষ অফার",
    mode: "pack",
    balanceSource: "drive",
    requiresKyc: true,
    bannerClass: "bg-[linear-gradient(105deg,#b8700a,#f39c12)] shadow-[0_8px_22px_rgba(184,112,10,0.25)]",
    accent: "#b8700a",
    balanceLabel: "ড্রাইভ ব্যালেন্স",
  },
};

const CATEGORIES: { key: string; label: string; match: (p: Pack) => boolean }[] = [
  { key: "all", label: "সব", match: () => true },
  { key: "bundle", label: "বান্ডেল", match: (p) => catKey(p) === "bundle" },
  { key: "data", label: "ডাটা", match: (p) => catKey(p) === "data" },
  { key: "voice", label: "ভয়েস", match: (p) => catKey(p) === "voice" },
  { key: "callrate", label: "কল রেট", match: (p) => catKey(p) === "callrate" },
];

type Pack = {
  id: string;
  name: string;
  amount: number;
  validity: string;
  detail: string;
  type?: string;
  raw: Record<string, any>;
};

const mapPack = (d: any, i: number): Pack => {
  const amount = Number(d.amount ?? d.price ?? d.taka ?? d.tk ?? 0);
  return {
    id: String(d.package_id ?? d.packageId ?? d.id ?? d.code ?? `${amount}-${i}`),
    name: String(d.title ?? d.name ?? d.pack ?? (amount ? `৳${amount}` : "প্যাকেজ")),
    amount,
    validity: String(d.validity ?? d.duration ?? d.days ?? d.expiry ?? ""),
    detail: String(d.detail ?? d.description ?? d.desc ?? d.sms ?? ""),
    type: d.type,
    raw: d,
  };
};

function catKey(p: Pack): string {
  const hay = `${p.raw?.type ?? ""} ${p.raw?.category ?? ""} ${p.name} ${p.detail}`.toLowerCase();
  if (/(call ?rate|callrate|minute|মিনিট|কল)/.test(hay)) return "callrate";
  if (/(voice|ভয়েস|talktime|টকটাইম)/.test(hay)) return "voice";
  if (/(data|internet|ইন্টারনেট|ডাটা|gb|mb)/.test(hay)) return "data";
  if (/(bundle|combo|বান্ডেল|কম্বো)/.test(hay)) return "bundle";
  return "bundle";
}

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// Shown (collapsible) in the recharge confirm sheet before the customer pays.
const IMPORTANT_NOTICE =
  "সকল রিচার্জ ও প্যাকেজ সংশ্লিষ্ট মোবাইল অপারেটরের নিয়ম ও শর্ত অনুযায়ী প্রযোজ্য হবে। রিচার্জ করার আগে নম্বরটি সঠিক কিনা ভালো করে যাচাই করুন — ভুল নম্বরে পাঠানো রিচার্জ ফেরতযোগ্য নয়। প্যাকেজ চালু হতে কিছুটা সময় লাগতে পারে এবং সংশ্লিষ্ট অপারেটরের সর্বশেষ অফার অনুযায়ী প্রযোজ্য হবে। কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন — ০৯৬৪৯৩৫৫৫৫৫।";

type SuccessResult = {
  phone: string;
  operator: string;
  operatorKey: string;
  amount: number;
  trxId: string;
  newBalance: number;
  time: string;
};

export default function RechargeFlow({ rechargeType }: { rechargeType: RechargeType }) {
  const meta = TYPE_META[rechargeType];
  const router = useRouter();
  const referral = useReferral();

  // Drive balance/KYC (only used for drive types).
  const [driveInfo, setDriveInfo] = useState<{ driveBalance: number; kycStatus: string; kyc: any } | null>(null);
  const [loadingDrive, setLoadingDrive] = useState(meta.balanceSource === "drive");

  const [operator, setOperator] = useState("grameenphone");
  const [category, setCategory] = useState("all");
  const [rechargePhone, setRechargePhone] = useState("");
  const [driverRef, setDriverRef] = useState("");
  const [amount, setAmount] = useState("");

  const [packages, setPackages] = useState<Pack[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [sheetPkg, setSheetPkg] = useState<Pack | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [copied, setCopied] = useState(false);
  // When a recharge/pack is attempted with less than the needed balance we show
  // a clear popup (not just a toast) guiding the customer to refer / add money.
  const [insufficient, setInsufficient] = useState<number | null>(null);

  const isDrive = meta.balanceSource === "drive";
  const approved = !meta.requiresKyc || driveInfo?.kycStatus === "approved";
  const balance = isDrive ? Number(driveInfo?.driveBalance ?? 0) : Number(referral.data.balance ?? 0);

  const loadDrive = useCallback(async () => {
    if (!isDrive) return;
    const res = await getMyDriveInfo();
    if (res.success && "data" in res && res.data) setDriveInfo(res.data as any);
    setLoadingDrive(false);
  }, [isDrive]);

  useEffect(() => {
    loadDrive();
  }, [loadDrive]);

  // Load packages for the selected operator (pack modes only, after KYC).
  useEffect(() => {
    if (meta.mode !== "pack" || !approved) {
      setPackages([]);
      return;
    }
    let active = true;
    setLoadingPkgs(true);
    getDrivePackages(operator).then((res) => {
      if (!active) return;
      if (res.success && Array.isArray(res.data)) {
        const all = res.data.map(mapPack);
        // regular_pack → "regular" items; drive_pack → "drive"; drive_offer → all.
        const want = rechargeType === "regular_pack" ? "regular" : rechargeType === "drive_pack" ? "drive" : null;
        setPackages(want ? all.filter((p) => !p.type || p.type === want) : all);
      } else {
        setPackages([]);
      }
      setLoadingPkgs(false);
    });
    return () => {
      active = false;
    };
  }, [operator, approved, meta.mode, rechargeType]);

  const visiblePackages = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
    return packages.filter(cat.match);
  }, [packages, category]);

  const doRecharge = async (amt: number, pkgId?: string) => {
    if (!rechargePhone.trim()) return toast.error("রিচার্জ নম্বর দিন");
    if (isDrive && !driverRef.trim()) return toast.error("ড্রাইভার আইডি / রেফারেন্স নম্বর দিন");
    if (!amt || amt < 10) return toast.error("ন্যূনতম ৳১০");
    if (amt > balance) {
      setInsufficient(amt);
      return;
    }

    setSubmitting(true);
    const res = await requestMobileRecharge({
      rechargePhone: rechargePhone.trim(),
      operator,
      amount: amt,
      rechargeType,
      packageId: pkgId,
      driverRef: isDrive ? driverRef.trim() : undefined,
    });
    setSubmitting(false);

    if (res.success && "detail" in res && res.detail) {
      setSuccess(res.detail as SuccessResult);
      setSheetPkg(null);
      setAmount("");
      setDriverRef("");
      if (isDrive) await loadDrive();
      else await referral.refetch();
      router.refresh();
    } else if (res.success) {
      toast.success(res.message);
      setSheetPkg(null);
      setAmount("");
      setDriverRef("");
      if (isDrive) await loadDrive();
      else await referral.refetch();
      router.refresh();
    } else {
      toast.error(res.message || "রিচার্জ করা যায়নি");
    }
  };

  const activeOpBn = OPERATOR_META[operator]?.labelBn || operator;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/referral/recharge" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">{meta.title}</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">{meta.subtitle}</span>
        </span>
      </div>

      {/* Balance banner */}
      <div className={clsx("rounded-md text-white p-3 flex items-center gap-3", meta.bannerClass)}>
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          {isDrive ? <Wallet size={22} /> : <Package size={22} />}
        </span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">{meta.balanceLabel}</span>
          <span className="text-[22px] font-extrabold">{loadingDrive ? "…" : `৳${balance.toLocaleString("en-IN")}`}</span>
        </span>
        {isDrive && approved && (
          <Link
            href="/customer/referral/recharge/drive/add-money"
            className="shrink-0 h-8 px-3 rounded-full bg-white text-[#00695c] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
          >
            <Plus size={14} /> অ্যাড মানি
          </Link>
        )}
      </div>

      {loadingDrive ? (
        <div className="flex items-center justify-center py-14"><Loader2 className="size-6 animate-spin text-[#0b3d91]" /></div>
      ) : meta.requiresKyc && !approved ? (
        <KycGate info={driveInfo} />
      ) : (
        <>
          {/* Operator tabs */}
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <div className="grid grid-cols-6 gap-1.5">
              {OPERATOR_KEYS.map((key) => {
                const active = operator === key;
                const color = OPERATOR_META[key]?.color || "#0b3d91";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOperator(key)}
                    className={clsx("flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all", active ? "border-transparent" : "border-[#dfe6f2] bg-white hover:bg-[#f5f7fb]")}
                    style={active ? { backgroundColor: `${color}14`, borderColor: color } : undefined}
                  >
                    <OperatorIcon operatorKey={key} size={32} shape="circle" />
                    <span className="text-[8.5px] font-bold leading-none text-center" style={{ color: active ? color : "#5b6784" }}>
                      {OPERATOR_META[key]?.labelBn || key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharge phone */}
          <div className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">রিচার্জ নম্বর *</label>
            <input
              value={rechargePhone}
              onChange={(e) => setRechargePhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
              className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
            />
          </div>

          {meta.mode === "amount" ? (
            /* Direct recharge: amount + confirm */
            <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
              <div>
                <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">পরিমাণ (৳) *</label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ন্যূনতম ৳১০"
                  className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
                />
              </div>
              <button
                onClick={() => doRecharge(Number(amount))}
                disabled={submitting}
                className="w-full h-11 rounded-md text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
                style={{ backgroundColor: meta.accent }}
              >
                {submitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
                {submitting ? "রিচার্জ হচ্ছে..." : "রিচার্জ করুন"}
              </button>
            </div>
          ) : (
            <>
              {/* Category chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={clsx("shrink-0 h-8 px-3 rounded-full border text-[11.5px] font-extrabold transition-colors", active ? "text-white" : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]")}
                      style={active ? { backgroundColor: meta.accent, borderColor: meta.accent } : undefined}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Package list — tap opens the confirm sheet */}
              {loadingPkgs ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="size-6 animate-spin text-[#0b3d91]" /></div>
              ) : visiblePackages.length === 0 ? (
                <div className="rounded-md bg-white border border-[#dfe6f2] p-6 text-center flex flex-col items-center gap-2">
                  <span className="size-12 rounded-full bg-[#f5f7fb] flex items-center justify-center"><Package size={26} className="text-[#b0bdd0]" /></span>
                  <p className="text-[13px] font-extrabold text-[#0f1729]">কোনো প্যাকেজ নেই</p>
                  <p className="text-[11.5px] font-semibold text-[#5b6784]">{activeOpBn}-এ এই মুহূর্তে এই ক্যাটাগরিতে কোনো প্যাকেজ পাওয়া যাচ্ছে না।</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {visiblePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSheetPkg(pkg)}
                      className="text-left rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_2px_8px_rgba(11,61,145,0.05)] active:scale-[0.995] transition"
                    >
                      <OperatorIcon operatorKey={operator} size={34} />
                      <span className="flex flex-col flex-1 min-w-0">
                        <span className="text-[13px] font-extrabold text-[#0f1729] truncate">{pkg.name}</span>
                        {(pkg.detail || pkg.validity) && (
                          <span className="text-[10.5px] font-semibold text-[#5b6784] truncate">
                            {pkg.detail}{pkg.validity ? ` · ${pkg.validity}` : ""}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[14px] font-extrabold" style={{ color: meta.accent }}>{bdt(pkg.amount)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="text-[11px] text-center text-[#5b6784] px-4">
            রিচার্জ স্বয়ংক্রিয়ভাবে প্রক্রিয়া হবে এবং {isDrive ? "ড্রাইভ" : ""} ব্যালেন্স থেকে কর্তন করা হবে।
          </p>
        </>
      )}

      {/* Package confirm sheet (tap a package) */}
      {sheetPkg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => !submitting && setSheetPkg(null)}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 pb-6 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-extrabold" style={{ color: meta.accent }}>{meta.title} রিচার্জ</p>
              <button type="button" onClick={() => !submitting && setSheetPkg(null)} className="size-8 rounded-full bg-[#f1f4f9] flex items-center justify-center"><X size={16} /></button>
            </div>

            {/* Package summary */}
            <div className="rounded-md border border-[#dfe6f2] p-3 flex items-center gap-3">
              <OperatorIcon operatorKey={operator} size={38} />
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-extrabold text-[#0f1729]">{sheetPkg.name}</span>
                {(sheetPkg.detail || sheetPkg.validity) && (
                  <span className="text-[11px] font-semibold text-[#5b6784]">{sheetPkg.detail}{sheetPkg.validity ? ` · ${sheetPkg.validity}` : ""}</span>
                )}
              </span>
              <span className="text-[16px] font-extrabold" style={{ color: meta.accent }}>{bdt(sheetPkg.amount)}</span>
            </div>

            {/* Important notice (collapsible) */}
            <div className="rounded-md border border-[#f5dfa0] bg-[#fff8e6] overflow-hidden">
              <button
                type="button"
                onClick={() => setNoticeOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[#8a5a12]">
                  <AlertTriangle size={15} /> গুরুত্বপূর্ণ নোটিশ
                </span>
                <ChevronDown size={16} className={clsx("text-[#8a5a12] transition-transform", noticeOpen && "rotate-180")} />
              </button>
              {noticeOpen && (
                <p className="px-3 pb-3 text-[11.5px] leading-relaxed text-[#8a5a12]">{IMPORTANT_NOTICE}</p>
              )}
            </div>

            {/* Number (editable) */}
            <div>
              <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">মোবাইল নম্বর *</label>
              <input
                value={rechargePhone}
                onChange={(e) => setRechargePhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
              />
            </div>

            {/* Driver ID / reference — required for drive pack & drive offer */}
            {isDrive && (
              <div>
                <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">ড্রাইভার আইডি / রেফারেন্স নম্বর *</label>
                <input
                  value={driverRef}
                  onChange={(e) => setDriverRef(e.target.value)}
                  placeholder="ড্রাইভার আইডি বা রেফারেন্স নম্বর দিন"
                  className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
                />
              </div>
            )}

            {/* Balance + insufficient hint */}
            <div className="flex items-center justify-between text-[11.5px] font-bold">
              <span className="text-[#5b6784]">{meta.balanceLabel}: <span className="text-[#0f1729]">{bdt(balance)}</span></span>
              {sheetPkg.amount > balance && <span className="text-[#c81f38]">ব্যালেন্স অপর্যাপ্ত</span>}
            </div>

            <button
              onClick={() => doRecharge(sheetPkg.amount, sheetPkg.id)}
              disabled={submitting || !rechargePhone.trim() || (isDrive && !driverRef.trim())}
              className="w-full h-12 rounded-md text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.25)] disabled:opacity-50"
              style={{ backgroundColor: meta.accent }}
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
              {submitting ? "রিচার্জ হচ্ছে..." : "রিচার্জ করুন"}
            </button>
          </div>
        </div>
      )}

      {/* Insufficient-balance popup */}
      {insufficient !== null && (
        <InsufficientBalancePopup
          need={insufficient}
          balance={balance}
          isDrive={isDrive}
          balanceLabel={meta.balanceLabel}
          onClose={() => setInsufficient(null)}
        />
      )}

      {/* Success popup */}
      {success && <SuccessScreen result={success} copied={copied} setCopied={setCopied} onHome={() => { setSuccess(null); router.push("/customer/referral/recharge"); }} />}
    </>
  );
}

/**
 * Shown when the customer tries to recharge / buy a pack for more than their
 * available balance. A clear red notice guiding them to refer more or add money
 * (client-requested popup, not a silent toast).
 */
function InsufficientBalancePopup({
  need,
  balance,
  isDrive,
  balanceLabel,
  onClose,
}: {
  need: number;
  balance: number;
  isDrive: boolean;
  balanceLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className="size-16 rounded-full bg-[#fdeaed] flex items-center justify-center">
          <AlertTriangle size={34} className="text-[#c81f38]" />
        </span>
        <p className="text-[18px] font-extrabold text-[#c81f38]">অপর্যাপ্ত ব্যালেন্স</p>
        <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">
          দুঃখিত, আপনি যে পরিমাণ রিচার্জ বা প্যাকেজ নিতে চাচ্ছেন বর্তমানে আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।
          {isDrive
            ? " দয়া করে অ্যাড মানি করে আপনার ড্রাইভ ব্যালেন্সে টাকা যোগ করুন।"
            : " দয়া করে বেশি বেশি রেফার করুন অথবা অ্যাড মানি করে ব্যালেন্সে টাকা যোগ করুন।"}
        </p>
        <div className="w-full rounded-md bg-[#f6f8fc] border border-[#e4e9f2] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
          <span className="text-[#5b6784]">{balanceLabel}</span>
          <span className="text-[#0f1729]">{bdt(balance)}</span>
        </div>
        <div className="w-full rounded-md bg-[#fdeaed] border border-[#f7c3ca] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
          <span className="text-[#c81f38]">প্রয়োজন</span>
          <span className="text-[#c81f38]">{bdt(need)}</span>
        </div>
        <div className="w-full flex gap-2 mt-1">
          <Link
            href={isDrive ? "/customer/referral/recharge/drive/add-money" : "/customer/referral"}
            className="flex-1 h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1 shadow-[0_6px_18px_rgba(11,61,145,0.3)]"
          >
            {isDrive ? (<><Plus size={15} /> অ্যাড মানি করুন</>) : "রেফার করুন"}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-md text-[13px] font-extrabold inline-flex items-center justify-center border bg-white text-[#45506b] border-[#dfe6f2]"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
}

function KycGate({ info }: { info: { kycStatus: string; kyc: any } | null }) {
  const status = info?.kycStatus;
  const kyc = info?.kyc;

  if (status === "pending" && kyc) {
    return (
      <div className="rounded-md bg-white border border-amber-200 p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <span className="size-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center"><Clock size={24} className="text-amber-600" /></span>
        <p className="text-[14px] font-extrabold text-[#0f1729]">আপনার ড্রাইভ KYC রিভিউ এর অপেক্ষায়</p>
        <p className="text-[11.5px] font-semibold text-[#5b6784]">অ্যাডমিন অনুমোদনের পর আপনি ড্রাইভ প্যাক কিনতে পারবেন।</p>
        {kyc?.requestCode && <span className="text-[10px] font-bold font-mono text-[#5b6784] bg-[#f1f4f9] px-2 py-0.5 rounded">{kyc.requestCode}</span>}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-md bg-white border border-red-200 p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <span className="size-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center"><XCircle size={24} className="text-red-600" /></span>
        <p className="text-[14px] font-extrabold text-[#0f1729]">ড্রাইভ KYC প্রত্যাখ্যাত হয়েছে</p>
        {kyc?.rejectReason && <p className="text-[11.5px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">কারণ: {kyc.rejectReason}</p>}
        <Link href="/customer/referral/recharge/drive/kyc" className="mt-1 h-10 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)]">আবার জমা দিন</Link>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <span className="size-12 rounded-full bg-[#e8f1ff] border border-[#0b3d91]/15 flex items-center justify-center"><ShieldAlert size={24} className="text-[#0b3d91]" /></span>
      <p className="text-[14px] font-extrabold text-[#0f1729]">ড্রাইভ ব্যালেন্স লক করা আছে</p>
      <p className="text-[11.5px] font-semibold text-[#5b6784]">ড্রাইভ ব্যালেন্স আনলক করতে একবার KYC সম্পন্ন করুন।</p>
      <Link href="/customer/referral/recharge/drive/kyc" className="mt-1 h-10 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)]"><ShieldCheck size={16} /> ড্রাইভ KYC করুন</Link>
    </div>
  );
}

function SuccessScreen({ result, copied, setCopied, onHome }: { result: SuccessResult; copied: boolean; setCopied: (v: boolean) => void; onHome: () => void }) {
  const opBn = OPERATOR_META[result.operatorKey]?.labelBn || result.operator;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0b3d91] to-[#1f7cf0]">
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <div className="size-20 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)]"><CheckCircle2 size={44} className="text-white" /></div>
        <p className="text-[22px] font-extrabold text-white mt-4">আপনার রিচার্জ</p>
        <p className="text-[20px] font-extrabold text-[#22c55e]">সফল হয়েছে</p>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div className="rounded-xl bg-white p-4 flex items-center gap-3 shadow-lg">
          <OperatorIcon operatorKey={result.operatorKey} size={48} shape="circle" />
          <span className="flex flex-col flex-1 min-w-0">
            <span className="text-[15px] font-extrabold text-[#0f1729]">{opBn}</span>
            <span className="text-[13px] font-semibold text-[#5b6784]">{result.phone}</span>
          </span>
          <span className="shrink-0 text-[11px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-full border border-[#22c55e]/20">সম্পন্ন</span>
        </div>
        <div className="rounded-xl bg-white mt-3 p-4 shadow-lg">
          <p className="text-[14px] font-extrabold text-[#0f1729] mb-3">লেনদেনের বিবরণ</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-[#5b6784]">সময়</p>
              <p className="text-[12px] font-bold text-[#0f1729] mt-0.5">{new Date(result.time).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#5b6784]">ট্রানজেকশন আইডি</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[11px] font-bold text-[#0f1729] truncate">{result.trxId}</p>
                <button type="button" onClick={() => { navigator.clipboard.writeText(result.trxId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0">
                  <Copy size={14} className={copied ? "text-[#22c55e]" : "text-[#b0bdd0]"} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#5b6784]">সর্বমোট</p>
              <p className="text-[14px] font-extrabold text-[#0b3d91] mt-0.5">৳{result.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#5b6784]">নতুন ব্যালেন্স</p>
              <p className="text-[14px] font-extrabold text-[#0f1729] mt-0.5">৳{result.newBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pb-6 pt-2">
        <button type="button" onClick={onHome} className="w-full h-12 rounded-xl bg-white text-[#0b3d91] text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-lg"><Home size={18} /> রিচার্জ হোম</button>
      </div>
    </div>
  );
}
