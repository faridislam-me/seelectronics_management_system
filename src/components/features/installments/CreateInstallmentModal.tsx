"use client";

import { createInstallmentPlan } from "@/actions/installmentActions";
import { searchCustomersForPurchase } from "@/actions/customerAdminActions";
import { installmentTermOptions, installmentChargePercent } from "@/constants";
import { toBanglaNumber } from "@/utils";
import { Modal } from "@/components/ui";
import { CheckCircle2, Loader2, Search, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type CustomerPick = {
  customerId: string;
  name: string;
  phone: string;
  address?: string | null;
};

const PRODUCT_TYPES = [
  { value: "", label: "— ধরন (optional) —" },
  { value: "ips", label: "IPS" },
  { value: "battery", label: "Battery" },
  { value: "stabilizer", label: "Stabilizer" },
  { value: "others", label: "Others" },
];

const num = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const bdt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function CreateInstallmentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Customer picker
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerPick[]>([]);
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerPick | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Plan fields
  const [productType, setProductType] = useState("");
  const [productModel, setProductModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [vaWatt, setVaWatt] = useState("");
  const [volt, setVolt] = useState("");
  const [displayType, setDisplayType] = useState("");
  const [cashPrice, setCashPrice] = useState("");
  const [extraCharge, setExtraCharge] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [months, setMonths] = useState("12");
  // extraCharge auto-follows the term's fixed 2%/month of cash price until the
  // admin edits the charge by hand.
  const [autoCharge, setAutoCharge] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");
  const [notes, setNotes] = useState("");

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await searchCustomersForPurchase(q.trim());
    setResults(res.success && Array.isArray(res.data) ? (res.data as CustomerPick[]) : []);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (customer) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, customer, runSearch]);

  // Live money preview (mirrors the server calculation)
  const totalPayable = num(cashPrice) + num(extraCharge);
  const financed = totalPayable - num(downPayment);
  const monthsN = parseInt(months) || 0;
  const monthly = monthsN > 0 && financed > 0 ? financed / monthsN : 0;

  // Keep extra charge in sync with the selected term (2%/month of cash price)
  // until the admin overrides it by typing a charge directly.
  useEffect(() => {
    if (!autoCharge) return;
    const auto = Math.round(num(cashPrice) * (installmentChargePercent(monthsN || 1) / 100) * 100) / 100;
    setExtraCharge(auto ? String(auto) : "");
  }, [cashPrice, monthsN, autoCharge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      toast.error("একজন কাস্টমার নির্বাচন করুন");
      return;
    }
    setLoading(true);
    const res = await createInstallmentPlan({
      customerId: customer.customerId,
      productType: productType || undefined,
      productModel,
      serialNumber,
      productBrand,
      vaWatt,
      volt,
      displayType,
      cashPrice,
      extraCharge: extraCharge || 0,
      downPayment: downPayment || 0,
      months,
      startDate,
      guarantorName,
      guarantorPhone,
      guarantorAddress,
      notes,
    });
    setLoading(false);
    if (res.success && "planCode" in res && res.planCode) {
      toast.success(res.message || "তৈরি হয়েছে");
      onClose();
      router.push(`/installments/${res.planCode}`);
      router.refresh();
    } else {
      toast.error(res.message || "তৈরি করা যায়নি");
    }
  };

  return (
    <Modal isVisible title="নতুন কিস্তি প্ল্যান" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
        {/* Customer */}
        {!customer ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">১. কাস্টমার নির্বাচন করুন</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="__input pl-9"
                placeholder="নাম / আইডি / ফোন দিয়ে খুঁজুন"
              />
            </div>
            {(searching || results.length > 0 || query.trim().length >= 2) && (
              <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-5 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> খুঁজছি...
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-5 text-center text-sm text-gray-400">কোনো কাস্টমার পাওয়া যায়নি</div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.customerId}
                      type="button"
                      onClick={() => {
                        setCustomer(c);
                        setResults([]);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="size-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <UserRound className="w-4 h-4 text-gray-400" />
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{c.name}</span>
                        <span className="text-xs text-gray-500 truncate">{c.customerId} · {c.phone}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 px-3 py-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="flex flex-col min-w-0">
              <span className="font-semibold truncate">{customer.name}</span>
              <span className="text-xs text-gray-500 truncate">{customer.customerId} · {customer.phone}</span>
            </span>
            <button type="button" onClick={() => setCustomer(null)} className="ml-auto p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-800/40" aria-label="Change">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {customer && (
          <>
            {/* Product */}
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 pt-1">২. পণ্যের তথ্য</label>
            <div className="flex gap-x-3">
              <select value={productType} onChange={(e) => setProductType(e.target.value)} className="__input">
                {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input value={productModel} onChange={(e) => setProductModel(e.target.value)} className="__input" placeholder="মডেল / পণ্যের নাম" required />
            </div>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="__input" placeholder="সিরিয়াল নম্বর (optional)" />
            {/* Sticker spec fields (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} className="__input" placeholder="ব্র্যান্ড (optional)" />
              <input value={vaWatt} onChange={(e) => setVaWatt(e.target.value)} className="__input" placeholder="VA / ওয়াট (optional)" />
              <input value={volt} onChange={(e) => setVolt(e.target.value)} className="__input" placeholder="ভোল্ট (optional)" />
              <input value={displayType} onChange={(e) => setDisplayType(e.target.value)} className="__input" placeholder="ডিসপ্লে (optional)" />
            </div>

            {/* Money */}
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 pt-1">৩. হিসাব</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" step="0.01" value={cashPrice} onChange={(e) => setCashPrice(e.target.value)} className="__input" placeholder="ক্যাশ দাম" required />
              <select value={months} onChange={(e) => setMonths(e.target.value)} className="__input" required>
                {installmentTermOptions.map((t) => (
                  <option key={t.months} value={t.months}>
                    {toBanglaNumber(t.months)} মাস ({toBanglaNumber(t.chargePercent)}% চার্জ)
                  </option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" value={extraCharge} onChange={(e) => { setAutoCharge(false); setExtraCharge(e.target.value); }} className="__input" placeholder="অতিরিক্ত চার্জ" />
              <input type="number" min="0" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="__input" placeholder="ডাউন পেমেন্ট" />
            </div>
            <label className="block text-xs font-semibold text-gray-500">কিস্তি শুরুর তারিখ</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="__input" required />

            {/* Preview */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-3 grid grid-cols-2 gap-y-1 gap-x-3 text-sm">
              <span className="text-gray-500">মোট (চার্জসহ):</span><b className="text-right">{bdt(totalPayable)}</b>
              <span className="text-gray-500">ডাউন পেমেন্ট:</span><b className="text-right">{bdt(num(downPayment))}</b>
              <span className="text-gray-500">কিস্তিতে ফাইন্যান্স:</span><b className="text-right">{bdt(financed)}</b>
              <span className="text-blue-700 dark:text-blue-300 font-semibold">মাসিক কিস্তি{monthsN ? ` × ${monthsN}` : ""}:</span>
              <b className="text-right text-blue-700 dark:text-blue-300">{monthly > 0 ? bdt(Math.round(monthly * 100) / 100) : "—"}</b>
            </div>

            {/* Guarantor */}
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 pt-1">৪. জামিনদার (optional)</label>
            <div className="flex gap-x-3">
              <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} className="__input" placeholder="জামিনদারের নাম" />
              <input value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} className="__input" placeholder="জামিনদারের ফোন" />
            </div>
            <input value={guarantorAddress} onChange={(e) => setGuarantorAddress(e.target.value)} className="__input" placeholder="জামিনদারের ঠিকানা" />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="__input" placeholder="নোট (optional)" />
          </>
        )}

        <div className="flex justify-end gap-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">বাতিল</button>
          <button disabled={loading || !customer} type="submit" className="__btn flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "তৈরি হচ্ছে..." : "প্ল্যান তৈরি করুন"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
