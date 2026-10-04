"use client";

import { deleteSupplier, setSupplierActive } from "@/actions/supplierActions";
import clsx from "clsx";
import { ChevronRight, Plus, Search, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import SupplierFormModal from "./SupplierFormModal";

export type SupplierRow = {
  supplierId: string;
  name: string;
  shopName: string;
  phone: string;
  origin: string | null;
  isActive: boolean;
  purchased: number;
  paid: number;
  due: number;
};

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;

export default function SuppliersClient({ rows, query }: { rows: SupplierRow[]; query: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  /** Deleting removes the supplier and every ledger entry: ask twice when there is money involved. */
  const remove = async (r: SupplierRow) => {
    const hasLedger = r.purchased > 0 || r.paid > 0;
    if (!confirm(`"${r.name}" (${r.shopName}) কে মুছে ফেলবেন?${hasLedger ? `\nতার সব হিসাব মুছে যাবে (মাল ${taka(r.purchased)}, পরিশোধ ${taka(r.paid)}) এবং আর ফেরত আনা যাবে না।` : ""}`)) return;
    if (r.due > 0 && !confirm(`এই সাপ্লায়ারের বাকি পাওনা ${taka(r.due)} আছে। তবুও মুছে ফেলবেন?`)) return;
    const res = await deleteSupplier(r.supplierId);
    if (!res.success) return void toast.error(res.message);
    toast.success("সাপ্লায়ার মুছে ফেলা হয়েছে");
    router.refresh();
  };
  const totals = rows.reduce((a, r) => ({ purchased: a.purchased + r.purchased, paid: a.paid + r.paid, due: a.due + r.due }), { purchased: 0, paid: 0, due: 0 });

  const toggle = async (r: SupplierRow) => {
    const res = await setSupplierActive(r.supplierId, !r.isActive);
    if (!res.success) return void toast.error(res.message);
    toast.success(res.message);
    router.refresh();
  };

  return (
    <div className="flex-1 overflow-auto flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Truck size={22} className="text-[#1f7cf0]" />Suppliers</h1>
        <div className="flex items-center gap-2">
          <form action="/suppliers" className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5b6784]" />
            <input name="q" defaultValue={query} placeholder="Search name, shop, mobile..." className="h-10 w-[240px] rounded-md border border-[#d9e2f0] bg-white pl-8 pr-2.5 text-[14px] outline-none focus:border-[#1f7cf0]" />
          </form>
          <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-md bg-[#0b3d91] text-white font-bold inline-flex items-center gap-1.5"><Plus size={17} />Add Supplier</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Total Purchased", totals.purchased, "text-[#16213a]"],
          ["Total Paid", totals.paid, "text-[#178a42]"],
          ["Total Due", totals.due, "text-[#c81f38]"],
        ].map(([k, v, c]) => (
          <div key={k as string} className="rounded-md bg-white border border-[#dfe6f2] p-3">
            <div className="text-[12px] font-semibold text-[#5b6784]">{k}</div>
            <div className={clsx("text-[18px] font-extrabold", c as string)}>{taka(v as number)}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center text-[#5b6784]">No suppliers yet. Click “Add Supplier”.</div>
      ) : (
        <div className="rounded-md bg-white border border-[#dfe6f2] overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#f5f8fd] text-[#5b6784] text-[12px] uppercase">
              <tr>
                <th className="text-left px-3 py-2">Supplier</th>
                <th className="text-left px-3 py-2">Mobile</th>
                <th className="text-left px-3 py-2">From</th>
                <th className="text-right px-3 py-2">Purchased</th>
                <th className="text-right px-3 py-2">Paid</th>
                <th className="text-right px-3 py-2">Due</th>
                <th className="text-center px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.supplierId} className="border-t border-[#eef1f6] hover:bg-[#fafcff]">
                  <td className="px-3 py-2">
                    <Link href={`/suppliers/${r.supplierId}`} className="font-bold text-[#0b3d91] hover:underline">{r.name}</Link>
                    <div className="text-[12px] text-[#5b6784]">{r.shopName} · {r.supplierId}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.phone}</td>
                  <td className="px-3 py-2">{r.origin || "—"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{taka(r.purchased)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-[#178a42]">{taka(r.paid)}</td>
                  <td className={clsx("px-3 py-2 text-right whitespace-nowrap font-extrabold", r.due > 0 ? "text-[#c81f38]" : "text-[#178a42]")}>{taka(r.due)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => toggle(r)} className={clsx("h-7 px-2.5 rounded-md text-[11px] font-extrabold", r.isActive ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>{r.isActive ? "ACTIVE" : "INACTIVE"}</button>
                  </td>
                  <td className="px-3 py-2 text-right"><button onClick={() => remove(r)} className="mr-3 text-[#c81f38] align-middle" aria-label={`Delete ${r.name}`} title="Delete supplier"><Trash2 size={16} /></button><Link href={`/suppliers/${r.supplierId}`} className="inline-flex items-center gap-1 text-[#1f7cf0] font-bold whitespace-nowrap">Ledger<ChevronRight size={15} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <SupplierFormModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
