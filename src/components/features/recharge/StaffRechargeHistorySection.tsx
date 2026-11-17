import { getStaffRechargeHistoryForAdmin } from "@/actions/staffRechargeActions";
import { formatDate } from "@/utils";
import clsx from "clsx";
import OperatorIcon, { OPERATOR_META } from "./OperatorIcon";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "সম্পন্ন", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "ব্যর্থ", cls: "bg-red-50 text-red-700 border-red-200" },
};

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/**
 * Admin-only, read-only list of a staff member's mobile recharges (and packs),
 * shown under the staff payment-history table. Recharges are stored as
 * `[RECHARGE]` payment rows and surfaced via getStaffRechargeHistoryForAdmin.
 */
export default async function StaffRechargeHistorySection({ staffId }: { staffId: string }) {
  const res = await getStaffRechargeHistoryForAdmin(staffId);
  const rows = res.success ? res.data : [];

  return (
    <div className="bg-white rounded-md border border-gray-100 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">রিচার্জ হিস্ট্রি</h2>
        <p className="text-xs text-gray-400">এই স্টাফের মোবাইল রিচার্জ ও প্যাকের তালিকা</p>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">অপারেটর</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">রিচার্জ নম্বর</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap text-right">পরিমাণ</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">সময়</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap text-center">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 font-medium">
                  কোনো রিচার্জ নেই
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const sm = STATUS_META[r.status] || STATUS_META.pending;
                const opLabel = OPERATOR_META[r.operatorKey]?.labelBn || r.operator;
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <OperatorIcon operatorKey={r.operatorKey} size={26} />
                        <div>
                          <p className="font-semibold text-gray-800">{opLabel}</p>
                          {r.isPack && r.packName && (
                            <p className="text-[11px] font-bold text-indigo-600">প্যাক: {r.packName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{r.phone || "—"}</td>
                    <td className="py-3 px-4 text-right font-bold">{bdt(r.amount)}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={clsx(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                          sm.cls,
                        )}
                      >
                        {sm.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
