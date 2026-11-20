import { InstallmentInvoiceTemplateData, InstallmentScheduleRow } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate, toBanglaNumber } from "@/utils";

/** Money as Bangla numerals with a ৳ suffix, e.g. 30000 → "৩০,০০০৳". */
const bdt = (n: number) =>
  `${toBanglaNumber(Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }))}৳`;

/** Date in Bangla numerals, keeping the short English month, e.g. "Jan ১, ২০২৬". */
const bnDate = (d: Date | string | number) => toBanglaNumber(formatDate(d));

const NAVY = "#0b3d91";

interface PlanGroup {
  from: number;
  to: number;
  count: number;
  amount: number;
  total: number;
}

// Contiguous equal-amount installments collapse into one line so even a
// 24-month plan prints as one or two compact rows.
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

/**
 * Official SE Electronics কিস্তি INVOICE.
 *
 * Instead of reconstructing the letterhead in HTML, this renders the exact
 * company pad image supplied by the client (`installment-invoice-pad.jpeg`,
 * 1131×1600, A4 portrait) as a full-page background — the header, round office
 * seal, watermark emblem, নোট section, manager + chairman signatures, the
 * customer-app QR/barcode and the purple footer bar are ALL baked into that
 * image. This template only overlays the dynamic invoice data (title, customer
 * + plan meta, product table, installment plan & money summary, guarantor) onto
 * the empty middle region. Rendered by puppeteer.
 */
export default function InstallmentInvoiceTemplate({
  data,
}: {
  data: InstallmentInvoiceTemplateData;
}) {
  const groups = groupSchedule(data.schedule, { months: data.months, monthlyAmount: data.monthlyAmount });
  const totalInstallments = data.schedule.length || data.months;
  const mainMonthly = groups[0]?.amount ?? data.monthlyAmount;
  const lastRow = [...data.schedule].sort((a, b) => a.installmentNo - b.installmentNo).at(-1);
  const differingLast =
    lastRow && lastRow.amount !== mainMonthly
      ? { no: lastRow.installmentNo, amount: lastRow.amount }
      : null;

  const productName = [data.productBrand, data.productModel].filter(Boolean).join(" ");
  const specBits = [
    data.vaWatt ? `VA/W: ${data.vaWatt}` : "",
    data.volt ? `Volt: ${data.volt}` : "",
    data.displayType ? `Display: ${data.displayType}` : "",
  ].filter(Boolean);

  const TotalLine = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className="flex justify-between gap-6 text-[12.5px] leading-[22px]">
      <span className={bold ? "font-bold" : "font-semibold"}>{label} :</span>
      <span className={bold ? "font-bold" : ""} style={bold ? { color: NAVY } : undefined}>{value}</span>
    </div>
  );

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white overflow-hidden"
      // Match the customer invoice: Inter first so English/Latin text renders in
      // Inter (not a Bangla font's Latin glyphs); Bangla falls back to Tiro
      // Bangla / SolaimanLipi.
      style={{ fontFamily: `Inter, 'Tiro Bangla', SolaimanLipi, sans-serif`, color: "#15223b" }}
    >
      {/* ───── The official company pad as the full-page background ───── */}
      {data.padBg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.padBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "fill" }} />
      ) : null}

      {/* ───── Title: plain text (no fill box), like the customer invoice ───── */}
      <div className="absolute left-0 right-0 text-center" style={{ top: "13.2%" }}>
        <span className="text-[17px] font-black tracking-wide" style={{ color: NAVY }}>
          কিস্তি ইনভয়েস · INSTALLMENT INVOICE
        </span>
      </div>

      {/* ───── Dynamic invoice body — pushed a bit lower so the customer/product
          block clears the round seal baked into the pad at top-left. ───── */}
      <div className="absolute" style={{ top: "21%", left: "5.4%", right: "5.4%" }}>
        {/* Customer + plan meta */}
        <div className="flex justify-between text-[12.5px] gap-6">
          <div className="space-y-[2px]">
            <div className="font-extrabold text-[13px] mb-0.5" style={{ color: NAVY }}>গ্রাহকের তথ্য</div>
            <div><span className="font-bold">নাম :</span> {data.customerName}</div>
            {data.customerAddress && (
              <div><span className="font-bold">ঠিকানা :</span> {data.customerAddress}</div>
            )}
            <div><span className="font-bold">মোবাইল :</span> {data.customerPhone}</div>
            <div><span className="font-bold">গ্রাহক আইডি :</span> {data.customerId}</div>
          </div>
          <div className="text-right space-y-[2px] shrink-0">
            <div><span className="font-bold">প্ল্যান কোড #</span> {data.planCode}</div>
            <div><span className="font-bold">তারিখ :</span> {bnDate(data.startDate)}</div>
            <div><span className="font-bold">স্ট্যাটাস :</span> {data.status.toUpperCase()}</div>
          </div>
        </div>

        {/* Product table */}
        <table className="w-full border-collapse mt-3">
          <thead>
            <tr className="border border-black" style={{ background: "#e8dae9" }}>
              <th className="text-left py-[6px] px-2 font-bold text-[12.5px] border-r border-black w-5">নং</th>
              <th className="text-left py-[6px] px-2 font-bold text-[12.5px] border-r border-black">পণ্যের বিবরণ (Product)</th>
              <th className="text-left py-[6px] px-2 font-bold text-[12.5px] border-r border-black">ক্যাটাগরি</th>
              <th className="text-left py-[6px] px-2 font-bold text-[12.5px] border-r border-black">সাইজ / ক্ষমতা</th>
              <th className="text-center py-[6px] px-2 font-bold text-[12.5px] border-r border-black">মেয়াদ</th>
              <th className="text-right py-[6px] px-2 font-bold text-[12.5px] border-black whitespace-nowrap">মূল্য</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border border-black align-top">
              <td className="py-[6px] px-2 text-[12.5px] border-r border-black">১.</td>
              <td className="py-[6px] px-2 text-[12.5px] border-r border-black">
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
              <td className="py-[6px] px-2 text-[12.5px] border-r border-black">{data.productType || "—"}</td>
              <td className="py-[6px] px-2 text-[12.5px] border-r border-black">{data.productSpec || "—"}</td>
              <td className="py-[6px] px-2 text-[12.5px] text-center border-r border-black whitespace-nowrap">
                {toBanglaNumber(data.months)} মাস
              </td>
              <td className="py-[6px] px-2 text-[12.5px] text-right border-black whitespace-nowrap font-semibold">
                {bdt(data.cashPrice)}
              </td>
            </tr>

            {/* Plan + money summary row */}
            <tr>
              <td colSpan={6} className="py-2 px-3 border border-black">
                <div className="flex justify-between items-start gap-10">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold mb-1" style={{ color: NAVY }}>কিস্তি পরিকল্পনা</div>
                    {/* All lines one size + one deep color (no green/red/grey mix). */}
                    <div className="space-y-1 text-[12px]" style={{ color: "#15223b" }}>
                      <div>
                        মোট <span className="font-bold">{toBanglaNumber(totalInstallments)}টি</span>{" "}
                        মাসিক কিস্তি · প্রতি মাসে <span className="font-semibold">{bdt(mainMonthly)}</span>
                      </div>
                      {differingLast && (
                        <div>
                          (শেষ কিস্তি #{toBanglaNumber(differingLast.no)}:{" "}
                          <span className="font-semibold">{bdt(differingLast.amount)}</span>)
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">মেয়াদ:</span> {bnDate(data.startDate)} → {bnDate(data.endDate)}
                      </div>
                      <div>
                        <span className="font-semibold">পরিশোধিত:</span>{" "}
                        <span className="font-bold">{bdt(data.paidTotal)}</span>{" "}
                        ({toBanglaNumber(data.paidCount)}টি) · <span className="font-semibold">বাকি:</span>{" "}
                        <span className="font-bold">{bdt(data.remainingTotal)}</span>
                      </div>
                    </div>
                  </div>
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
          <div className="mt-2 text-[11.5px] text-slate-700">
            <span className="font-semibold">জামিনদার (Guarantor):</span> {data.guarantorName}
            {data.guarantorPhone ? ` · ${data.guarantorPhone}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
