import { InstallmentInvoiceTemplateData, InstallmentScheduleRow } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate } from "@/utils";
import clsx from "clsx";

const tk = (n: number) =>
  `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} Tk`;

// The letterhead background keeps a baked footer (customer-care note box + seal /
// signatures) starting around y=680px on the A4 render, so the whole content
// column (which begins at y=185px) must finish above it. Two things keep it
// bounded no matter how long the plan runs:
//   1. the schedule flows into side-by-side columns, capped at MAX_COLUMNS, so a
//      36-month plan is ~9 short rows per column instead of 36 stacked rows; and
//   2. every row is a single compact line (no wrapped "paid on" sub-row), with
//      tight padding, so even the worst case (36 months + guarantor + notes)
//      ends above the baked footer.
const ROWS_PER_COLUMN = 6;
const MAX_COLUMNS = 4;

function scheduleColumns(rows: InstallmentScheduleRow[]): InstallmentScheduleRow[][] {
  const cols = Math.min(
    MAX_COLUMNS,
    Math.max(1, Math.ceil(rows.length / ROWS_PER_COLUMN)),
  );
  const per = Math.ceil(rows.length / cols);
  const out: InstallmentScheduleRow[][] = [];
  for (let i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per));
  return out;
}

export default function InstallmentInvoiceTemplate({
  data,
}: {
  data: InstallmentInvoiceTemplateData;
}) {
  const columns = scheduleColumns(data.schedule);

  const MoneyRow = ({
    label,
    value,
    bold,
    accent,
  }: {
    label: string;
    value: string;
    bold?: boolean;
    accent?: boolean;
  }) => (
    <div
      className={clsx(
        "flex justify-between gap-4 py-0 border-b border-slate-200 text-[11px] leading-tight",
        bold && "font-bold",
      )}
    >
      <span className="text-slate-600">{label}</span>
      <span className={clsx(accent ? "text-[#0b3d91] font-bold" : "")}>{value}</span>
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
        <div className="flex items-center justify-between mb-1.5">
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
        <div className="flex justify-between gap-6 mb-1.5 text-[11px]">
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
            <div>
              <span className="font-semibold">Term :</span>{" "}
              {formatDate(data.startDate)} → {formatDate(data.endDate)}
            </div>
          </div>
        </div>

        {/* Money breakdown */}
        <div className="grid grid-cols-2 gap-x-10 mb-1.5">
          <div>
            <MoneyRow label="Cash Price" value={tk(data.cashPrice)} />
            <MoneyRow label="Extra Charge" value={tk(data.extraCharge)} />
            <MoneyRow label="Total Payable" value={tk(data.totalPayable)} bold />
            <MoneyRow label="Down Payment" value={tk(data.downPayment)} />
          </div>
          <div>
            <MoneyRow label="Financed Amount" value={tk(data.financedAmount)} bold />
            <MoneyRow
              label={`Monthly × ${data.months}`}
              value={tk(data.monthlyAmount)}
              accent
            />
            <MoneyRow
              label="Paid"
              value={`${data.paidCount}/${data.months} · ${tk(data.paidTotal)}`}
            />
            <MoneyRow label="Remaining" value={tk(data.remainingTotal)} bold />
          </div>
        </div>

        {/* Schedule */}
        <div className="text-xs font-bold mb-0.5">Installment Schedule</div>
        <div className="flex gap-2.5">
          {columns.map((col, ci) => (
            <table
              key={ci}
              className="flex-1 border-collapse text-[9px]"
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr className="bg-[#D7E6F5] border border-black">
                  <th className="text-left py-0 px-1 font-bold border-r border-black w-4">#</th>
                  <th className="text-left py-0 px-1 font-bold border-r border-black">Due</th>
                  <th className="text-right py-0 px-1 font-bold border-r border-black">Amount</th>
                  <th className="text-center py-0 px-1 font-bold">St.</th>
                </tr>
              </thead>
              <tbody>
                {col.map((row) => {
                  const paid = row.status === "paid";
                  return (
                    <tr key={row.installmentNo} className="border border-black">
                      <td className="py-0 px-1 border-r border-black">
                        {row.installmentNo}
                      </td>
                      <td className="py-0 px-1 border-r border-black whitespace-nowrap">
                        {paid && (
                          <span className="text-emerald-700 font-bold">✓ </span>
                        )}
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="py-0 px-1 text-right border-r border-black whitespace-nowrap">
                        {Number(row.amount).toLocaleString()}
                      </td>
                      <td
                        className={clsx(
                          "py-0 px-1 text-center font-bold whitespace-nowrap",
                          paid ? "text-emerald-700" : "text-amber-700",
                        )}
                      >
                        {paid ? "Paid" : "Due"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ))}
        </div>

        {(data.guarantorName || data.guarantorPhone) && (
          <div className="mt-2 text-[10px] text-slate-600">
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
