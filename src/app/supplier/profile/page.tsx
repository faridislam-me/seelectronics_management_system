import { getMySupplierLedger, supplierLogout } from "@/actions/supplierActions";
import { BlueFooterBand, BlueStatGrid } from "@/components/ui";
import { contactDetails } from "@/constants";
import clsx from "clsx";
import { ArrowDownLeft, ArrowUpRight, Banknote, CheckCircle2, FileText, ListChecks, LogOut, MapPin, Package, Phone, Truck } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Supplier portal home: read-only view of what SE Electronics owes this supplier. */
export default async function SupplierProfilePage() {
  const res = await getMySupplierLedger();
  if (!res.success) redirect("/supplier/login");
  const { supplier, ledger, totals } = res.data;
  const recent = [...ledger].reverse();

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a]">
      <header className="sticky top-0 z-50 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white">
        <div className="max-w-[480px] mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <span className="flex flex-col leading-tight"><span className="text-[16px] font-extrabold">SE Electronics</span><span className="text-[10.5px] text-white/85 font-medium">Supplier Portal</span></span>
          <form action={supplierLogout}>
            <button type="submit" className="h-9 px-3 rounded-md bg-white/15 border border-white/20 text-[12px] font-bold inline-flex items-center gap-1.5"><LogOut size={15} />Logout</button>
          </form>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto flex flex-col gap-2.5 pb-4">
        <div className="px-2 pt-2 flex flex-col gap-2.5">
          {/* Profile card (same layout as the customer home) */}
          <div className="rounded-md bg-white p-3 shadow-[0_4px_18px_rgba(11,61,145,0.06)] border border-[#e3e8f1] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="size-[52px] rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Truck size={26} strokeWidth={2.2} /></span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold text-[#16213a] leading-tight truncate">{supplier.name}</span>
                <span className="text-[13px] font-semibold text-[#6b7690] truncate">ID: {supplier.supplierId}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] font-extrabold whitespace-nowrap shrink-0 bg-[#e8f1ff] text-[#1b6fd6]">
                <span className="size-1.5 rounded-full bg-[#1f7cf0]" />SUPPLIER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a href={`tel:${supplier.phone}`} className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#e3e8f1] bg-white min-w-0">
                <span className="size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Phone size={18} /></span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-[#6b7690]">Phone</span>
                  <span className="text-[clamp(13px,3.8vw,15px)] font-extrabold text-[#16213a] truncate">{supplier.phone}</span>
                </span>
              </a>
              <a href="#ledger" className={clsx("flex items-center gap-2.5 p-2.5 rounded-md border min-w-0", totals.due > 0 ? "bg-[#ffe9ec] border-[#f7c3ca]" : "bg-[#e9f9ef] border-[#bfe8cd]")}>
                <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 text-white", totals.due > 0 ? "bg-[#e0243f] shadow-[0_0_0_4px_rgba(224,36,63,0.2)]" : "bg-[#1a9c4b]")}><Banknote size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className={clsx("text-[clamp(13px,3.8vw,15px)] font-extrabold truncate", totals.due > 0 ? "text-[#c81f38]" : "text-[#178a42]")}>{taka(totals.due)}</span>
                  <span className="text-[11px] font-bold tracking-wide text-[#6b7690] uppercase">{totals.due > 0 ? "পাওনা (Due)" : "No due"}</span>
                </span>
                <span className="text-[#9aa4b8] shrink-0">›</span>
              </a>
            </div>

            <a href="#ledger" className="rounded-md bg-[#0a2f70] bg-[linear-gradient(110deg,#0a2f70_0%,#0d3f96_60%,#0a2f70_100%)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(10,47,112,0.3)] relative overflow-hidden">
              <span className="absolute -right-6 -bottom-10 size-32 rounded-full border-[12px] border-white/5" />
              <span className="size-10 rounded-md bg-[#f5c542] text-[#0a2f70] flex items-center justify-center shrink-0"><FileText size={22} strokeWidth={2.4} /></span>
              <span className="flex flex-col min-w-0 flex-1">
                <span className="text-[15px] font-extrabold tracking-wide text-[#f5c542]">LEDGER</span>
                <span className="text-[12px] font-semibold text-white/90 truncate">{supplier.shopName}{supplier.origin ? ` · ${supplier.origin}` : ""}</span>
              </span>
              <span className="shrink-0 inline-flex items-center px-3 h-9 rounded-md bg-[#f5c542] text-[#0a2f70] text-[12px] font-extrabold">হিসাব দেখুন ›</span>
            </a>
          </div>

          <BlueStatGrid cards={[
            { value: taka(totals.purchased), label: "মোট মাল", icon: Package, tone: "blue", href: "#ledger" },
            { value: taka(totals.paid), label: "মোট পরিশোধ", icon: CheckCircle2, tone: "green", href: "#ledger" },
            { value: totals.entries, label: "এন্ট্রি", icon: ListChecks, tone: "purple", href: "#ledger" },
          ]} />

          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5 text-[13px]">
            <span className="font-extrabold text-[15px]">{supplier.shopName}</span>
            <span className="flex items-center gap-2 text-[#3d4a63]"><Phone size={14} className="text-[#1f7cf0]" />{supplier.phone}</span>
            {supplier.address && <span className="flex items-start gap-2 text-[#3d4a63]"><MapPin size={14} className="text-[#1f7cf0] mt-0.5 shrink-0" />{supplier.address}</span>}
          </section>

          <section id="ledger" className="scroll-mt-16 flex flex-col gap-2">
            <span className="text-[16px] font-extrabold px-0.5">লেনদেনের হিসাব</span>
            {recent.length === 0 ? (
              <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center text-[13px] text-[#5b6784]">এখনও কোনো লেনদেন নেই।</div>
            ) : (
              recent.map((e) => {
                const purchase = e.type === "purchase";
                return (
                  <div key={e.transactionId} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.05)]">
                    <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0", purchase ? "bg-[#fff6e3] text-[#b8620b]" : "bg-[#e9f9ef] text-[#178a42]")}>{purchase ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span>
                    <span className="flex flex-col min-w-0 flex-1 leading-tight">
                      <span className="text-[14px] font-extrabold">{purchase ? "মাল গ্রহণ" : "পরিশোধ করা হয়েছে"}</span>
                      <span className="text-[11.5px] text-[#5b6784] truncate">{fmtDate(e.date)}{e.description ? ` · ${e.description}` : ""}</span>
                    </span>
                    <span className="flex flex-col items-end leading-tight shrink-0">
                      <span className={clsx("text-[15px] font-extrabold", purchase ? "text-[#16213a]" : "text-[#178a42]")}>{purchase ? "+" : "−"}{taka(e.amount)}</span>
                      <span className="text-[10.5px] text-[#5b6784]">বাকি {taka(e.balance)}</span>
                      <a href={`/supplier-receipt/${e.transactionId}`} className="mt-1 text-[11px] font-bold text-[#1f5fc9] underline underline-offset-2">রসিদ দেখুন</a>
                    </span>
                  </div>
                );
              })
            )}
          </section>

          <a href={`tel:${contactDetails.customerCare}`} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-2 text-[13px] font-bold text-[#0b3d91]"><Phone size={16} />হিসাব নিয়ে প্রশ্ন? কল করুন {contactDetails.customerCare}</a>
        </div>
        <BlueFooterBand quote={<>বিশ্বাসই আমাদের<br />ব্যবসার শক্তি</>} />
      </main>
    </div>
  );
}
