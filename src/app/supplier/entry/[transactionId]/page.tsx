import { getMySupplierLedger } from "@/actions/supplierActions";
import { contactDetails } from "@/constants";
import { supplierProductLabel } from "@/lib/supplierProduct";
import clsx from "clsx";
import { ArrowLeft, CalendarDays, FileText, Hash, Package, Phone, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const taka = (n: number) => `৳${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start gap-2.5 py-2 border-t border-[#eef1f6] first:border-t-0">
      <span className="size-8 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Icon size={15} /></span>
      <span className="flex flex-col min-w-0 flex-1 leading-tight">
        <span className="text-[11px] font-semibold text-[#6b7690]">{label}</span>
        <span className="text-[14px] font-extrabold text-[#16213a] break-words">{value}</span>
      </span>
    </div>
  );
}

/** One ledger entry in full: product, photo, amount, running totals and receipt. */
export default async function SupplierEntryPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params;
  const res = await getMySupplierLedger();
  if (!res.success) redirect("/supplier/login");
  const { supplier, ledger } = res.data;
  const index = ledger.findIndex((e) => e.transactionId === transactionId);
  if (index < 0) notFound();
  const entry = ledger[index];
  const purchase = entry.type === "purchase";

  let purchased = 0;
  let paid = 0;
  for (const e of ledger.slice(0, index + 1)) {
    if (e.type === "purchase") purchased += e.amount;
    else paid += e.amount;
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a]">
      <header className="sticky top-0 z-50 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white">
        <div className="max-w-[480px] mx-auto px-3 h-14 flex items-center gap-2.5">
          <Link href="/supplier/profile" aria-label="Back" className="size-9 rounded-md bg-white/15 border border-white/20 flex items-center justify-center"><ArrowLeft size={18} /></Link>
          <span className="flex flex-col leading-tight"><span className="text-[16px] font-extrabold">লেনদেনের বিস্তারিত</span><span className="text-[10.5px] text-white/85 font-medium">{supplier.shopName}</span></span>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-2 pt-2 pb-4 flex flex-col gap-2.5">
        {/* Amount banner */}
        <section className={clsx("rounded-md p-3 text-white shadow-[0_8px_22px_rgba(10,47,112,0.25)]", purchase ? "bg-[linear-gradient(110deg,#b8620b_0%,#e0a11b_100%)]" : "bg-[linear-gradient(110deg,#0f6a35_0%,#1a9c4b_100%)]")}>
          <span className="text-[12px] font-bold uppercase tracking-widest opacity-90">{purchase ? "মাল গ্রহণ" : "পরিশোধ করা হয়েছে"}</span>
          <span className="block text-[30px] font-extrabold leading-tight">{purchase ? "+" : "−"}{taka(entry.amount)}</span>
          <span className="text-[12.5px] opacity-95">{fmtDate(entry.date)}</span>
        </section>

        {/* Goods photo */}
        {purchase && entry.photoUrl && (
          <a href={entry.photoUrl} target="_blank" rel="noreferrer" className="rounded-md overflow-hidden bg-white border border-[#dfe6f2] block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.photoUrl} alt="মালের ছবি" className="w-full max-h-[320px] object-cover" />
          </a>
        )}

        {/* Product / payment details */}
        <section className="rounded-md bg-white border border-[#dfe6f2] px-3 py-1">
          <Row icon={Hash} label="রসিদ নম্বর" value={<span className="font-mono">{entry.transactionId}</span>} />
          {purchase && <Row icon={Package} label="পণ্যের ধরন" value={supplierProductLabel(entry.productType)} />}
          <Row icon={FileText} label={purchase ? "পণ্যের বিবরণ" : "পরিশোধের মাধ্যম"} value={entry.description} />
          <Row icon={CalendarDays} label="তারিখ" value={fmtDate(entry.date)} />
          <Row icon={Wallet} label={purchase ? "মালের মূল্য" : "পরিশোধিত টাকা"} value={taka(entry.amount)} />
        </section>

        {/* Account position after this entry */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2">
          <span className="text-[14px] font-extrabold">এই এন্ট্রি পর্যন্ত হিসাব</span>
          <span className="grid grid-cols-3 gap-2 text-center">
            <span className="rounded-md bg-[#eaf1fd] p-2"><span className="block text-[10.5px] font-semibold text-[#5b6784]">মোট মাল</span><b className="text-[13px]">{taka(purchased)}</b></span>
            <span className="rounded-md bg-[#e9f9ef] p-2"><span className="block text-[10.5px] font-semibold text-[#5b6784]">মোট পরিশোধ</span><b className="text-[13px] text-[#178a42]">{taka(paid)}</b></span>
            <span className={clsx("rounded-md p-2", entry.balance > 0 ? "bg-[#ffe9ec]" : "bg-[#e9f9ef]")}><span className="block text-[10.5px] font-semibold text-[#5b6784]">বাকি</span><b className={clsx("text-[13px]", entry.balance > 0 ? "text-[#c81f38]" : "text-[#178a42]")}>{taka(entry.balance)}</b></span>
          </span>
        </section>

        <Link href={`/supplier-receipt/${entry.transactionId}`} className="h-12 rounded-md bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)]"><FileText size={18} />রসিদ দেখুন / ডাউনলোড</Link>
        <a href={`tel:${contactDetails.customerCare}`} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-2 text-[13px] font-bold text-[#0b3d91]"><Phone size={16} />হিসাব নিয়ে প্রশ্ন? কল করুন {contactDetails.customerCare}</a>
      </main>
    </div>
  );
}
