"use client";

import { requestMobileRecharge, getDrivePackages } from "@/actions/rechargeActions";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Gift, History, Loader2, Package, Smartphone, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useReferral } from "../_components/ReferralProvider";

const RECHARGE_TYPES = [
  { value: "recharge", label: "রিচার্জ", icon: Smartphone, color: "bg-[#0b3d91]" },
  { value: "regular_pack", label: "রেগুলার প্যাক", icon: Gift, color: "bg-[#e84393]" },
  { value: "drive_pack", label: "ড্রাইভ প্যাক", icon: Package, color: "bg-[#00b894]" },
  { value: "drive_offer", label: "ড্রাইভ অফার", icon: Zap, color: "bg-[#f39c12]" },
];

const OPERATORS = [
  { value: "grameenphone", label: "Grameenphone", color: "text-[#00a550]" },
  { value: "banglalink", label: "Banglalink", color: "text-[#f7941d]" },
  { value: "robi", label: "Robi", color: "text-[#e2001a]" },
  { value: "airtel", label: "Airtel", color: "text-[#e40000]" },
  { value: "teletalk", label: "Teletalk", color: "text-[#0066b3]" },
  { value: "skitto", label: "Skitto", color: "text-[#6c5ce7]" },
];

type DrivePackage = { id: string; name: string; amount: number; description?: string; validity?: string };

export default function MobileRechargePage() {
  const router = useRouter();
  const { data } = useReferral();
  const balance = Number(data.balance || 0);

  const [rechargeType, setRechargeType] = useState("recharge");
  const [rechargePhone, setRechargePhone] = useState("");
  const [operator, setOperator] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<DrivePackage[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<DrivePackage | null>(null);

  const isPackageType = rechargeType !== "recharge";

  useEffect(() => {
    if (!isPackageType || !operator) { setPackages([]); setSelectedPkg(null); return; }
    setLoadingPkgs(true);
    setSelectedPkg(null);
    getDrivePackages(operator).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const type = rechargeType === "regular_pack" ? "regular" : "drive";
        const filtered = res.data.filter((d: any) =>
          rechargeType === "drive_offer" ? true : (d.type === type || !d.type),
        );
        setPackages(filtered.map((d: any) => ({
          id: d.id || d.package_id || String(d.amount),
          name: d.name || d.title || `${d.amount} Tk`,
          amount: Number(d.amount || d.price || 0),
          description: d.description || d.detail || "",
          validity: d.validity || "",
        })));
      } else {
        setPackages([]);
      }
      setLoadingPkgs(false);
    });
  }, [operator, rechargeType, isPackageType]);

  const handleSubmit = async () => {
    if (!rechargePhone.trim()) { toast.error("রিচার্জ নম্বর দিন"); return; }
    if (!operator) { toast.error("অপারেটর নির্বাচন করুন"); return; }

    let amt: number;
    let pkgId: string | undefined;

    if (isPackageType) {
      if (!selectedPkg) { toast.error("একটি প্যাকেজ নির্বাচন করুন"); return; }
      amt = selectedPkg.amount;
      pkgId = selectedPkg.id;
    } else {
      amt = Number(amount);
      if (!amt || amt < 10) { toast.error("ন্যূনতম ৳১০"); return; }
    }

    if (amt > balance) { toast.error("অপর্যাপ্ত ব্যালেন্স"); return; }

    setLoading(true);
    const res = await requestMobileRecharge({
      rechargePhone: rechargePhone.trim(),
      operator,
      amount: amt,
      rechargeType,
      packageId: pkgId,
    });
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setRechargePhone("");
      setOperator("");
      setAmount("");
      setSelectedPkg(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const selectedType = RECHARGE_TYPES.find((t) => t.value === rechargeType) || RECHARGE_TYPES[0];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/referral" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">মোবাইল রিচার্জ</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">রেফারেল ব্যালেন্স থেকে ইনস্ট্যান্ট রিচার্জ</span>
        </span>
        <Link href="/customer/referral/recharge/history" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <History size={18} className="text-[#5b6784]" />
        </Link>
      </div>

      {/* Balance banner */}
      <div className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Smartphone size={22} /></span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ব্যবহারযোগ্য ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">৳{balance.toLocaleString("en-IN")}</span>
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-4 gap-2">
        {RECHARGE_TYPES.map((rt) => {
          const Icon = rt.icon;
          const active = rechargeType === rt.value;
          return (
            <button
              key={rt.value}
              type="button"
              onClick={() => { setRechargeType(rt.value); setSelectedPkg(null); }}
              className={clsx(
                "flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all",
                active
                  ? "border-[#0b3d91] bg-[#e8f1ff] shadow-[0_4px_12px_rgba(11,61,145,0.15)]"
                  : "border-[#dfe6f2] bg-white hover:bg-[#f5f7fb]",
              )}
            >
              <span className={clsx("size-10 rounded-lg flex items-center justify-center text-white", rt.color)}>
                <Icon size={20} />
              </span>
              <span className={clsx("text-[10.5px] font-extrabold leading-tight text-center", active ? "text-[#0b3d91]" : "text-[#5b6784]")}>
                {rt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#0b3d91]">
          <selectedType.icon size={16} /> {selectedType.label}
        </p>

        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">রিচার্জ নম্বর *</label>
          <input
            value={rechargePhone}
            onChange={(e) => setRechargePhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">অপারেটর *</label>
          <div className="grid grid-cols-3 gap-1.5">
            {OPERATORS.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setOperator(op.value)}
                className={clsx(
                  "h-9 rounded-md border text-[11px] font-extrabold transition-colors",
                  operator === op.value
                    ? "border-[#0b3d91] bg-[#e8f1ff] text-[#0b3d91]"
                    : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]",
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Package list or amount input */}
        {isPackageType ? (
          <div>
            <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">প্যাকেজ নির্বাচন করুন *</label>
            {!operator ? (
              <p className="text-[11px] text-[#5b6784] py-3 text-center">প্রথমে অপারেটর নির্বাচন করুন</p>
            ) : loadingPkgs ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="size-5 animate-spin text-[#0b3d91]" /></div>
            ) : packages.length === 0 ? (
              <p className="text-[11px] text-[#5b6784] py-3 text-center">কোনো প্যাকেজ পাওয়া যায়নি</p>
            ) : (
              <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={clsx(
                      "w-full text-left rounded-md border p-2.5 transition-colors",
                      selectedPkg?.id === pkg.id
                        ? "border-[#0b3d91] bg-[#e8f1ff]"
                        : "border-[#dfe6f2] bg-white hover:bg-[#f5f7fb]",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-[12px] font-extrabold">{pkg.name}</span>
                      <span className="text-[13px] font-extrabold text-[#0b3d91]">৳{pkg.amount}</span>
                    </span>
                    {(pkg.description || pkg.validity) && (
                      <span className="text-[10px] text-[#5b6784] mt-0.5 block">
                        {pkg.description}{pkg.validity ? ` · ${pkg.validity}` : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedPkg && (
              <div className="mt-2 rounded-md bg-[#e8f1ff] border border-[#0b3d91]/20 p-2 text-center">
                <span className="text-[12px] font-extrabold text-[#0b3d91]">{selectedPkg.name} — ৳{selectedPkg.amount}</span>
              </div>
            )}
          </div>
        ) : (
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
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
          {loading ? "রিচার্জ হচ্ছে..." : isPackageType ? `${selectedType.label} কিনুন` : "ইনস্ট্যান্ট রিচার্জ"}
        </button>
      </div>

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        রিচার্জ স্বয়ংক্রিয়ভাবে প্রক্রিয়া হবে এবং ব্যালেন্স কর্তন করা হবে।
      </p>
    </>
  );
}
