import { InstallmentInvoiceTemplateData, InstallmentScheduleRow } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate, toBanglaNumber } from "@/utils";

/** Money as Bangla numerals with a ৳ suffix, e.g. 30000 → "৩০,০০০৳". */
const bdt = (n: number) =>
  `${toBanglaNumber(Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }))}৳`;

/** Date in Bangla numerals, keeping the short English month, e.g. "Jan ১, ২০২৬". */
const bnDate = (d: Date | string | number) => toBanglaNumber(formatDate(d));

const NAVY = "#0b3d91";
const NAVY_DARK = "#0a285f";
const GOLD = "#c99700";
const PURPLE = "#6a4fa3";
const LAVENDER = "#ece8f6";

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
 * Official SE Electronics কিস্তি INVOICE — rebuilt as the branded company
 * letterhead/pad: a lavender header band (logo + identity + contact + QR), a
 * barcode strip, a watermark emblem and office seal, the data-driven invoice
 * body (customer, product, installment plan & money summary), the standard
 * কিস্তি নোট section, a three-column signature/QR footer (manager • customer
 * app • chairman) and a purple head-office footer bar. Every image is optional
 * and guarded. A4 portrait, rendered by puppeteer.
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
    <div className="flex justify-between gap-6 text-[12.5px] leading-6">
      <span className={bold ? "font-bold" : "font-semibold"}>{label} :</span>
      <span className={bold ? "font-bold" : ""} style={bold ? { color: NAVY } : undefined}>{value}</span>
    </div>
  );

  const NOTES = [
    "প্রতি মাসের নির্দিষ্ট সময়ের মধ্যে নির্ধারিত কিস্তির টাকা নিয়মিত পরিশোধ করতে হবে।",
    "নির্ধারিত সময়ের মধ্যে কিস্তি পরিশোধে ব্যর্থ হলে কোম্পানির নিয়ম অনুযায়ী নির্দিষ্ট জরিমানা বা বিলম্ব ফি প্রযোজ্য হতে পারে।",
    "কিস্তি পরিশোধে দেরি, অবহেলা বা কিস্তি প্রদান না করলে এস ই ইলেকট্রনিকস প্রথম নোটিশ দিয়ে কিস্তিতে নেওয়া পণ্যটি রিকাভারি করে নিয়ে যাবে অথবা আপনার বিরুদ্ধে আইনগত ব্যবস্থা গ্রহণ করবে।",
    "কাস্টমার কেয়ার ঃ ০৯৬৪৯৩৫৫৫৫৫",
  ];

  return (
    <div
      className="relative w-[210mm] h-[297mm] mx-auto bg-white overflow-hidden flex flex-col"
      style={{ fontFamily: `'Tiro Bangla', SolaimanLipi, Inter, sans-serif`, color: "#15223b" }}
    >
      {/* Top accent border */}
      <div style={{ height: "7px", background: PURPLE }} />

      {/* ───── Header band ───── */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ background: LAVENDER }}>
        {/* Left: logo emblem + SE IPS BD tag */}
        <div className="shrink-0 flex flex-col items-center w-[82px]">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logo} alt="SE Electronics" className="w-[68px] h-[68px] object-contain" />
          ) : (
            <div className="w-[68px] h-[68px] rounded-full border-2 flex items-center justify-center font-black" style={{ borderColor: NAVY, color: NAVY }}>SE</div>
          )}
          <div className="mt-1 text-[11px] font-black px-2 rounded text-white tracking-wide" style={{ background: NAVY }}>SE IPS BD</div>
        </div>

        {/* Center: identity */}
        <div className="flex-1 text-center leading-tight">
          <div className="text-[30px] font-black tracking-tight" style={{ color: NAVY }}>SE ELECTRONICS</div>
          <div className="text-[14.5px] font-extrabold tracking-wide" style={{ color: GOLD }}>SALES AND SERVICE CENTER</div>
          <div className="text-[13px] font-extrabold" style={{ color: NAVY }}>SE IPS BD AND SE POWER IPS</div>
          <div className="text-[10.5px] font-bold tracking-[0.35em] text-slate-500 mt-[2px]">SERVICE SUPPORT SOLUTION</div>
        </div>

        {/* Right: contact + QR */}
        <div className="shrink-0 flex items-start gap-2">
          <div className="text-[10px] font-semibold leading-[1.5]" style={{ color: NAVY_DARK }}>
            <div>📶 C.CEAR - 09649355555</div>
            <div>📞 PHONE - 01322247774</div>
            <div>✉️ Gmail: seipsbd@gmail.com</div>
            <div>🌐 website: seipsbd.com</div>
          </div>
          {data.headerQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.headerQr} alt="QR" className="w-[60px] h-[60px] border border-slate-300 bg-white" />
          ) : null}
        </div>
      </div>

      {/* Barcode strip under the header */}
      <div className="flex items-center justify-end gap-3 px-6 py-[5px] border-b-2" style={{ borderColor: NAVY }}>
        {data.barcodeSvg ? (
          <div className="h-[34px] [&>svg]:h-full [&>svg]:w-auto" dangerouslySetInnerHTML={{ __html: data.barcodeSvg }} />
        ) : null}
        {data.serial ? <span className="font-mono text-[11px] font-bold tracking-wider">{data.serial}</span> : null}
      </div>

      {/* ───── Body ───── */}
      <div className="relative flex-1 px-7 pt-3 min-h-0">
        {/* Watermark emblem */}
        {data.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logo}
            alt=""
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px]"
            style={{ opacity: 0.06 }}
          />
        ) : null}
        {/* Round office seal, top-left */}
        {data.seal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.seal} alt="Seal" className="absolute left-7 top-1 w-[78px]" style={{ opacity: 0.85 }} />
        ) : null}

        <div className="relative">
          {/* Title */}
          <div className="text-center mb-3">
            <span className="inline-block px-5 py-[5px] rounded-md text-[17px] font-black text-white tracking-wide" style={{ background: NAVY }}>
              কিস্তি ইনভয়েস · INSTALLMENT INVOICE
            </span>
          </div>

          {/* Customer + plan meta */}
          <div className="flex justify-between text-[12.5px] mb-3 gap-6">
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="border border-black" style={{ background: "#D7E6F5" }}>
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
                      <div className="space-y-1">
                        <div className="text-[12px]">
                          মোট{" "}
                          <span className="font-bold" style={{ color: NAVY }}>{toBanglaNumber(totalInstallments)}টি</span>{" "}
                          মাসিক কিস্তি · প্রতি মাসে <span className="font-semibold">{bdt(mainMonthly)}</span>
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
                        <div className="text-[12px] text-slate-600">
                          <span className="font-semibold">পরিশোধিত:</span>{" "}
                          <span className="font-bold" style={{ color: "#178a42" }}>{bdt(data.paidTotal)}</span>{" "}
                          ({toBanglaNumber(data.paidCount)}টি) · <span className="font-semibold">বাকি:</span>{" "}
                          <span className="font-bold" style={{ color: "#c81f38" }}>{bdt(data.remainingTotal)}</span>
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

      {/* ───── Notes ───── */}
      <div className="px-7 pb-1">
        <span className="inline-block text-white text-[12px] font-bold px-3 py-[2px] rounded" style={{ background: "#d61f2b" }}>নোটঃ</span>
        <div className="mt-1 space-y-[3px]">
          {NOTES.map((n, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
              <span className="shrink-0" style={{ color: "#178a42" }}>✅</span>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── Signature + QR footer ───── */}
      <div className="px-7 pt-2 pb-1 grid grid-cols-3 items-end gap-3">
        {/* Manager (left) */}
        <div className="text-center">
          {data.managerSign ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.managerSign} alt="Manager" className="h-[44px] mx-auto object-contain" />
          ) : <div className="h-[44px]" />}
          <div className="border-t border-slate-800 pt-1 text-[11px] font-bold leading-tight">
            মোঃ আতিকুর রহমান
            <div className="text-[10px] font-semibold">ম্যানেজার</div>
            <div className="text-[10px]">এস ই ইলেকট্রনিক্স</div>
          </div>
        </div>

        {/* Customer app (center) */}
        <div className="text-center">
          {data.appQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.appQr} alt="App QR" className="w-[58px] h-[58px] mx-auto" />
          ) : null}
          <div className="text-[10.5px] font-bold">কাস্টমার অ্যাপ</div>
          {data.barcodeSvg ? (
            <div className="h-[20px] [&>svg]:h-full [&>svg]:w-auto [&>svg]:mx-auto mt-0.5" dangerouslySetInnerHTML={{ __html: data.barcodeSvg }} />
          ) : null}
          <div className="text-[9px] text-slate-600">website : www.seipsbd.com</div>
        </div>

        {/* Chairman (right) */}
        <div className="text-center">
          {data.chairmanSign ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.chairmanSign} alt="Chairman" className="h-[44px] mx-auto object-contain" />
          ) : <div className="h-[44px]" />}
          <div className="border-t border-slate-800 pt-1 text-[11px] font-bold leading-tight">
            সাহাব উদ্দিন মাহমুদ
            <div className="text-[10px] font-semibold">চেয়ারম্যান</div>
            <div className="text-[10px]">এস ই ইলেকট্রনিক্স</div>
          </div>
        </div>
      </div>

      {/* ───── Footer bar ───── */}
      <div className="text-center text-white text-[12px] font-bold py-2" style={{ background: PURPLE }}>
        📍 Head Office :- Airport Road Badam Bagicha R/A 2No Road Sylhet 3100
      </div>
    </div>
  );
}
