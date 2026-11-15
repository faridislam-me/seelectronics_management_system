import { InstallmentNocTemplateData } from "@/app/pdf/download/actions/pdfTypes";
import { formatDate, toBanglaNumber } from "@/utils";

/** Money as Bangla numerals with a ৳ suffix. */
const bdt = (n: number) =>
  `${toBanglaNumber(Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }))}৳`;

const bnDate = (d: Date | string | number | null) => (d ? toBanglaNumber(formatDate(d)) : "—");

const METHOD_LABELS: Record<string, string> = {
  cash: "নগদ",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "ব্যাংক",
};

export default function InstallmentNocTemplate({
  data,
}: {
  data: InstallmentNocTemplateData;
}) {
  const productName = [data.productBrand, data.productModel].filter(Boolean).join(" ");

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
        <div className="text-center mb-4">
          <div className="inline-block border-2 border-[#0b3d91] rounded-md px-6 py-1.5">
            <div className="text-xl font-extrabold tracking-wide text-[#0b3d91]">
              NO OBJECTION CERTIFICATE
            </div>
            <div className="text-[13px] font-bold text-slate-700">অনাপত্তি সনদপত্র (NOC)</div>
          </div>
        </div>

        <div className="flex justify-between text-[12px] mb-3">
          <div><span className="font-semibold">Plan Code #</span> {data.planCode}</div>
          <div><span className="font-semibold">তারিখ:</span> {bnDate(data.issuedDate)}</div>
        </div>

        {/* Certificate body */}
        <div className="text-[13.5px] leading-7 text-justify mb-4">
          এই মর্মে প্রত্যয়ন করা যাইতেছে যে, জনাব/জনাবা{" "}
          <span className="font-bold">{data.customerName}</span> (গ্রাহক আইডি:{" "}
          <span className="font-bold">{data.customerId}</span>, মোবাইল: {data.customerPhone})
          {" "}এস ই ইলেকট্রনিক্স হইতে কিস্তিতে ক্রয়কৃত{" "}
          <span className="font-bold">{data.productType ? `${data.productType} — ` : ""}{productName}</span>
          {data.serialNumber ? ` (সিরিয়াল: ${data.serialNumber})` : ""} পণ্যটির{" "}
          সম্পূর্ণ কিস্তির টাকা{" "}
          <span className="font-bold">{bdt(data.financedAmount)}</span>{" "}
          {data.fullyPaid ? "পরিশোধ করিয়াছেন" : "পরিশোধ করিতেছেন"}। উক্ত কিস্তির
          বিপরীতে এস ই ইলেকট্রনিক্সের আর কোনো পাওনা/আপত্তি নাই এবং পণ্যটির উপর
          গ্রাহকের পূর্ণ মালিকানা নিশ্চিত করা হইল।
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-1 text-[12.5px] border border-slate-300 rounded-md px-4 py-2 mb-4 bg-[#F4F8FD]">
          <div><span className="font-semibold">ডাউন পেমেন্ট:</span> {bdt(data.downPayment)}</div>
          <div><span className="font-semibold">কিস্তিতে ফাইন্যান্স:</span> {bdt(data.financedAmount)}</div>
          <div><span className="font-semibold">মোট পরিশোধিত:</span> {bdt(data.paidTotal)}</div>
          <div><span className="font-semibold">কিস্তি সংখ্যা:</span> {toBanglaNumber(data.paidCount)}/{toBanglaNumber(data.months)}</div>
          <div><span className="font-semibold">মেয়াদ:</span> {bnDate(data.startDate)} → {bnDate(data.endDate)}</div>
          <div><span className="font-semibold">মোট মূল্য:</span> {bdt(data.totalPayable)}</div>
        </div>

        {/* Payment history */}
        <div className="text-[13px] font-bold mb-1">পরিশোধের বিবরণ</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border border-black bg-[#D7E6F5]">
              <th className="text-left py-1.5 px-2 font-bold text-[12px] border-r border-black w-6">#</th>
              <th className="text-left py-1.5 px-2 font-bold text-[12px] border-r border-black">পরিশোধের তারিখ</th>
              <th className="text-left py-1.5 px-2 font-bold text-[12px] border-r border-black">মাধ্যম</th>
              <th className="text-left py-1.5 px-2 font-bold text-[12px] border-r border-black">নম্বর / TxID</th>
              <th className="text-right py-1.5 px-2 font-bold text-[12px] border-black">পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.installmentNo} className="border border-black">
                <td className="py-1 px-2 text-[12px] border-r border-black">{toBanglaNumber(r.installmentNo)}</td>
                <td className="py-1 px-2 text-[12px] border-r border-black">{bnDate(r.paidAt)}</td>
                <td className="py-1 px-2 text-[12px] border-r border-black">
                  {r.paymentMethod ? METHOD_LABELS[r.paymentMethod] || r.paymentMethod : "—"}
                </td>
                <td className="py-1 px-2 text-[12px] border-r border-black">
                  {[r.paymentNumber, r.transactionId].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="py-1 px-2 text-[12px] text-right border-black font-semibold">
                  {bdt(r.paidAmount || r.amount)}
                </td>
              </tr>
            ))}
            <tr className="border border-black bg-[#F4F8FD]">
              <td colSpan={4} className="py-1.5 px-2 text-[12px] text-right font-bold border-r border-black">
                মোট পরিশোধিত
              </td>
              <td className="py-1.5 px-2 text-[12px] text-right font-extrabold text-[#0b3d91] border-black">
                {bdt(data.paidTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
