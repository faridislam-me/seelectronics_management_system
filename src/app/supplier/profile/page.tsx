import { getMySupplierLedger, supplierLogout } from "@/actions/supplierActions";
import { BlueBalanceCard, BlueFooterBand, BlueHero, BlueStatGrid } from "@/components/ui";
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
        <BlueHero
          name={supplier.name}
          idLabel="Supplier ID"
          id={supplier.supplierId}
          initials={supplier.name.slice(0, 2).toUpperCase()}
          chips={[
            { label: "SUPPLIER", color: "glass", icon: Truck },
            ...(supplier.origin ? [{ label: supplier.origin.toUpperCase(), color: "blue" as const }] : []),
          ]}
          tagline={<>Trusted Partner<br />Better Tomorrow</>}
        />

        <div className="px-2 flex flex-col gap-2.5 -mt-4 relative">
          <BlueBalanceCard label="আপনার পাওনা (DUE)" value={`৳ ${totals.due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} icon={Banknote} button="Ledger" buttonIcon={FileText} buttonHref="#ledger" chevronHref="#ledger" />

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
