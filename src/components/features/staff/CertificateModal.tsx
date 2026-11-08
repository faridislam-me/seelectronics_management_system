"use client";

import { getStaffs, sendCertificateLink } from "@/actions/staffActions";
import { Modal } from "@/components/ui";
import { CheckCircle2, Loader2, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type StaffPick = {
  staffId: string;
  name: string;
  phone: string;
  role: "technician" | "electrician";
  currentDistrict?: string | null;
  currentStreetAddress?: string | null;
  photoUrl?: string | null;
};

type CertForm = {
  memberNumber: string;
  phone: string;
  address: string;
  district: string;
  shopName: string;
  ownerName: string;
  shopId: string;
};

const EMPTY_FORM: CertForm = {
  memberNumber: "",
  phone: "",
  address: "",
  district: "",
  shopName: "",
  ownerName: "",
  shopId: "",
};

export default function CertificateModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  // Staff picker state — selecting a real staff is what binds the certificate
  // to their in-app account (otherwise it only goes out as an SMS link).
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StaffPick[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StaffPick | null>(null);
  const [form, setForm] = useState<CertForm>(EMPTY_FORM);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    const res = await getStaffs({ query: q, limit: "8" });
    if (res.success && Array.isArray(res.data)) {
      setResults(
        res.data.map((s: any) => ({
          staffId: s.staffId,
          name: s.name,
          phone: s.phone,
          role: s.role,
          currentDistrict: s.currentDistrict,
          currentStreetAddress: s.currentStreetAddress,
          photoUrl: s.photoUrl,
        })),
      );
    } else {
      setResults([]);
    }
    setSearching(false);
  }, []);

  // Debounced search whenever the query changes and no staff is selected yet.
  useEffect(() => {
    if (selected) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(query.trim()), 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, selected, runSearch]);

  const pickStaff = (s: StaffPick) => {
    setSelected(s);
    setResults([]);
    setQuery("");
    // Pre-fill the certificate fields from the selected staff; admin can still edit.
    setForm({
      memberNumber: s.staffId,
      phone: s.phone || "",
      address: s.currentStreetAddress || "",
      district: s.currentDistrict || "",
      shopName: s.name || "",
      ownerName: s.name || "",
      shopId: s.staffId,
    });
  };

  const clearStaff = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
  };

  const set = (k: keyof CertForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) {
      toast.error("অনুগ্রহ করে একজন টেকনিশিয়ান/ইলেকট্রিশিয়ান নির্বাচন করুন");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("staffId", selected.staffId);
    formData.append("memberNumber", form.memberNumber);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    formData.append("district", form.district);
    formData.append("shopName", form.shopName);
    formData.append("ownerName", form.ownerName);
    formData.append("shopId", form.shopId);

    const res = await sendCertificateLink(formData);
    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Modal isVisible title="Send Certificate" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Step 1 — select the staff member the certificate belongs to */}
        {!selected ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              ১. কাকে সার্টিফিকেট দিবেন নির্বাচন করুন
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="__input pl-9"
                placeholder="নাম / আইডি / ফোন দিয়ে খুঁজুন"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> খুঁজছি...
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  {query.trim() ? "কোনো স্টাফ পাওয়া যায়নি" : "খুঁজতে টাইপ করুন"}
                </div>
              ) : (
                results.map((s) => (
                  <button
                    key={s.staffId}
                    type="button"
                    onClick={() => pickStaff(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="relative size-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {s.photoUrl ? (
                        <Image src={s.photoUrl} alt={s.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <UserRound className="w-5 h-5 text-gray-400" />
                      )}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="font-semibold truncate">{s.name}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {s.staffId} · {s.phone}
                      </span>
                    </span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                      {s.role === "technician" ? "টেকনিশিয়ান" : "ইলেকট্রিশিয়ান"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 px-3 py-2">
            <span className="relative size-10 rounded-full overflow-hidden bg-white flex items-center justify-center shrink-0">
              {selected.photoUrl ? (
                <Image src={selected.photoUrl} alt={selected.name} fill sizes="40px" className="object-cover" />
              ) : (
                <UserRound className="w-5 h-5 text-gray-400" />
              )}
            </span>
            <span className="flex flex-col min-w-0">
              <span className="font-semibold truncate flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {selected.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {selected.staffId} · {selected.phone} · সার্টিফিকেট তার অ্যাকাউন্টে যাবে
              </span>
            </span>
            <button
              type="button"
              onClick={clearStaff}
              className="ml-auto p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors shrink-0"
              aria-label="Change staff"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — certificate content (pre-filled, editable) */}
        {selected && (
          <>
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 pt-1">
              ২. সার্টিফিকেটের তথ্য (প্রয়োজনে এডিট করুন)
            </label>
            <div className="flex gap-x-3">
              <input type="text" value={form.memberNumber} onChange={set("memberNumber")} className="__input" placeholder="Member Number (e.g. SE001)" required />
              <input type="text" value={form.phone} onChange={set("phone")} className="__input" placeholder="Phone Number" required />
            </div>
            <div className="flex gap-x-3">
              <input type="text" value={form.address} onChange={set("address")} className="__input" placeholder="Address" required />
              <input type="text" value={form.district} onChange={set("district")} className="__input" placeholder="District" required />
            </div>
            <div className="flex gap-x-3">
              <input type="text" value={form.shopName} onChange={set("shopName")} className="__input" placeholder="Name on Certificate" required />
              <input type="text" value={form.ownerName} onChange={set("ownerName")} className="__input" placeholder="Owner / Full Name" required />
            </div>
            <div className="grid grid-cols-1">
              <input type="text" value={form.shopId} onChange={set("shopId")} className="__input" placeholder="ID" required />
            </div>
          </>
        )}

        <div className="flex justify-end gap-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            disabled={loading || !selected}
            type="submit"
            className="__btn flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
