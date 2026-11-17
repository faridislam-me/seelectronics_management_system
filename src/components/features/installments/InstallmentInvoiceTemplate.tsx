import { InstallmentInvoiceTemplateData, InstallmentScheduleRow } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate, toBanglaNumber } from "@/utils";

/** Money as Bangla numerals with a ৳ suffix, e.g. 30000 → "৩০,০০০৳". */
const bdt = (n: number) =>
  `${toBanglaNumber(Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }))}৳`;

/** Date in Bangla numerals, keeping the short English month, e.g. "Jan ১, ২০২৬". */
const bnDate = (d: Date | string | number) => toBanglaNumber(formatDate(d));

interface PlanGroup {
  from: number;
  to: number;
  count: number;
  amount: number;
  total: number;
}

// Contiguous equal-amount installments collapse into one "কিস্তি X–Y" line so
// even a 24-month plan prints as one or two compact rows (this is an agreement,
// so no per-month paid/due tracking).
function groupSchedule(
  rows: InstallmentScheduleRow[],
  fallback: { months: number; monthlyAmount: number },
): PlanGroup[] {
  if (!rows.length) {
    if (!fallback.months) return [];
    return [
      {
        from: 1,
        to: fallback.months,
        count: fallback.months,
        amount: fallback.monthlyAmount,
        total: fallback.monthlyAmount * fallback.months,
      },
    ];
  }
  const ordered = [...rows].sort((a, b) => a.installmentNo - b.installmentNo);
  const groups: PlanGroup[] = [];
  for (const r of ordered) {
    const last = groups[groups.length - 1];
    if (last && last.amount === r.amount && r.installmentNo === last.to + 1) {
      last.to = r.installmentNo;
      last.count += 1;
      last.total += r.amount;
    } else {
      groups.push({ from: r.installmentNo, to: r.installmentNo, count: 1, amount: r.amount, total: r.amount });
    }
  }
  return groups;
}

export default function InstallmentInvoiceTemplate({
  data,
}: {
  data: InstallmentInvoiceTemplateData;
}) {
  const groups = groupSchedule(data.schedule, { months: data.months, monthlyAmount: data.monthlyAmount });

  // Clear plain summary instead of the confusing "কিস্তি ১–১১ / কিস্তি ১২" ranges:
  // total count + the regular monthly amount, and only if the final installment
  // differs (rounding remainder) we note it separately.
  const totalInstallments = data.schedule.length || data.months;
  const mainMonthly = groups[0]?.amount ?? data.monthlyAmount;
  const lastRow = [...data.schedule].sort((a, b) => a.installmentNo - b.installmentNo).at(-1);
  const differingLast =
    lastRow && lastRow.amount !== mainMonthly
      ? { no: lastRow.installmentNo, amount: lastRow.amount }
      : null;

  const productName = [data.productBrand, data.productModel].filter(Boolean).join(" ");
  // Extra electrical specs, shown only when present.
  const specBits = [
    data.vaWatt ? `VA/W: ${data.vaWatt}` : "",
    data.volt ? `Volt: ${data.volt}` : "",
    data.displayType ? `Display: ${data.displayType}` : "",
  ].filter(Boolean);

  // Totals block, mirroring the normal invoice's right-aligned summary.
  const TotalLine = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className="flex justify-between gap-8 text-[13px] leading-6">
      <span className={bold ? "font-bold" : "font-semibold"}>{label} :</span>
      <span className={bold ? "font-bold text-[#0b3d91]" : ""}>{value}</span>
    </div>
  );

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white bg-center bg-no-repeat bg-cover overflow-hidden"
      style={{
        backgroundImage: `url(${data.bgImage})`,
        fontFamily: `Inter, 'Tiro Bangla', SolaimanLipi, sans-serif`,
      }}
    >
      <div className="absolute top-[200px] left-[40px] right-[40px]">
        {/* Title */}
        <div className="text-right text-xl font-bold tracking-wide mb-4">
          INSTALLMENT INVOICE
          <span className="block text-xs font-semibold text-slate-600">কিস্তি চুক্তিপত্র</span>
        </div>

        {/* Invoice-to + plan meta (same two-column header as the normal invoice) */}
        <div className="flex justify-between mb-4 text-sm">
          <div className="space-y-1">
            <div className="font-semibold text-lg">Invoice To</div>
            <div><span className="font-semibold">Name :</span> {data.customerName}</div>
            {data.customerAddress && (
              <div><span className="font-semibold">Address :</span> {data.customerAddress}</div>
            )}
            <div><span className="font-semibold">Phone :</span> {data.customerPhone}</div>
          </div>
          <div className="text-right space-y-1">
            <div><span className="font-semibold">Plan Code #</span> {data.planCode}</div>
            <div><span className="font-semibold">Date :</span> {formatDate(data.startDate)}</div>
            <div><span className="font-semibold">Customer ID :</span> {data.customerId}</div>
            <div><span className="font-semibold">Status :</span> {data.status.toUpperCase()}</div>
          </div>
        </div>

        {/* Product details table — reads like a normal product invoice row */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border border-black bg-[#D7E6F5]">
              <th className="text-left py-2 px-2 font-bold text-[13px] border-r border-black w-5">No</th>
              <th className="text-left py-2 px-2 font-bold text-[13px] border-r border-black">পণ্যের বিবরণ (Product)</th>
              <th className="text-left py-2 px-2 font-bold text-[13px] border-r border-black">ক্যাটাগরি</th>
              <th className="text-left py-2 px-2 font-bold text-[13px] border-r border-black">সাইজ / ক্ষমতা</th>
              <th className="text-center py-2 px-2 font-bold text-[13px] border-r border-black">মেয়াদ</th>
              <th className="text-right py-2 px-2 font-bold text-[13px] border-black whitespace-nowrap">মূল্য</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-black align-top">
              <td className="py-2 px-2 text-[13px] border-r border-black">১.</td>
              <td className="py-2 px-2 text-[13px] border-r border-black">
                <div className="flex items-start gap-2">
                  {data.productImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.productImage}
                      alt={productName}
                      className="w-12 h-12 object-contain shrink-0 rounded border border-slate-200 bg-white"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold break-words">{productName}</div>
                    {data.serialNumber && <div className="text-[11px]">S/N: {data.serialNumber}</div>}
                    {specBits.length > 0 && (
                      <div className="text-[11px] text-slate-600">{specBits.join(" · ")}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-2 px-2 text-[13px] border-r border-black">{data.productType || "—"}</td>
              <td className="py-2 px-2 text-[13px] border-r border-black">{data.productSpec || "—"}</td>
              <td className="py-2 px-2 text-[13px] text-center border-r border-black whitespace-nowrap">
                {toBanglaNumber(data.months)} মাস
              </td>
              <td className="py-2 px-2 text-[13px] text-right border-black whitespace-nowrap font-semibold">
                {bdt(data.cashPrice)}
              </td>
            </tr>

            {/* Totals row, like the normal invoice's summary cell */}
            <tr>
              <td colSpan={6} className="py-2 px-3 border border-black">
                <div className="flex justify-between items-start gap-10">
                  {/* Installment plan range summary on the left */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold mb-1">কিস্তি পরিকল্পনা</div>
                    <div className="space-y-1">
                      <div className="text-[12px]">
                        মোট{" "}
                        <span className="font-bold text-[#0b3d91]">
                          {toBanglaNumber(totalInstallments)}টি
                        </span>{" "}
                        মাসিক কিস্তি · প্রতি মাসে{" "}
                        <span className="font-semibold">{bdt(mainMonthly)}</span>
                      </div>
                      {differingLast && (
                        <div className="text-[12px] text-slate-600">
                          (শেষ কিস্তি #{toBanglaNumber(differingLast.no)}:{" "}
                          <span className="font-semibold">{bdt(differingLast.amount)}</span>)
                        </div>
                      )}
                      <div className="text-[12px] text-slate-600">
                        <span className="font-semibold">মেয়াদ:</span> {bnDate(data.startDate)} → {bnDate(data.endDate)}
                      </div>
                    </div>
                  </div>
                  {/* Money totals on the right */}
                  <div className="shrink-0 min-w-[42%]">
                    <TotalLine label="প্রোডাক্টের দাম" value={bdt(data.cashPrice)} />
                    <TotalLine label="এক্সট্রা চার্জ" value={bdt(data.extraCharge)} />
                    <TotalLine label="মোট (চার্জসহ)" value={bdt(data.totalPayable)} />
                    <TotalLine label="ডাউন পেমেন্ট" value={bdt(data.downPayment)} />
                    <TotalLine label="কিস্তিতে ফাইন্যান্স" value={bdt(data.financedAmount)} />
                    <TotalLine
                      label={`মাসিক কিস্তি (${toBanglaNumber(data.months)} মাস)`}
                      value={bdt(data.monthlyAmount)}
                      bold
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {(data.guarantorName || data.guarantorPhone) && (
          <div className="mt-3 text-[11px] text-slate-700">
            <span className="font-semibold">জামিনদার (Guarantor):</span> {data.guarantorName}
            {data.guarantorPhone ? ` · ${data.guarantorPhone}` : ""}
          </div>
        )}
        {data.notes && <div className="mt-0.5 text-[10px] text-slate-500">{data.notes}</div>}
      </div>
    </div>
  );
}
