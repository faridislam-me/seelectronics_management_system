"use client";

import { mergeCustomerGroup, type DuplicateGroup } from "@/actions/customerMergeActions";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const tk = (n: number) => `৳${(n || 0).toLocaleString()}`;
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

export default function CustomerMergeClient({ groups }: { groups: DuplicateGroup[] }) {
  const router = useRouter();
  // primary customerId per group phone; excluded (not-to-merge) ids per group phone
  const [primary, setPrimary] = useState<Record<string, string>>(
    () => Object.fromEntries(groups.map((g) => [g.phone, g.customers[0]?.customerId])),
  );
  const [excluded, setExcluded] = useState<Record<string, Set<string>>>({});
  const [confirmPhone, setConfirmPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState<string | null>(null);

  const isExcluded = (phone: string, id: string) => excluded[phone]?.has(id) ?? false;
  const toggleExclude = (phone: string, id: string) =>
    setExcluded((prev) => {
      const set = new Set(prev[phone] ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [phone]: set };
    });

  const mergeIdsFor = (g: DuplicateGroup) =>
    g.customers.filter((c) => c.customerId !== primary[g.phone] && !isExcluded(g.phone, c.customerId)).map((c) => c.customerId);

  const confirmGroup = groups.find((g) => g.phone === confirmPhone);
  const primaryCustomer = confirmGroup?.customers.find((c) => c.customerId === primary[confirmGroup.phone]);
  const confirmMergeCount = confirmGroup ? mergeIdsFor(confirmGroup).length : 0;

  const doMerge = async () => {
    if (!confirmGroup) return;
    const primaryId = primary[confirmGroup.phone];
    const ids = mergeIdsFor(confirmGroup);
    if (!primaryId || ids.length === 0) {
      setConfirmPhone(null);
      return;
    }
    setLoadingPhone(confirmGroup.phone);
    const res = await mergeCustomerGroup(primaryId, ids);
    setLoadingPhone(null);
    setConfirmPhone(null);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="__card p-10 text-center text-gray-500">
        <p className="text-lg font-semibold text-gray-700">কোনো ডুপ্লিকেট কাস্টমার পাওয়া যায়নি 🎉</p>
        <p className="mt-1 text-sm">একই ফোন নাম্বারে একাধিক অ্যাকাউন্ট থাকলে এখানে দেখা যাবে।</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        একই ফোন নাম্বারে <b>{groups.length}</b> জন কাস্টমারের একাধিক অ্যাকাউন্ট আছে। প্রতিটি গ্রুপে যেটা রাখতে চান সেটা{" "}
        <b>প্রাইমারি</b> সিলেক্ট করুন — বাকিগুলোর সব ইনভয়েস, প্রোডাক্ট ও সার্ভিস ওই এক অ্যাকাউন্টে চলে আসবে, বাকি অ্যাকাউন্ট মুছে যাবে।
      </div>

      {groups.map((g) => {
        const mergeCount = mergeIdsFor(g).length;
        return (
          <div key={g.phone} className="__card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <div className="font-semibold text-gray-700">
                📞 {g.customers[0]?.phone}{" "}
                <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                  {g.customers.length} অ্যাকাউন্ট
                </span>
              </div>
              <button
                onClick={() => setConfirmPhone(g.phone)}
                disabled={mergeCount === 0 || loadingPhone === g.phone}
                className="__btn !py-2 !px-4 !text-sm disabled:cursor-not-allowed"
              >
                {loadingPhone === g.phone ? "মার্জ হচ্ছে…" : `মার্জ করুন (${mergeCount})`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white text-xs uppercase text-gray-500">
                    <th className="px-3 py-2 font-bold">প্রাইমারি</th>
                    <th className="px-3 py-2 font-bold">মার্জ</th>
                    <th className="px-3 py-2 font-bold">নাম</th>
                    <th className="px-3 py-2 font-bold">কাস্টমার আইডি</th>
                    <th className="px-3 py-2 font-bold text-center">কেনা</th>
                    <th className="px-3 py-2 font-bold text-center">পণ্য</th>
                    <th className="px-3 py-2 font-bold text-right">মোট বিল</th>
                    <th className="px-3 py-2 font-bold text-right">বাকি</th>
                    <th className="px-3 py-2 font-bold">VIP</th>
                    <th className="px-3 py-2 font-bold">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {g.customers.map((c) => {
                    const isPrimary = primary[g.phone] === c.customerId;
                    const willMerge = !isPrimary && !isExcluded(g.phone, c.customerId);
                    return (
                      <tr
                        key={c.customerId}
                        className={`border-t border-gray-100 ${isPrimary ? "bg-brand/5" : willMerge ? "" : "opacity-50"}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name={`primary-${g.phone}`}
                            checked={isPrimary}
                            onChange={() => setPrimary((p) => ({ ...p, [g.phone]: c.customerId }))}
                            className="size-4 accent-[var(--brand,#0b3d91)]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {isPrimary ? (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">থাকবে</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={willMerge}
                              onChange={() => toggleExclude(g.phone, c.customerId)}
                              className="size-4 accent-rose-600"
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-gray-800">{c.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-600">{c.customerId}</td>
                        <td className="px-3 py-2 text-center">{c.invoiceCount}</td>
                        <td className="px-3 py-2 text-center">{c.productCount}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{tk(c.totalBill)}</td>
                        <td className={`whitespace-nowrap px-3 py-2 text-right ${c.totalDue > 0 ? "font-bold text-rose-600" : "text-gray-400"}`}>
                          {tk(c.totalDue)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">{c.vipCardNumber ? "⭐ VIP" : "—"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{fmtDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <Modal title="মার্জ নিশ্চিত করুন" isVisible={!!confirmPhone} onClose={() => setConfirmPhone(null)} width="500">
        {confirmGroup && primaryCustomer && (
          <div className="flex flex-col gap-4 py-1">
            <p className="text-sm leading-relaxed text-gray-700">
              <b>{confirmMergeCount}টি</b> অ্যাকাউন্টের সব ইনভয়েস, প্রোডাক্ট, সার্ভিস ও রেফারেল{" "}
              <b className="text-brand">{primaryCustomer.name}</b> (
              <span className="font-mono text-xs">{primaryCustomer.customerId}</span>) অ্যাকাউন্টে চলে আসবে।
            </p>
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              মার্জ করা অ্যাকাউন্টগুলো <b>স্থায়ীভাবে মুছে</b> যাবে। এটি ফিরিয়ে আনা যাবে না।
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmPhone(null)}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                onClick={doMerge}
                disabled={loadingPhone === confirmGroup.phone}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {loadingPhone === confirmGroup.phone ? "মার্জ হচ্ছে…" : "হ্যাঁ, মার্জ করুন"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
