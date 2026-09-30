"use client";

import { contactDetails } from "@/constants";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAVY = "#0b3d91";
const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const taka = (n: number) => `৳ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type Props = {
  supplier: { supplierId: string; name: string; shopName: string; phone: string; address: string | null; origin: string | null };
  transaction: { transactionId: string; type: string; amount: number; description: string | null; date: string };
  totals: { purchased: number; paid: number; due: number };
  qrDataUrl: string | null;
  barcodeSvg: string;
  ledger: { transactionId: string; type: string; amount: number; description: string | null; date: string; balance: number }[];
  overall: { purchased: number; paid: number; due: number };
  backHref: string | null;
};

const A4_PX = 794; // 21cm at 96dpi

function SectionTitle({ n, bnTitle, enTitle }: { n: number; bnTitle: string; enTitle: string }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1 text-white text-[12px] font-bold" style={{ background: NAVY }}>
      <span>{bn(n)}। {bnTitle}</span>
      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">{enTitle}</span>
    </div>
  );
}

function Row({ label, en, value, i, strong }: { label: string; en?: string; value?: React.ReactNode; i: number; strong?: boolean }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <tr className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
      <td className="border border-[#c9d4e6] px-2 py-[4px] w-[38%] align-top">
        <span className="font-semibold text-[#16213a]">{label}</span>
        {en && <span className="block text-[8.5px] text-[#5b6784] leading-none">{en}</span>}
      </td>
      <td className={`border border-[#c9d4e6] px-2 py-[4px] align-top ${strong ? "font-extrabold text-[13px]" : "font-medium"} text-[#0f172a]`}>
        {empty ? "—" : value}
      </td>
    </tr>
  );
}

export default function SupplierReceiptClient({ supplier, transaction, totals, qrDataUrl, barcodeSvg, ledger, overall, backHref }: Props) {
  const isPayment = transaction.type === "payment";
  const printedOn = new Date().toLocaleDateString("en-GB");

  // Fit the A4 sheet to the screen width (pinch-zoom still works for a closer look).
  const [scale, setScale] = useState(1);
  const [sheetH, setSheetH] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => {
      setScale(Math.min(1, window.innerWidth / A4_PX));
      if (sheetRef.current) setSheetH(sheetRef.current.offsetHeight);
    };
    fit();
    window.addEventListener("resize", fit);
    const t = setTimeout(fit, 300);
    return () => {
      window.removeEventListener("resize", fit);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-0 sm:py-8 print:bg-white print:py-0 font-sans text-black overflow-x-hidden">
      <div className="sr-fit mx-auto" style={{ width: A4_PX * scale, height: sheetH ? sheetH * scale : undefined }}>
      <div ref={sheetRef} className="sr-sheet w-[21cm] bg-white shadow-xl print:shadow-none origin-top-left" style={{ transform: `scale(${scale})` }}>
        <div className="px-6 py-3 flex flex-wrap gap-2 items-center justify-between print:hidden border-b border-gray-200">
          {backHref ? (
            <Link href={backHref} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          ) : <span />}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-md shadow-sm text-sm font-medium" style={{ background: NAVY }}>
            <Printer className="w-4 h-4" />
            Download / Print Receipt
          </button>
        </div>

        <div id="supplier-receipt" className="relative text-[11.5px] leading-snug text-[#16213a]">
          {/* Header band */}
          <div className="flex items-stretch" style={{ background: `linear-gradient(100deg, ${NAVY} 0%, #1259c9 100%)` }}>
            <div className="flex items-center gap-3 px-5 py-3 flex-1 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="SE Electronics" className="size-16 rounded-full bg-white object-cover shrink-0 border-2 border-white" />
              <div className="min-w-0">
                <div className="text-[22px] font-extrabold tracking-wide leading-none">SE ELECTRONICS</div>
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-90 mt-1">Sales and Service Center</div>
                <div className="text-[10px] opacity-90 mt-1 leading-tight">
                  হেড অফিস : {contactDetails.headOffice.trim()} · হেল্পলাইন : {contactDetails.customerCare}
                  <br />
                  Email : {contactDetails.email} · Web : {contactDetails.website}
                </div>
              </div>
            </div>
            <div className="w-[118px] shrink-0 bg-white/10 flex flex-col items-center justify-center gap-1 py-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" className="size-[84px] bg-white p-0.5 rounded-[3px]" />
              ) : null}
              <span className="text-[8.5px] font-bold tracking-widest text-white">SCAN RECEIPT</span>
            </div>
          </div>

          {/* Title bar with barcode */}
          <div className="flex items-center justify-between gap-3 px-5 py-2 border-b-2" style={{ borderColor: NAVY }}>
            <div>
              <div className="text-[17px] font-extrabold" style={{ color: NAVY }}>{isPayment ? "সাপ্লায়ার পেমেন্ট রসিদ" : "মাল গ্রহণ রসিদ"}</div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-[#3d4a63]">{isPayment ? "SUPPLIER PAYMENT RECEIPT" : "GOODS RECEIVED NOTE"}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              {barcodeSvg ? <div className="h-[38px] w-[190px] [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: barcodeSvg }} /> : null}
              <span className="font-mono text-[10px] tracking-widest">{transaction.transactionId}</span>
            </div>
          </div>

          <div className="px-5 pt-3 pb-2 flex flex-col gap-3">
            {/* 1. Supplier */}
            <div className="border border-[#c9d4e6]">
              <SectionTitle n={1} bnTitle="সাপ্লায়ারের তথ্য" enTitle="Supplier Information" />
              <table className="w-full border-collapse">
                <tbody>
                  <Row i={0} label="নাম" en="Name" value={supplier.name} />
                  <Row i={1} label="দোকানের নাম" en="Shop Name" value={supplier.shopName} />
                  <Row i={2} label="মোবাইল" en="Mobile" value={supplier.phone} />
                  <Row i={3} label="সাপ্লায়ার আইডি" en="Supplier ID" value={<span className="font-mono font-bold">{supplier.supplierId}</span>} />
                  <Row i={4} label="যেখান থেকে" en="Origin" value={supplier.origin} />
                  <Row i={5} label="ঠিকানা" en="Address" value={supplier.address} />
                </tbody>
              </table>
            </div>

            {/* 2. Transaction */}
            <div className="border border-[#c9d4e6]">
              <SectionTitle n={2} bnTitle="লেনদেনের বিবরণ" enTitle="Transaction Details" />
              <table className="w-full border-collapse">
                <tbody>
                  <Row i={0} label="রসিদ নম্বর" en="Transaction ID" value={<span className="font-mono font-bold">{transaction.transactionId}</span>} />
                  <Row i={1} label="ধরন" en="Type" value={isPayment ? "পরিশোধ (Payment)" : "মাল গ্রহণ (Goods Received)"} />
                  <Row i={2} label="তারিখ" en="Date" value={fmtDate(transaction.date)} />
                  <Row i={3} label={isPayment ? "পরিশোধিত টাকা" : "মালের মূল্য"} en="Amount" value={taka(transaction.amount)} strong />
                  <Row i={4} label="বিবরণ" en="Description" value={transaction.description} />
                </tbody>
              </table>
            </div>

            {/* 3. Account summary */}
            <div className="border border-[#c9d4e6]">
              <SectionTitle n={3} bnTitle="হিসাবের সারসংক্ষেপ (এই এন্ট্রি পর্যন্ত)" enTitle="Account Summary" />
              <div className="grid grid-cols-3 text-center">
                <div className="border-r border-[#c9d4e6] py-2"><div className="text-[10px] font-semibold text-[#5b6784]">মোট মাল · Total Purchased</div><div className="text-[15px] font-extrabold">{taka(totals.purchased)}</div></div>
                <div className="border-r border-[#c9d4e6] py-2"><div className="text-[10px] font-semibold text-[#5b6784]">মোট পরিশোধ · Total Paid</div><div className="text-[15px] font-extrabold text-[#178a42]">{taka(totals.paid)}</div></div>
                <div className="py-2 bg-[#f4f7fc]"><div className="text-[10px] font-semibold text-[#5b6784]">বাকি পাওনা · Due</div><div className={`text-[15px] font-extrabold ${totals.due > 0 ? "text-[#c81f38]" : "text-[#178a42]"}`}>{taka(totals.due)}</div></div>
              </div>
            </div>

            {/* 4. Full account statement */}
            <div className="border border-[#c9d4e6]">
              <SectionTitle n={4} bnTitle="সম্পূর্ণ হিসাব" enTitle="Full Account Statement" />
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#eaf0fa] text-[#16213a]">
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">তারিখ</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">ধরন</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">বিবরণ</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-right font-bold">টাকা</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-right font-bold">বাকি</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e, i) => (
                    <tr key={e.transactionId} className={e.transactionId === transaction.transactionId ? "bg-[#fff8e1]" : i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] whitespace-nowrap font-semibold">{e.type === "purchase" ? "মাল গ্রহণ" : "পরিশোধ"}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px]">{e.description || "—"}</td>
                      <td className={`border border-[#c9d4e6] px-1.5 py-[3px] text-right whitespace-nowrap font-bold ${e.type === "payment" ? "text-[#178a42]" : ""}`}>{e.type === "payment" ? "−" : "+"}{taka(e.amount)}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] text-right whitespace-nowrap font-bold">{taka(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-3 text-center border-t border-[#c9d4e6] bg-[#f4f7fc]">
                <div className="border-r border-[#c9d4e6] py-1.5"><div className="text-[10px] font-semibold text-[#5b6784]">মোট মাল গ্রহণ</div><div className="text-[13px] font-extrabold">{taka(overall.purchased)}</div></div>
                <div className="border-r border-[#c9d4e6] py-1.5"><div className="text-[10px] font-semibold text-[#5b6784]">মোট পরিশোধ</div><div className="text-[13px] font-extrabold text-[#178a42]">{taka(overall.paid)}</div></div>
                <div className="py-1.5"><div className="text-[10px] font-semibold text-[#5b6784]">বর্তমান বাকি</div><div className={`text-[13px] font-extrabold ${overall.due > 0 ? "text-[#c81f38]" : "text-[#178a42]"}`}>{taka(overall.due)}</div></div>
              </div>
            </div>

            {/* 5. Signatures */}
            <div className="border border-[#c9d4e6]">
              <SectionTitle n={5} bnTitle="স্বাক্ষর" enTitle="Signatures" />
              <div className="px-3 pt-10 pb-3 grid grid-cols-2 gap-10 text-center text-[10.5px] font-semibold">
                <div className="border-t border-[#16213a] pt-1">{isPayment ? "গ্রহীতা / সাপ্লায়ারের স্বাক্ষর" : "সাপ্লায়ারের স্বাক্ষর"}<br />Receiver / Supplier Signature</div>
                <div className="border-t border-[#16213a] pt-1">সিলমোহর যুক্ত অনুমোদিত স্বাক্ষর<br />Authorized Signature (SE Electronics)</div>
              </div>
            </div>

            <div className="text-[9.5px] border border-dashed border-[#8a95ab] bg-[#fbfcfe] p-2 leading-tight font-medium">
              * এই রসিদটি সিস্টেম দ্বারা তৈরি। QR কোড স্ক্যান করে রসিদটি যাচাই করা যাবে। হিসাব সংক্রান্ত যেকোনো প্রশ্নে যোগাযোগ করুন: {contactDetails.customerCare}
            </div>
          </div>

          <div className="mt-1 px-5 py-1.5 flex items-center justify-between text-[9.5px] text-white" style={{ background: NAVY }}>
            <span className="font-bold tracking-wide">SE ELECTRONICS · Sales and Service Center</span>
            <span>Receipt: {transaction.transactionId} · Printed: {printedOn}</span>
          </div>
        </div>
      </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          .sr-fit { width: auto !important; height: auto !important; }
          .sr-sheet { transform: none !important; width: 100% !important; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #supplier-receipt, #supplier-receipt * { visibility: visible; }
          #supplier-receipt { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `,
        }}
      />
    </div>
  );
}
