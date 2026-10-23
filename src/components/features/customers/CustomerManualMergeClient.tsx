"use client";

import {
  mergeCustomersManual,
  searchCustomersForMerge,
  type DuplicateCustomer,
} from "@/actions/customerMergeActions";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const tk = (n: number) => `৳${(n || 0).toLocaleString()}`;
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

/**
 * Manual merge: search any customers (by name / id / phone / address) and merge
 * the selected accounts into one — even when the phone numbers differ (a buyer who
 * also bought under relatives' numbers). The auto duplicate-group tool below only
 * catches same-phone duplicates, so this covers everything that one cannot.
 */
export default function CustomerManualMergeClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DuplicateCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  // selected accounts, keyed by customerId, in the order they were added
  const [selected, setSelected] = useState<DuplicateCustomer[]>([]);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);
  const reqId = useRef(0);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const myId = ++reqId.current;
    const t = setTimeout(async () => {
      const res = await searchCustomersForMerge(q);
      if (myId !== reqId.current) return; // a newer search superseded this one
      setSearching(false);
      if (res.success) setResults(res.data);
      else toast.error(res.message);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const isSelected = (id: string) => selected.some((c) => c.customerId === id);

  const addCustomer = (c: DuplicateCustomer) => {
    if (isSelected(c.customerId)) return;
    setSelected((prev) => {
      const next = [...prev, c];
      // First one added becomes the default primary.
      if (!primaryId) setPrimaryId(c.customerId);
      return next;
    });
  };

  const removeCustomer = (id: string) => {
    setSelected((prev) => {
      const next = prev.filter((c) => c.customerId !== id);
      if (primaryId === id) setPrimaryId(next[0]?.customerId ?? "");
      return next;
    });
  };

  const primaryCustomer = selected.find((c) => c.customerId === primaryId);
  const mergeIds = selected.filter((c) => c.customerId !== primaryId).map((c) => c.customerId);

  const doMerge = async () => {
    if (!primaryId || mergeIds.length === 0) {
      setConfirming(false);
      return;
    }
    setMerging(true);
    const res = await mergeCustomersManual(primaryId, mergeIds);
    setMerging(false);
    setConfirming(false);
    if (res.success) {
      toast.success(res.message);
      setSelected([]);
      setPrimaryId("");
      setQuery("");
      setResults([]);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="__card overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h2 className="font-semibold text-gray-700">🔗 ম্যানুয়াল মার্জ — যেকোনো অ্যাকাউন্ট এক করুন</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          নাম / কাস্টমার আইডি / ফোন / ঠিকানা দিয়ে খুঁজে একজনের নিজের ও আত্মীয়দের (ভিন্ন নম্বরের) অ্যাকাউন্টগুলো সিলেক্ট করে এক অ্যাকাউন্টে আনুন।
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Search */}
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, কাস্টমার আইডি, ফোন নম্বর বা ঠিকানা লিখুন…"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-gray-100">
              {searching ? (
                <p className="px-3 py-4 text-center text-sm text-gray-400">খোঁজা হচ্ছে…</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gray-400">কোনো কাস্টমার পাওয়া যায়নি</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <tbody>
                    {results.map((c) => {
                      const added = isSelected(c.customerId);
                      return (
                        <tr key={c.customerId} className="border-t border-gray-50 first:border-t-0">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-gray-800">{c.name}</div>
                            <div className="text-xs text-gray-500">
                              <span className="font-mono">{c.customerId}</span> · 📞 {c.phone}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-center text-xs text-gray-500">
                            {c.invoiceCount} কেনা · {c.productCount} পণ্য
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            <button
                              onClick={() => addCustomer(c)}
                              disabled={added}
                              className="rounded-md border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                            >
                              {added ? "✓ যোগ হয়েছে" : "+ যোগ করুন"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Selected tray */}
        {selected.length > 0 && (
          <div className="rounded-md border border-gray-100">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-3 py-2">
              <span className="text-sm font-semibold text-gray-700">
                সিলেক্ট করা অ্যাকাউন্ট <span className="text-gray-400">({selected.length})</span>
              </span>
              <button
                onClick={() => setConfirming(true)}
                disabled={mergeIds.length === 0 || merging}
                className="__btn !py-2 !px-4 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {merging ? "মার্জ হচ্ছে…" : `এক অ্যাকাউন্টে মার্জ করুন (${mergeIds.length})`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white text-xs uppercase text-gray-500">
                    <th className="px-3 py-2 font-bold">প্রাইমারি</th>
                    <th className="px-3 py-2 font-bold">নাম</th>
                    <th className="px-3 py-2 font-bold">কাস্টমার আইডি</th>
                    <th className="px-3 py-2 font-bold">ফোন</th>
                    <th className="px-3 py-2 font-bold text-center">কেনা</th>
                    <th className="px-3 py-2 font-bold text-center">পণ্য</th>
                    <th className="px-3 py-2 font-bold text-right">মোট বিল</th>
                    <th className="px-3 py-2 font-bold">VIP</th>
                    <th className="px-3 py-2 font-bold text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((c) => {
                    const isPrimary = primaryId === c.customerId;
                    return (
                      <tr
                        key={c.customerId}
                        className={`border-t border-gray-100 ${isPrimary ? "bg-brand/5" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="manual-primary"
                              checked={isPrimary}
                              onChange={() => setPrimaryId(c.customerId)}
                              className="size-4 accent-[var(--brand,#0b3d91)]"
                            />
                            {isPrimary && (
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                                থাকবে
                              </span>
                            )}
                          </label>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-gray-800">{c.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-600">{c.customerId}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">{c.phone}</td>
                        <td className="px-3 py-2 text-center">{c.invoiceCount}</td>
                        <td className="px-3 py-2 text-center">{c.productCount}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{tk(c.totalBill)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{c.vipCardNumber ? "⭐ VIP" : "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button
                            onClick={() => removeCustomer(c.customerId)}
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            বাদ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal title="মার্জ নিশ্চিত করুন" isVisible={confirming} onClose={() => setConfirming(false)} width="600">
        {primaryCustomer && (
          <div className="flex flex-col gap-4 py-1">
            <p className="text-sm leading-relaxed text-gray-700">
              <b>{mergeIds.length}টি</b> অ্যাকাউন্টের সব ইনভয়েস, প্রোডাক্ট, সার্ভিস ও রেফারেল{" "}
              <b className="text-brand">{primaryCustomer.name}</b> (
              <span className="font-mono text-xs">{primaryCustomer.customerId}</span> · 📞 {primaryCustomer.phone})
              অ্যাকাউন্টে চলে আসবে।
            </p>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              এই অ্যাকাউন্টগুলোর ফোন নম্বর আলাদা হতে পারে — মার্জ করার আগে নিশ্চিত হয়ে নিন এগুলো সত্যিই একই মানুষের/পরিবারের।
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              মার্জ করা অ্যাকাউন্টগুলো <b>স্থায়ীভাবে মুছে</b> যাবে। এটি ফিরিয়ে আনা যাবে না।
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={doMerge}
                disabled={merging}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {merging ? "মার্জ হচ্ছে…" : "হ্যাঁ, মার্জ করুন"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
