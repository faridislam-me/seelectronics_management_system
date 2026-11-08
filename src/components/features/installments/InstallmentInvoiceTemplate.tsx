import { InstallmentInvoiceTemplateData, InstallmentScheduleRow } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate } from "@/utils";
import clsx from "clsx";

const tk = (n: number) =>
  `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} Tk`;

// The letterhead background keeps a baked footer (seal / signature) near the
// bottom, so the content column lives between the header and that footer. The
// schedule can hold many months, so it flows into side-by-side columns to stay
// clear of the footer instead of running off the page.
function scheduleColumns(rows: InstallmentScheduleRow[]): InstallmentScheduleRow[][] {
  const cols = rows.length > 24 ? 3 : rows.length > 12 ? 2 : 1;
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
        "flex justify-between gap-4 py-1 border-b border-slate-200 text-sm",
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
      <div className="absolute top-[200px] left-[40px] right-[40px]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <div className="text-xl font-bold tracking-wide">
              INSTALLMENT INVOICE
            </div>
            <div className="text-sm text-slate-500">কিস্তি চুক্তিপত্র</div>
          </div>
          <div className="text-right text-sm">
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
        <div className="flex justify-between gap-6 mb-4 text-sm">
          <div className="space-y-1">
            <div className="font-semibold text-base mb-1">Customer</div>
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
          <div className="text-right space-y-1">
            <div className="font-semibold text-base mb-1">Product</div>
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
        <div className="grid grid-cols-2 gap-x-10 mb-4">
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
        <div className="text-sm font-bold mb-1">Installment Schedule</div>
        <div className="flex gap-4">
          {columns.map((col, ci) => (
            <table
              key={ci}
              className="flex-1 border-collapse text-xs"
              style={{ tableLayout: "fixed" }}
            >
              <thead>
                <tr className="bg-[#D7E6F5] border border-black">
                  <th className="text-left py-1 px-1.5 font-bold border-r border-black w-5">#</th>
                  <th className="text-left py-1 px-1.5 font-bold border-r border-black">Due</th>
                  <th className="text-right py-1 px-1.5 font-bold border-r border-black">Amount</th>
                  <th className="text-center py-1 px-1.5 font-bold">St.</th>
                </tr>
              </thead>
              <tbody>
                {col.map((row) => {
                  const paid = row.status === "paid";
                  return (
                    <tr key={row.installmentNo} className="border border-black">
                      <td className="py-1 px-1.5 border-r border-black">
                        {row.installmentNo}
                      </td>
                      <td className="py-1 px-1.5 border-r border-black whitespace-nowrap">
                        {formatDate(row.dueDate)}
                        {paid && row.paidAt && (
                          <span className="block text-[9px] text-emerald-700">
                            ✓ {formatDate(row.paidAt)}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-1.5 text-right border-r border-black whitespace-nowrap">
                        {Number(row.amount).toLocaleString()}
                      </td>
                      <td
                        className={clsx(
                          "py-1 px-1.5 text-center font-bold whitespace-nowrap",
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
          <div className="mt-3 text-xs text-slate-600">
            <span className="font-semibold">Guarantor (জামিনদার):</span>{" "}
            {data.guarantorName}
            {data.guarantorPhone ? ` · ${data.guarantorPhone}` : ""}
          </div>
        )}
        {data.notes && (
          <div className="mt-1 text-xs text-slate-500">{data.notes}</div>
        )}
      </div>
    </div>
  );
}
