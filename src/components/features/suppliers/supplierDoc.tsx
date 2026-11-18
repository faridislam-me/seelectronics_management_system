"use client";

import { contactDetails } from "@/constants";
import { supplierProductLabel } from "@/lib/supplierProduct";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Shared print-friendly building blocks for the three supplier documents:
 *  - one clean transaction receipt (`SupplierReceiptBody`)
 *  - a full account statement (`SupplierStatementBody`)
 *  - all receipts, one per page (many `SupplierReceiptBody` in one frame)
 * `SupplierDocFrame` provides the A4 fit-to-screen scaling, the print toolbar
 * and the shared @media print rules (page breaks between stacked sheets).
 */

export const NAVY = "#0b3d91";
export const taka = (n: number) =>
  `৳ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const A4_PX = 794; // 21cm at 96dpi

export type SupplierLite = {
  supplierId: string;
  name: string;
  shopName: string;
  phone: string;
  address: string | null;
  origin: string | null;
};
export type Txn = {
  transactionId: string;
  type: string;
  amount: number;
  description: string | null;
  productType?: string | null;
  photoUrl?: string | null;
  date: string;
};
export type Totals = { purchased: number; paid: number; due: number };
export type LedgerRow = {
  transactionId: string;
  type: string;
  amount: number;
  description: string | null;
  productType?: string | null;
  date: string;
  balance: number;
};

function SectionTitle({ n, bnTitle, enTitle }: { n: string; bnTitle: string; enTitle: string }) {
  return (
    <div
      className="flex items-center justify-between px-2.5 py-1 text-white text-[12px] font-bold"
      style={{ background: NAVY }}
    >
      <span>
        {n}। {bnTitle}
      </span>
      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">{enTitle}</span>
    </div>
  );
}

function Row({
  label,
  en,
  value,
  i,
  strong,
}: {
  label: string;
  en?: string;
  value?: React.ReactNode;
  i: number;
  strong?: boolean;
}) {
  const empty = value === undefined || value === null || value === "";
  return (
    <tr className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
      <td className="border border-[#c9d4e6] px-2 py-[4px] w-[38%] align-top">
        <span className="font-semibold text-[#16213a]">{label}</span>
        {en && <span className="block text-[8.5px] text-[#5b6784] leading-none">{en}</span>}
      </td>
      <td
        className={`border border-[#c9d4e6] px-2 py-[4px] align-top ${strong ? "font-extrabold text-[13px]" : "font-medium"} text-[#0f172a]`}
      >
        {empty ? "—" : value}
      </td>
    </tr>
  );
}

function HeaderBand({ qrDataUrl, qrLabel }: { qrDataUrl: string | null; qrLabel: string }) {
  return (
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
        <span className="text-[8.5px] font-bold tracking-widest text-white">{qrLabel}</span>
      </div>
    </div>
  );
}

function TitleBar({
  bnTitle,
  enTitle,
  barcodeSvg,
  code,
}: {
  bnTitle: string;
  enTitle: string;
  barcodeSvg: string;
  code: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2 border-b-2" style={{ borderColor: NAVY }}>
      <div>
        <div className="text-[17px] font-extrabold" style={{ color: NAVY }}>
          {bnTitle}
        </div>
        <div className="text-[11px] font-bold tracking-[0.18em] text-[#3d4a63]">{enTitle}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {barcodeSvg ? (
          <div className="h-[38px] w-[190px] [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
        ) : null}
        <span className="font-mono text-[10px] tracking-widest">{code}</span>
      </div>
    </div>
  );
}

function SupplierInfoSection({ n, supplier }: { n: string; supplier: SupplierLite }) {
  return (
    <div className="border border-[#c9d4e6]">
      <SectionTitle n={n} bnTitle="সাপ্লায়ারের তথ্য" enTitle="Supplier Information" />
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
  );
}

function Signatures({ n, isPayment }: { n: string; isPayment: boolean }) {
  return (
    <div className="border border-[#c9d4e6]">
      <SectionTitle n={n} bnTitle="স্বাক্ষর" enTitle="Signatures" />
      <div className="px-3 pt-10 pb-3 grid grid-cols-2 gap-10 text-center text-[10.5px] font-semibold">
        <div className="border-t border-[#16213a] pt-1">
          {isPayment ? "গ্রহীতা / সাপ্লায়ারের স্বাক্ষর" : "সাপ্লায়ারের স্বাক্ষর"}
          <br />
          Receiver / Supplier Signature
        </div>
        <div className="border-t border-[#16213a] pt-1">
          সিলমোহর যুক্ত অনুমোদিত স্বাক্ষর
          <br />
          Authorized Signature (SE Electronics)
        </div>
      </div>
    </div>
  );
}

function VerifyNote() {
  return (
    <div className="text-[9.5px] border border-dashed border-[#8a95ab] bg-[#fbfcfe] p-2 leading-tight font-medium">
      * এই ডকুমেন্টটি সিস্টেম দ্বারা তৈরি। QR কোড স্ক্যান করে যাচাই করা যাবে। হিসাব সংক্রান্ত যেকোনো প্রশ্নে যোগাযোগ করুন: {contactDetails.customerCare}
    </div>
  );
}

function FooterBand({ left, right }: { left: string; right: string }) {
  return (
    <div className="mt-1 px-5 py-1.5 flex items-center justify-between text-[9.5px] text-white" style={{ background: NAVY }}>
      <span className="font-bold tracking-wide">{left}</span>
      <span>{right}</span>
    </div>
  );
}

/** ONE clean transaction receipt — no embedded full ledger. */
export function SupplierReceiptBody({
  supplier,
  transaction,
  totals,
  qrDataUrl,
  barcodeSvg,
}: {
  supplier: SupplierLite;
  transaction: Txn;
  totals: Totals;
  qrDataUrl: string | null;
  barcodeSvg: string;
}) {
  const isPayment = transaction.type === "payment";
  const printedOn = new Date().toLocaleDateString("en-GB");
  return (
    <div className="sr-sheet w-[21cm] bg-white shadow-xl print:shadow-none">
      <div className="relative text-[11.5px] leading-snug text-[#16213a]">
        <HeaderBand qrDataUrl={qrDataUrl} qrLabel="SCAN RECEIPT" />
        <TitleBar
          bnTitle={isPayment ? "সাপ্লায়ার পেমেন্ট রসিদ" : "মাল গ্রহণ রসিদ"}
          enTitle={isPayment ? "SUPPLIER PAYMENT RECEIPT" : "GOODS RECEIVED NOTE"}
          barcodeSvg={barcodeSvg}
          code={transaction.transactionId}
        />
        <div className="px-5 pt-3 pb-2 flex flex-col gap-3">
          <SupplierInfoSection n="১" supplier={supplier} />

          <div className="border border-[#c9d4e6]">
            <SectionTitle n="২" bnTitle="লেনদেনের বিবরণ" enTitle="Transaction Details" />
            <table className="w-full border-collapse">
              <tbody>
                <Row i={0} label="রসিদ নম্বর" en="Transaction ID" value={<span className="font-mono font-bold">{transaction.transactionId}</span>} />
                <Row i={1} label="ধরন" en="Type" value={isPayment ? "পরিশোধ (Payment)" : "মাল গ্রহণ (Goods Received)"} />
                <Row i={2} label="তারিখ" en="Date" value={fmtDate(transaction.date)} />
                <Row i={3} label={isPayment ? "পরিশোধিত টাকা" : "মালের মূল্য"} en="Amount" value={taka(transaction.amount)} strong />
                {!isPayment && <Row i={4} label="পণ্যের ধরন" en="Product" value={supplierProductLabel(transaction.productType)} />}
                <Row i={5} label="বিবরণ" en="Description" value={transaction.description} />
                {!isPayment && transaction.photoUrl && (
                  <Row
                    i={6}
                    label="মালের ছবি"
                    en="Photo"
                    value={
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={transaction.photoUrl} alt="মালের ছবি" className="h-24 w-auto rounded-[3px] border border-[#c9d4e6] object-cover" />
                    }
                  />
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-[#c9d4e6]">
            <SectionTitle n="৩" bnTitle="হিসাবের সারসংক্ষেপ (এই এন্ট্রি পর্যন্ত)" enTitle="Account Summary" />
            <div className="grid grid-cols-3 text-center">
              <div className="border-r border-[#c9d4e6] py-2">
                <div className="text-[10px] font-semibold text-[#5b6784]">মোট মাল · Total Purchased</div>
                <div className="text-[15px] font-extrabold">{taka(totals.purchased)}</div>
              </div>
              <div className="border-r border-[#c9d4e6] py-2">
                <div className="text-[10px] font-semibold text-[#5b6784]">মোট পরিশোধ · Total Paid</div>
                <div className="text-[15px] font-extrabold text-[#178a42]">{taka(totals.paid)}</div>
              </div>
              <div className="py-2 bg-[#f4f7fc]">
                <div className="text-[10px] font-semibold text-[#5b6784]">বাকি পাওনা · Due</div>
                <div className={`text-[15px] font-extrabold ${totals.due > 0 ? "text-[#c81f38]" : "text-[#178a42]"}`}>{taka(totals.due)}</div>
              </div>
            </div>
          </div>

          <Signatures n="৪" isPayment={isPayment} />
          <VerifyNote />
        </div>
        <FooterBand left="SE ELECTRONICS · Sales and Service Center" right={`Receipt: ${transaction.transactionId} · Printed: ${printedOn}`} />
      </div>
    </div>
  );
}

/** Full A-to-Z account statement for a supplier. */
export function SupplierStatementBody({
  supplier,
  ledger,
  overall,
  qrDataUrl,
  barcodeSvg,
}: {
  supplier: SupplierLite;
  ledger: LedgerRow[];
  overall: Totals;
  qrDataUrl: string | null;
  barcodeSvg: string;
}) {
  const printedOn = new Date().toLocaleDateString("en-GB");
  return (
    <div className="sr-sheet w-[21cm] bg-white shadow-xl print:shadow-none">
      <div className="relative text-[11.5px] leading-snug text-[#16213a]">
        <HeaderBand qrDataUrl={qrDataUrl} qrLabel="SCAN STATEMENT" />
        <TitleBar bnTitle="হিসাব বিবরণী (স্টেটমেন্ট)" enTitle="ACCOUNT STATEMENT" barcodeSvg={barcodeSvg} code={supplier.supplierId} />
        <div className="px-5 pt-3 pb-2 flex flex-col gap-3">
          <SupplierInfoSection n="১" supplier={supplier} />

          <div className="border border-[#c9d4e6]">
            <SectionTitle n="২" bnTitle="সম্পূর্ণ হিসাব (সকল লেনদেন)" enTitle="Full Account Statement" />
            {ledger.length === 0 ? (
              <div className="py-6 text-center text-[#5b6784]">কোনো লেনদেন নেই।</div>
            ) : (
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#eaf0fa] text-[#16213a]">
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold w-[8%]">ক্রম</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">তারিখ</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">ধরন</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-left font-bold">বিবরণ</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-right font-bold">টাকা</th>
                    <th className="border border-[#c9d4e6] px-1.5 py-1 text-right font-bold">বাকি</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e, i) => (
                    <tr key={e.transactionId} className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] text-center">{i + 1}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] whitespace-nowrap font-semibold">{e.type === "purchase" ? "মাল গ্রহণ" : "পরিশোধ"}</td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px]">{[supplierProductLabel(e.productType), e.description].filter(Boolean).join(" · ") || "—"}</td>
                      <td className={`border border-[#c9d4e6] px-1.5 py-[3px] text-right whitespace-nowrap font-bold ${e.type === "payment" ? "text-[#178a42]" : ""}`}>
                        {e.type === "payment" ? "−" : "+"}
                        {taka(e.amount)}
                      </td>
                      <td className="border border-[#c9d4e6] px-1.5 py-[3px] text-right whitespace-nowrap font-bold">{taka(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="grid grid-cols-3 text-center border-t border-[#c9d4e6] bg-[#f4f7fc]">
              <div className="border-r border-[#c9d4e6] py-1.5">
                <div className="text-[10px] font-semibold text-[#5b6784]">মোট মাল গ্রহণ</div>
                <div className="text-[13px] font-extrabold">{taka(overall.purchased)}</div>
              </div>
              <div className="border-r border-[#c9d4e6] py-1.5">
                <div className="text-[10px] font-semibold text-[#5b6784]">মোট পরিশোধ</div>
                <div className="text-[13px] font-extrabold text-[#178a42]">{taka(overall.paid)}</div>
              </div>
              <div className="py-1.5">
                <div className="text-[10px] font-semibold text-[#5b6784]">বর্তমান বাকি</div>
                <div className={`text-[13px] font-extrabold ${overall.due > 0 ? "text-[#c81f38]" : "text-[#178a42]"}`}>{taka(overall.due)}</div>
              </div>
            </div>
          </div>

          <Signatures n="৩" isPayment={false} />
          <VerifyNote />
        </div>
        <FooterBand left="SE ELECTRONICS · Sales and Service Center" right={`Statement · ${supplier.supplierId} · Printed: ${printedOn}`} />
      </div>
    </div>
  );
}

/**
 * A4 fit-to-screen frame + print toolbar shared by all supplier documents.
 * Children are one or more `.sr-sheet` blocks; print inserts a page break
 * before each sheet after the first, so stacked receipts print one-per-page.
 */
export function SupplierDocFrame({
  backHref,
  printLabel,
  children,
}: {
  backHref: string | null;
  printLabel: string;
  children: React.ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [h, setH] = useState<number | null>(null);
  const colRef = useRef<HTMLDivElement>(null);

  const measure = () => {
    setScale(Math.min(1, window.innerWidth / A4_PX));
    if (colRef.current) setH(colRef.current.offsetHeight);
  };
  useLayoutEffect(measure, []);
  useEffect(() => {
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-0 sm:py-8 print:bg-white print:py-0 font-sans text-black overflow-x-hidden">
      <div className="sr-noprint sticky top-0 z-10 px-4 py-2 flex flex-wrap gap-2 items-center justify-between bg-white border-b border-gray-200 shadow-sm">
        {backHref ? (
          <Link href={backHref} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        ) : (
          <span />
        )}
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-md shadow-sm text-sm font-medium" style={{ background: NAVY }}>
          <Printer className="w-4 h-4" />
          {printLabel}
        </button>
      </div>

      <div className="sr-fit mx-auto" style={{ width: A4_PX * scale, height: h ? h * scale : undefined }}>
        <div ref={colRef} className="sr-scale origin-top-left flex flex-col items-center gap-6 py-4 print:py-0 print:gap-0" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          .sr-noprint { display: none !important; }
          .sr-fit { width: auto !important; height: auto !important; }
          .sr-scale { transform: none !important; width: 100% !important; gap: 0 !important; }
          .sr-sheet { width: 100% !important; box-shadow: none !important; }
          .sr-sheet + .sr-sheet { break-before: page; page-break-before: always; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
        }}
      />
    </div>
  );
}
