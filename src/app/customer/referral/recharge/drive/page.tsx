"use client";

import { getMyDriveInfo } from "@/actions/driveBalanceActions";
import { getDrivePackages, requestMobileRecharge } from "@/actions/rechargeActions";
import OperatorIcon from "@/components/features/recharge/OperatorIcon";
import clsx from "clsx";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

// SuccessTopup-style operator tabs. Chips may be brand-colored (allowed by the
// list-card rule for operator identity), rendered as a colored badge — no
// external images are fetched.
const OPERATORS = [
  { key: "grameenphone", label: "GP", bn: "গ্রামীণফোন", color: "#00a550" },
  { key: "banglalink", label: "BL", bn: "বাংলালিংক", color: "#f7941d" },
  { key: "robi", label: "Robi", bn: "রবি", color: "#e2001a" },
  { key: "airtel", label: "Airtel", bn: "এয়ারটেল", color: "#e40000" },
  { key: "teletalk", label: "TT", bn: "টেলিটক", color: "#0066b3" },
  { key: "skitto", label: "skitto", bn: "স্কিটো", color: "#6c5ce7" },
];

// Category chips. Each has a matcher run against the (loose) pack fields.
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
  raw: Record<string, any>;
};

// Defensive field mapping: SuccessTopup drive items have an unstable shape, so
// we read whatever exists and fall back gracefully.
const mapPack = (d: any, i: number): Pack => {
  const amount = Number(d.amount ?? d.price ?? d.taka ?? d.tk ?? 0);
  return {
    id: String(d.package_id ?? d.packageId ?? d.id ?? d.code ?? `${amount}-${i}`),
    name: String(d.title ?? d.name ?? d.pack ?? (amount ? `৳${amount}` : "প্যাকেজ")),
    amount,
    validity: String(d.validity ?? d.duration ?? d.days ?? d.expiry ?? ""),
    detail: String(d.detail ?? d.description ?? d.desc ?? d.sms ?? ""),
    raw: d,
  };
};

// Best-effort category derivation from any type/category/title text.
function catKey(p: Pack): string {
  const hay = `${p.raw?.type ?? ""} ${p.raw?.category ?? ""} ${p.name} ${p.detail}`.toLowerCase();
  if (/(call ?rate|callrate|minute|মিনিট|কল)/.test(hay)) return "callrate";
  if (/(voice|ভয়েস|talktime|টকটাইম)/.test(hay)) return "voice";
  if (/(data|internet|ইন্টারনেট|ডাটা|gb|mb)/.test(hay)) return "data";
  if (/(bundle|combo|বান্ডেল|কম্বো)/.test(hay)) return "bundle";
  return "bundle";
}

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function DrivePacksPage() {
  const router = useRouter();

  const [info, setInfo] = useState<{
    driveBalance: number;
    kycStatus: "pending" | "approved" | "rejected";
    kyc: any;
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [operator, setOperator] = useState("grameenphone");
  const [category, setCategory] = useState("all");
  const [rechargePhone, setRechargePhone] = useState("");

  const [packages, setPackages] = useState<Pack[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const approved = info?.kycStatus === "approved";
  const balance = Number(info?.driveBalance ?? 0);

  const loadInfo = useCallback(async () => {
    const res = await getMyDriveInfo();
    if (res.success && "data" in res && res.data) {
      setInfo(res.data as any);
    }
    setLoadingInfo(false);
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  // Load packages for the selected operator only once KYC is approved.
  useEffect(() => {
    if (!approved) {
      setPackages([]);
      return;
    }
    let active = true;
    setLoadingPkgs(true);
    getDrivePackages(operator).then((res) => {
      if (!active) return;
      if (res.success && Array.isArray(res.data)) {
        setPackages(res.data.map(mapPack));
      } else {
        setPackages([]);
      }
      setLoadingPkgs(false);
    });
    return () => {
      active = false;
    };
  }, [operator, approved]);

  const visiblePackages = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
    return packages.filter(cat.match);
  }, [packages, category]);

  const handleBuy = async (pkg: Pack) => {
    if (!rechargePhone.trim()) return toast.error("রিচার্জ নম্বর দিন");
    if (pkg.amount < 10) return toast.error("অবৈধ প্যাকেজ মূল্য");
    if (pkg.amount > balance) return toast.error("ব্যালেন্স অপর্যাপ্ত");

    setBuyingId(pkg.id);
    const res = await requestMobileRecharge({
      rechargePhone: rechargePhone.trim(),
      operator,
      amount: pkg.amount,
      rechargeType: "drive_pack",
      packageId: pkg.id,
    });
    setBuyingId(null);

    if (res.success) {
      toast.success(res.message || "ড্রাইভ প্যাক কেনা হয়েছে ✓");
      await loadInfo(); // refresh drive balance
      router.refresh();
    } else {
      toast.error(res.message || "কেনা যায়নি");
    }
  };

  const activeOp = OPERATORS.find((o) => o.key === operator) || OPERATORS[0];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/customer/referral/recharge"
          className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">ড্রাইভ প্যাক</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">
            ড্রাইভ ব্যালেন্স থেকে বান্ডেল কিনুন
          </span>
        </span>
      </div>

      {/* Drive balance banner */}
      <div className="rounded-md bg-[linear-gradient(105deg,#00695c,#00b894)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(0,105,92,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          <Wallet size={22} />
        </span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ড্রাইভ ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">
            {loadingInfo ? "…" : `৳${balance.toLocaleString("en-IN")}`}
          </span>
        </span>
        {approved && (
          <span className="shrink-0 text-[10px] font-extrabold text-white bg-white/15 border border-white/25 px-2 py-1 rounded-full inline-flex items-center gap-1">
            <ShieldCheck size={12} /> অনুমোদিত
          </span>
        )}
      </div>

      {loadingInfo ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="size-6 animate-spin text-[#0b3d91]" />
        </div>
      ) : !approved ? (
        <KycGate info={info} />
      ) : (
        <>
          {/* Operator tabs */}
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <div className="grid grid-cols-6 gap-1.5">
              {OPERATORS.map((op) => {
                const active = operator === op.key;
                return (
                  <button
                    key={op.key}
                    type="button"
                    onClick={() => setOperator(op.key)}
                    className={clsx(
                      "flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all",
                      active ? "border-transparent" : "border-[#dfe6f2] bg-white hover:bg-[#f5f7fb]",
                    )}
                    style={active ? { backgroundColor: `${op.color}14`, borderColor: op.color } : undefined}
                  >
                    <OperatorIcon operatorKey={op.key} size={32} shape="circle" />
                    <span
                      className="text-[8.5px] font-bold leading-none text-center"
                      style={{ color: active ? op.color : "#5b6784" }}
                    >
                      {op.bn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharge phone input */}
          <div className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">রিচার্জ নম্বর *</label>
            <input
              value={rechargePhone}
              onChange={(e) => setRechargePhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={clsx(
                    "shrink-0 h-8 px-3 rounded-full border text-[11.5px] font-extrabold transition-colors",
                    active
                      ? "border-[#0b3d91] bg-[#0b3d91] text-white"
                      : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Package list */}
          {loadingPkgs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-[#0b3d91]" />
            </div>
          ) : visiblePackages.length === 0 ? (
            <div className="rounded-md bg-white border border-[#dfe6f2] p-6 text-center">
              <Package size={28} className="mx-auto text-[#b0bdd0]" />
              <p className="text-[12px] font-semibold text-[#5b6784] mt-2">
                {activeOp.bn}-এ এই ক্যাটাগরিতে কোনো প্যাকেজ পাওয়া যায়নি
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visiblePackages.map((pkg) => {
                const insufficient = pkg.amount > balance;
                const busy = buyingId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_2px_8px_rgba(11,61,145,0.05)]"
                  >
                    <span className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13px] font-extrabold text-[#0f1729] truncate">{pkg.name}</span>
                      {(pkg.detail || pkg.validity) && (
                        <span className="text-[10.5px] font-semibold text-[#5b6784] truncate">
                          {pkg.detail}
                          {pkg.validity ? ` · ${pkg.validity}` : ""}
                        </span>
                      )}
                      <span className="text-[13px] font-extrabold text-[#00695c] mt-0.5">{bdt(pkg.amount)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBuy(pkg)}
                      disabled={busy || insufficient || !!buyingId}
                      className={clsx(
                        "shrink-0 h-9 px-3.5 rounded-md text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors",
                        insufficient
                          ? "bg-[#f1f4f9] text-[#9aa7bd] cursor-not-allowed"
                          : "bg-[#00695c] text-white hover:bg-[#00574c] disabled:opacity-60",
                      )}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : insufficient ? (
                        "ব্যালেন্স অপর্যাপ্ত"
                      ) : (
                        <>
                          <CheckCircle2 size={14} /> কিনুন
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-center text-[#5b6784] px-4">
            ড্রাইভ প্যাক কেনা হলে আপনার ড্রাইভ ব্যালেন্স থেকে মূল্য কর্তন করা হবে।
          </p>
        </>
      )}
    </>
  );
}

function KycGate({ info }: { info: { kycStatus: string; kyc: any } | null }) {
  const status = info?.kycStatus;
  const kyc = info?.kyc;

  if (status === "pending" && kyc) {
    return (
      <div className="rounded-md bg-white border border-amber-200 p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <span className="size-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Clock size={24} className="text-amber-600" />
        </span>
        <p className="text-[14px] font-extrabold text-[#0f1729]">
          আপনার ড্রাইভ KYC রিভিউ এর অপেক্ষায়
        </p>
        <p className="text-[11.5px] font-semibold text-[#5b6784]">
          অ্যাডমিন অনুমোদনের পর আপনি ড্রাইভ প্যাক কিনতে পারবেন।
        </p>
        {kyc?.requestCode && (
          <span className="text-[10px] font-bold font-mono text-[#5b6784] bg-[#f1f4f9] px-2 py-0.5 rounded">
            {kyc.requestCode}
          </span>
        )}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-md bg-white border border-red-200 p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <span className="size-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <XCircle size={24} className="text-red-600" />
        </span>
        <p className="text-[14px] font-extrabold text-[#0f1729]">ড্রাইভ KYC প্রত্যাখ্যাত হয়েছে</p>
        {kyc?.rejectReason && (
          <p className="text-[11.5px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
            কারণ: {kyc.rejectReason}
          </p>
        )}
        <Link
          href="/customer/referral/recharge/drive/kyc"
          className="mt-1 h-10 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)]"
        >
          আবার জমা দিন
        </Link>
      </div>
    );
  }

  // No approval yet and no pending request → prompt to start KYC.
  return (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-4 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <span className="size-12 rounded-full bg-[#e8f1ff] border border-[#0b3d91]/15 flex items-center justify-center">
        <ShieldAlert size={24} className="text-[#0b3d91]" />
      </span>
      <p className="text-[14px] font-extrabold text-[#0f1729]">ড্রাইভ প্যাক লক করা আছে</p>
      <p className="text-[11.5px] font-semibold text-[#5b6784]">
        ড্রাইভ ব্যালেন্স আনলক করতে একবার KYC সম্পন্ন করুন।
      </p>
      <Link
        href="/customer/referral/recharge/drive/kyc"
        className="mt-1 h-10 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)]"
      >
        <ShieldCheck size={16} /> ড্রাইভ KYC করুন
      </Link>
    </div>
  );
}
