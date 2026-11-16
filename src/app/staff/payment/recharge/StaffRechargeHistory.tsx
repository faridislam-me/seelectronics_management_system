"use client";

import { getStaffRechargeHistory, type StaffRechargeHistoryRow } from "@/actions/staffRechargeActions";
import OperatorIcon from "@/components/features/recharge/OperatorIcon";
import clsx from "clsx";
import { History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42] border-[#b7ebc9]" },
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected: { label: "ব্যর্থ", cls: "bg-red-50 text-red-700 border-red-200" },
};

/**
 * "সাম্প্রতিক রিচার্জ" list for the staff recharge screens — mirrors the customer
 * recharge landing's recent list. `refreshKey` lets a parent flow force a reload
 * after a successful recharge.
 */
export default function StaffRechargeHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [rows, setRows] = useState<StaffRechargeHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getStaffRechargeHistory(10).then((res) => {
      if (!active) return;
      if (res.success && Array.isArray(res.data)) setRows(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#0b3d91]">
        <History size={15} /> সাম্প্রতিক রিচার্জ
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-5">
          <Loader2 className="size-5 animate-spin text-[#0b3d91]" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[11px] text-[#5b6784] py-4 text-center">কোনো রিচার্জ পাওয়া যায়নি</p>
      ) : (
        <div className="flex flex-col divide-y divide-[#eef2f9]">
          {rows.map((r) => {
            const sm = STATUS_META[r.status] || STATUS_META.completed;
            return (
              <div key={r.id} className="flex items-center gap-2.5 py-2.5">
                <OperatorIcon operatorKey={r.operatorKey} size={30} />
                <span className="flex flex-col leading-tight flex-1 min-w-0">
                  <span className="text-[12.5px] font-extrabold text-[#0f1729] font-mono">{r.phone || "—"}</span>
                  <span className="text-[10px] font-semibold text-[#5b6784] truncate">
                    {r.isPack ? `রেগুলার প্যাক${r.packName ? ` · ${r.packName}` : ""}` : "রিচার্জ"}
                    {r.operator ? ` · ${r.operator}` : ""}
                  </span>
                </span>
                <span className="flex flex-col items-end leading-tight shrink-0">
                  <span className="text-[13px] font-extrabold text-[#0b3d91]">৳{Number(r.amount).toLocaleString("en-US")}</span>
                  <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5", sm.cls)}>{sm.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
