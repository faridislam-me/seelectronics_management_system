import { InstallmentReceiptTemplateData } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate } from "@/utils";

const tk = (n: number | null | undefined) =>
  n == null ? "—" : `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const METHOD_LABEL: Record<string, string> = {
  cash: "অফিসে নগদ",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "ব্যাংক",
};

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className={accent ? "text-[14px] font-black text-[#0b3d91]" : "text-[14px] font-black text-gray-900"}>{value}</p>
    </div>
  );
}

export default function InstallmentReceiptTemplate({
  data,
}: {
  data: InstallmentReceiptTemplateData;
}) {
  return (
    <div
      className="w-[794px] mx-auto bg-white text-gray-900 px-10 py-8"
      style={{ fontFamily: "'SolaimanLipi', 'Tiro Bangla', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0b3d91] pb-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {data.logo ? <img src={data.logo} alt="SE Electronics" className="h-14 w-14 object-contain" /> : null}
          <div className="leading-tight">
            <div className="text-[20px] font-extrabold text-[#0b3d91]">SE Electronics</div>
            <div className="text-[12px] font-semibold text-gray-500">কিস্তি পেমেন্ট রসিদ (Payment Receipt)</div>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[13px] font-extrabold text-gray-900">{data.planCode}</div>
          <div className="text-[11px] font-semibold text-gray-500">
            তারিখ: {formatDate(data.generatedAt as any)}
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        <div className="flex">
          <span className="w-[38%] shrink-0 font-semibold text-gray-500">গ্রাহক</span>
          <span className="flex-1 font-bold text-gray-900">{data.customerName || "—"}</span>
        </div>
        <div className="flex">
          <span className="w-[38%] shrink-0 font-semibold text-gray-500">গ্রাহক আইডি</span>
          <span className="flex-1 font-bold text-gray-900">{data.customerId || "—"}</span>
        </div>
        <div className="flex">
          <span className="w-[38%] shrink-0 font-semibold text-gray-500">মোবাইল</span>
          <span className="flex-1 font-bold text-gray-900">{data.customerPhone || "—"}</span>
        </div>
        <div className="flex">
          <span className="w-[38%] shrink-0 font-semibold text-gray-500">পণ্য</span>
          <span className="flex-1 font-bold text-gray-900">
            {data.productModel}
            {data.productType ? ` (${data.productType})` : ""}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-4 gap-2.5">
        <SummaryCell label="কিস্তিতে ফাইন্যান্স" value={tk(data.financedAmount)} />
        <SummaryCell label="মাসিক কিস্তি" value={tk(data.monthlyAmount)} />
        <SummaryCell label="পরিশোধিত" value={`${data.paidCount}/${data.months} · ${tk(data.paidTotal)}`} accent />
        <SummaryCell label="বাকি" value={`${data.remainingCount} · ${tk(data.remainingTotal)}`} />
      </div>

      {/* Paid installments table */}
      <div className="mt-4 bg-[#0b3d91] text-white text-[13px] font-extrabold px-3 py-1.5 rounded-md">
        পরিশোধিত কিস্তিসমূহ (Paid Installments)
      </div>
      <table className="mt-2 w-full text-[12px] border border-gray-200">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left font-semibold px-3 py-2 border-b border-gray-200">#</th>
            <th className="text-left font-semibold px-3 py-2 border-b border-gray-200">পরিশোধের তারিখ</th>
            <th className="text-left font-semibold px-3 py-2 border-b border-gray-200">মেথড</th>
            <th className="text-left font-semibold px-3 py-2 border-b border-gray-200">নম্বর / TxID</th>
            <th className="text-right font-semibold px-3 py-2 border-b border-gray-200">পরিমাণ</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-gray-400 font-semibold">
                এখনো কোনো কিস্তি পরিশোধিত হয়নি।
              </td>
            </tr>
          ) : (
            data.rows.map((r) => (
              <tr key={r.installmentNo} className="border-b border-gray-100">
                <td className="px-3 py-2 font-bold text-gray-700">{r.installmentNo}</td>
                <td className="px-3 py-2 text-gray-700">{r.paidAt ? formatDate(r.paidAt as any) : "—"}</td>
                <td className="px-3 py-2 text-gray-700">
                  {r.paymentMethod ? METHOD_LABEL[r.paymentMethod] || r.paymentMethod : "—"}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {r.paymentNumber ? <div>{r.paymentNumber}</div> : null}
                  {r.transactionId ? <div className="text-[11px] text-gray-500">TxID: {r.transactionId}</div> : null}
                  {!r.paymentNumber && !r.transactionId ? "—" : null}
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">{tk(r.paidAmount || r.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
        {data.rows.length > 0 && (
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={4} className="px-3 py-2 text-right font-extrabold text-gray-700">
                মোট পরিশোধিত
              </td>
              <td className="px-3 py-2 text-right font-black text-[#0b3d91]">{tk(data.paidTotal)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {/* Seals & signature */}
      {data.documentSeal || data.chairmanSeal || data.chairmanSign ? (
        <div className="mt-8 flex items-end justify-between">
          {/* Left: official round seal */}
          <div className="flex w-[45%] flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {data.documentSeal ? (
              <img
                src={data.documentSeal}
                alt="অফিসিয়াল সিল"
                className="h-[80px] w-[80px] object-contain"
              />
            ) : (
              <div className="h-[80px]" />
            )}
            <div className="mt-1 border-t border-gray-300 pt-1 text-[11px] font-semibold text-gray-500">
              অফিসিয়াল সিল
            </div>
          </div>

          {/* Right: chairman seal + signature */}
          <div className="flex w-[45%] flex-col items-center">
            <div className="flex h-[80px] items-end justify-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {data.chairmanSign ? (
                <img
                  src={data.chairmanSign}
                  alt="চেয়ারম্যান স্বাক্ষর"
                  className="h-[55px] w-[90px] object-contain"
                />
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {data.chairmanSeal ? (
                <img
                  src={data.chairmanSeal}
                  alt="চেয়ারম্যান সিল"
                  className="h-[80px] w-[80px] object-contain"
                />
              ) : null}
            </div>
            <div className="mt-1 border-t border-gray-300 pt-1 text-[11px] font-semibold text-[#0b3d91]">
              চেয়ারম্যান — স্বাক্ষর ও সিল
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-[10px] font-semibold text-gray-400">
        <span>SE Electronics — কিস্তি পেমেন্ট রসিদ</span>
        <span>তৈরি: {formatDate(data.generatedAt as any)}</span>
      </div>
    </div>
  );
}
