"use client";

import { getStaffRechargePackages, requestStaffMobileRecharge } from "@/actions/staffRechargeActions";
import OperatorIcon, { OPERATOR_META } from "@/components/features/recharge/OperatorIcon";
import StaffRechargeHistory from "./StaffRechargeHistory";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Loader2, Package, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

/* Staff (technician / electrician) "রেগুলার প্যাক" flow. Mirrors the customer
   regular-pack UX (operator tabs → category → package → tap-to-confirm) but the
   pack is paid from the staff's available earnings balance via the shared
   requestStaffMobileRecharge action (packageId + packName passed through). No
   drive balance / KYC — regular packs only. */

const ACCENT = "#e84393";
const OPERATOR_KEYS = ["grameenphone", "banglalink", "robi", "airtel", "teletalk", "skitto"];

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type Pack = {
  id: string;
  name: string;
  amount: number;
  validity: string;
  detail: string;
  type?: string;
  raw: Record<string, unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const CATEGORIES: { key: string; label: string; match: (p: Pack) => boolean }[] = [
  { key: "all", label: "সব", match: () => true },
  { key: "bundle", label: "বান্ডেল", match: (p) => catKey(p) === "bundle" },
  { key: "data", label: "ডাটা", match: (p) => catKey(p) === "data" },
  { key: "voice", label: "ভয়েস", match: (p) => catKey(p) === "voice" },
  { key: "callrate", label: "কল রেট", match: (p) => catKey(p) === "callrate" },
];

type SuccessResult = {
  phone: string;
  operator: string;
  operatorKey: string;
  amount: number;
  trxId: string;
  newBalance: number;
  time: string;
  packName: string;
};

export default function StaffRegularPackFlow({ initialBalance }: { initialBalance: number }) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [operator, setOperator] = useState("grameenphone");
  const [category, setCategory] = useState("all");
  const [rechargePhone, setRechargePhone] = useState("");

  const [packages, setPackages] = useState<Pack[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [sheetPkg, setSheetPkg] = useState<Pack | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [insufficient, setInsufficient] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [rechargeCount, setRechargeCount] = useState(0);

  // Load packages for the selected operator (regular packs only).
  useEffect(() => {
    let active = true;
    setLoadingPkgs(true);
    getStaffRechargePackages(operator).then((res) => {
      if (!active) return;
      if (res.success && Array.isArray(res.data)) {
        const all = res.data.map(mapPack);
        // Show every pack that isn't a drive-only pack (the API doesn't reliably
        // tag packs "regular", so matching that exact value hid everything).
        setPackages(all.filter((p) => (p.type || "").toLowerCase() !== "drive"));
      } else {
        setPackages([]);
      }
      setLoadingPkgs(false);
    });
    return () => {
      active = false;
    };
  }, [operator]);

  const visiblePackages = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
    return packages.filter(cat.match);
  }, [packages, category]);

  const buyPack = async (pkg: Pack) => {
    if (!rechargePhone.trim()) return toast.error("রিচার্জ নম্বর দিন");
    if (!pkg.amount || pkg.amount < 10) return toast.error("অবৈধ প্যাকেজ");
    if (pkg.amount > balance) {
      setInsufficient(pkg.amount);
      return;
    }
    setSubmitting(true);
    const res = await requestStaffMobileRecharge({
      rechargePhone: rechargePhone.trim(),
      operator,
      amount: pkg.amount,
      packageId: pkg.id,
      packName: pkg.name,
    });
    setSubmitting(false);
    if (res.success && "detail" in res && res.detail) {
      setSuccess({ ...res.detail, packName: pkg.name });
      setRechargeCount((c) => c + 1);
      setBalance(res.detail.newBalance);
      setSheetPkg(null);
      router.refresh();
    } else if (!res.success && "code" in res && res.code === "insufficient") {
      setBalance(res.balance);
      setInsufficient(pkg.amount);
    } else {
      toast.error(res.message || "প্যাক কেনা যায়নি");
    }
  };

  const activeOpBn = OPERATOR_META[operator]?.labelBn || operator;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/staff/payment" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">রেগুলার প্যাক</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">আপনার ব্যালেন্স থেকে বান্ডেল কিনুন</span>
        </span>
      </div>

      {/* Balance banner */}
      <div className="rounded-md text-white p-3 flex items-center gap-3 bg-[linear-gradient(105deg,#9c1458,#e84393)] shadow-[0_8px_22px_rgba(156,20,88,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          <Package size={22} />
        </span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ব্যবহারযোগ্য ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">{bdt(balance)}</span>
        </span>
      </div>

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
          className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
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
              className={clsx("shrink-0 h-8 px-3 rounded-full border text-[11.5px] font-extrabold transition-colors", active ? "text-white" : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]")}
              style={active ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Package list */}
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
              <span className="shrink-0 text-[14px] font-extrabold" style={{ color: ACCENT }}>{bdt(pkg.amount)}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        প্যাক স্বয়ংক্রিয়ভাবে প্রক্রিয়া হবে এবং আপনার ব্যালেন্স থেকে কর্তন করা হবে।
      </p>

      <StaffRechargeHistory refreshKey={rechargeCount} />

      {/* Package confirm sheet */}
      {sheetPkg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => !submitting && setSheetPkg(null)}>
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 pb-8 flex flex-col gap-3 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-extrabold" style={{ color: ACCENT }}>রেগুলার প্যাক</p>
              <button type="button" onClick={() => !submitting && setSheetPkg(null)} className="size-8 rounded-full bg-[#f1f4f9] flex items-center justify-center"><X size={16} /></button>
            </div>

            <div className="rounded-md border border-[#dfe6f2] p-3 flex items-center gap-3">
              <OperatorIcon operatorKey={operator} size={38} />
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-extrabold text-[#0f1729]">{sheetPkg.name}</span>
                {(sheetPkg.detail || sheetPkg.validity) && (
                  <span className="text-[11px] font-semibold text-[#5b6784]">{sheetPkg.detail}{sheetPkg.validity ? ` · ${sheetPkg.validity}` : ""}</span>
                )}
              </span>
              <span className="text-[16px] font-extrabold" style={{ color: ACCENT }}>{bdt(sheetPkg.amount)}</span>
            </div>

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

            <div className="flex items-center justify-between text-[11.5px] font-bold">
              <span className="text-[#5b6784]">ব্যবহারযোগ্য ব্যালেন্স: <span className="text-[#0f1729]">{bdt(balance)}</span></span>
              {sheetPkg.amount > balance && <span className="text-[#c81f38]">ব্যালেন্স অপর্যাপ্ত</span>}
            </div>

            <button
              onClick={() => buyPack(sheetPkg)}
              disabled={submitting || !rechargePhone.trim()}
              className="w-full h-12 rounded-md text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(156,20,88,0.25)] disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
              {submitting ? "প্রক্রিয়া হচ্ছে..." : "প্যাক কিনুন"}
            </button>
          </div>
        </div>
      )}

      {/* Insufficient popup */}
      {insufficient !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5" onClick={() => setInsufficient(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="size-16 rounded-full bg-[#fdeaed] flex items-center justify-center">
              <AlertTriangle size={34} className="text-[#c81f38]" />
            </span>
            <p className="text-[18px] font-extrabold text-[#c81f38]">অপর্যাপ্ত ব্যালেন্স</p>
            <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">
              আপনি যে প্যাকটি কিনতে চাচ্ছেন, বর্তমানে আপনার ব্যালেন্সে পর্যাপ্ত নেই।
            </p>
            <div className="w-full rounded-md bg-[#f6f8fc] border border-[#e4e9f2] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#5b6784]">ব্যবহারযোগ্য ব্যালেন্স</span>
              <span className="text-[#0f1729]">{bdt(balance)}</span>
            </div>
            <div className="w-full rounded-md bg-[#fdeaed] border border-[#f7c3ca] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#c81f38]">প্রয়োজন</span>
              <span className="text-[#c81f38]">{bdt(insufficient)}</span>
            </div>
            <button type="button" onClick={() => setInsufficient(null)} className="w-full h-11 rounded-md text-[13px] font-extrabold border bg-white text-[#45506b] border-[#dfe6f2]">
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Success popup */}
      {success && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-gradient-to-b from-[#9c1458] to-[#e84393]">
          <div className="flex flex-col items-center pt-10 pb-6 px-4">
            <div className="size-20 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)]"><CheckCircle2 size={44} className="text-white" /></div>
            <p className="text-[22px] font-extrabold text-white mt-4">আপনার প্যাক</p>
            <p className="text-[20px] font-extrabold text-[#eaffef]">সফল হয়েছে</p>
          </div>
          <div className="flex-1 px-4 pb-4 overflow-auto">
            <div className="rounded-xl bg-white p-4 flex items-center gap-3 shadow-lg">
              <OperatorIcon operatorKey={success.operatorKey} size={48} shape="circle" />
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[15px] font-extrabold text-[#0f1729]">{success.operator}</span>
                <span className="text-[13px] font-semibold text-[#5b6784]">{success.phone}</span>
              </span>
              <span className="shrink-0 text-[11px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-full border border-[#22c55e]/20">সম্পন্ন</span>
            </div>
            <div className="rounded-xl bg-white mt-3 p-4 shadow-lg grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-[#5b6784]">প্যাকেজ</p>
                <p className="text-[13px] font-extrabold text-[#0f1729] mt-0.5">{success.packName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">ট্রানজেকশন আইডি</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[11px] font-bold text-[#0f1729] truncate">{success.trxId}</p>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(success.trxId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0">
                    <Copy size={14} className={copied ? "text-[#22c55e]" : "text-[#b0bdd0]"} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">সর্বমোট</p>
                <p className="text-[14px] font-extrabold" style={{ color: ACCENT }}>{bdt(success.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">নতুন ব্যালেন্স</p>
                <p className="text-[14px] font-extrabold text-[#0f1729] mt-0.5">{bdt(success.newBalance)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">সময়</p>
                <p className="text-[12px] font-bold text-[#0f1729] mt-0.5">{new Date(success.time).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-6 pt-2">
            <button type="button" onClick={() => setSuccess(null)} className="w-full h-12 rounded-xl bg-white text-[#9c1458] text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-lg">আরেকটি প্যাক</button>
          </div>
        </div>
      )}
    </div>
  );
}
