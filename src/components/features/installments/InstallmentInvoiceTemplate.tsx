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

// The letterhead background keeps a baked footer (customer-care note box + seal /
// signatures) starting around y=680px on the A4 render, so the content column
// (which begins at y=185px) must finish above it. The per-installment schedule
// table used to be the thing that could overflow on long plans; it is now
// collapsed into a few range rows (contiguous equal-amount installments share a
// single line), so even a 24-month plan prints as one or two compact lines —
// this is a "কিস্তি চুক্তিপত্র" (agreement), so no per-month paid/due tracking is shown.
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
      groups.push({
        from: r.installmentNo,
        to: r.installmentNo,
        count: 1,
        amount: r.amount,
        total: r.amount,
      });
    }
  }
  return groups;
}

export default function InstallmentInvoiceTemplate({
  data,
}: {
  data: InstallmentInvoiceTemplateData;
}) {
  const groups = groupSchedule(data.schedule, {
    months: data.months,
    monthlyAmount: data.monthlyAmount,
  });

  const MoneyCell = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-3 py-0.5 border-b border-slate-200 text-[12px] leading-tight">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-[#0b3d91]">{value}</span>
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
      <div className="absolute top-[185px] left-[40px] right-[40px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-left">
            <div className="text-lg font-bold tracking-wide leading-tight">
              INSTALLMENT INVOICE
            </div>
            <div className="text-xs text-slate-500">কিস্তি চুক্তিপত্র</div>
          </div>
          <div className="text-right text-xs">
            <div>
              <span className="font-semibold">Plan Code #</span> {data.planCode}
            </div>
            <div>
              <span className="font-semibold">Status :</span>{" "}
              {data.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Customer + product */}
        <div className="flex justify-between gap-6 mb-3 text-[11px]">
          <div className="space-y-0.5">
            <div className="font-semibold text-sm mb-0.5">Customer</div>
            <div>
              <span className="font-semibold">Name :</span> {data.customerName}
            </div>
            <div>
              <span className="font-semibold">Phone :</span> {data.customerPhone}
            </div>
            {data.customerAddress && (
              <div>
                <span className="font-semibold">Address :</span>{" "}
                {data.customerAddress}
              </div>
            )}
            <div>
              <span className="font-semibold">Customer ID :</span>{" "}
              {data.customerId}
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="font-semibold text-sm mb-0.5">Product</div>
            <div>
              <span className="font-semibold">Model :</span> {data.productModel}
            </div>
            {data.productType && (
              <div>
                <span className="font-semibold">Type :</span> {data.productType}
              </div>
            )}
            {data.serialNumber && (
              <div>
                <span className="font-semibold">Serial :</span>{" "}
                {data.serialNumber}
              </div>
            )}
          </div>
        </div>

        {/* Money breakdown (no paid/due tracking — this is an agreement) */}
        <div className="grid grid-cols-2 gap-x-10 mb-3">
          <div>
            <MoneyCell label="প্রোডাক্টের দাম" value={bdt(data.cashPrice)} />
            <MoneyCell label="এক্সট্রা চার্জ" value={bdt(data.extraCharge)} />
            <MoneyCell label="মোট" value={bdt(data.totalPayable)} />
          </div>
          <div>
            <MoneyCell label="ডাউন পেমেন্ট" value={bdt(data.downPayment)} />
            <MoneyCell label="ফাইন্যান্সড" value={bdt(data.financedAmount)} />
            <MoneyCell
              label={`প্রতি মাসে কিস্তি (${toBanglaNumber(data.months)} মাস)`}
              value={bdt(data.monthlyAmount)}
            />
          </div>
        </div>

        {/* Installment plan — range summary, not a per-month table */}
        <div className="text-sm font-bold mb-1">কিস্তি পরিকল্পনা</div>
        <div className="space-y-1 text-[12px]">
          {groups.map((g, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border border-slate-300 rounded px-3 py-1.5 bg-[#F4F8FD]"
            >
              <span className="font-bold text-[#0b3d91]">
                কিস্তি {toBanglaNumber(g.from)}
                {g.to !== g.from ? `–${toBanglaNumber(g.to)}` : ""}
              </span>
              <span className="text-slate-400">·</span>
              <span>
                প্রতি মাসে{" "}
                <span className="font-semibold">{bdt(g.amount)}</span>
              </span>
              <span className="text-slate-400">·</span>
              <span>
                মোট <span className="font-semibold">{bdt(g.total)}</span>
              </span>
            </div>
          ))}
          <div className="text-slate-600">
            <span className="font-semibold">মেয়াদ:</span>{" "}
            {bnDate(data.startDate)} → {bnDate(data.endDate)}
          </div>
        </div>

        {(data.guarantorName || data.guarantorPhone) && (
          <div className="mt-3 text-[10px] text-slate-600">
            <span className="font-semibold">Guarantor (জামিনদার):</span>{" "}
            {data.guarantorName}
            {data.guarantorPhone ? ` · ${data.guarantorPhone}` : ""}
          </div>
        )}
        {data.notes && (
          <div className="mt-0.5 text-[10px] text-slate-500">{data.notes}</div>
        )}
      </div>
    </div>
  );
}
