import { getMySupplierLedger, supplierLogout } from "@/actions/supplierActions";
import { BlueFooterBand, BlueStatGrid } from "@/components/ui";
import { contactDetails } from "@/constants";
import { SUPPLIER_PRODUCT_LABEL, supplierProductLabel } from "@/lib/supplierProduct";
import clsx from "clsx";
import { ArrowDownLeft, ArrowUpRight, Banknote, CalendarDays, CheckCircle2, ChevronRight, CreditCard, FileText, IdCard, ListChecks, LogOut, Mail, MapPin, Package, Phone, Truck, User } from "lucide-react";
import Link from "next/link";
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
  const lastPayment = recent.find((e) => e.type === "payment");
  const lastPurchase = recent.find((e) => e.type === "purchase");
  const purchaseCount = ledger.filter((e) => e.type === "purchase").length;
  const paymentCount = ledger.length - purchaseCount;
  const categories = (supplier.productCategories || "").split(",").filter(Boolean);
  const mask = (v: string) => (v.length > 4 ? `${"•".repeat(Math.min(v.length - 4, 8))}${v.slice(-4)}` : v);
  const infoRows: { icon: React.ElementType; label: string; value: string | null }[] = [
    { icon: User, label: "মালিক / নাম", value: supplier.name },
    { icon: Phone, label: "বিকল্প মোবাইল", value: supplier.altPhone },
    { icon: Mail, label: "Email", value: supplier.email },
    { icon: IdCard, label: "NID", value: supplier.nidNumber ? mask(supplier.nidNumber) : null },
    { icon: FileText, label: "Trade License", value: supplier.tradeLicenseNumber },
    { icon: User, label: "যোগাযোগকারী ব্যক্তি", value: [supplier.contactPersonName, supplier.contactPersonPhone].filter(Boolean).join(" · ") || null },
  ].filter((r) => r.value);
  const payRows = [
    { label: "bKash", value: supplier.bkashNumber },
    { label: "Nagad", value: supplier.nagadNumber },
    { label: "Bank", value: supplier.bankName },
    { label: "Account name", value: supplier.bankAccountName },
    { label: "Account no.", value: supplier.bankAccountNumber },
  ].filter((r) => r.value);
  const paidPct = totals.purchased > 0 ? Math.min(100, Math.round((totals.paid / totals.purchased) * 100)) : 0;

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
              <a href="#ledger" className={clsx("flex items-center gap-2.5 p-2.5 rounded-md border min-w-0", totals.due > 0 ? "bg-[#ffe9ec] border-[#f7c3ca]" : "bg-[#e9f9ef] border-[#bfe8cd]")}>
                <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 text-white", totals.due > 0 ? "bg-[#e0243f] shadow-[0_0_0_4px_rgba(224,36,63,0.2)]" : "bg-[#1a9c4b]")}><Banknote size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className={clsx("text-[clamp(13px,3.8vw,15px)] font-extrabold truncate", totals.due > 0 ? "text-[#c81f38]" : "text-[#178a42]")}>{taka(totals.due)}</span>
                  <span className="text-[11px] font-bold tracking-wide text-[#6b7690]">মোট ডিউ</span>
                </span>
              </a>
              <a href="#ledger" className="flex items-center gap-2.5 p-2.5 rounded-md border min-w-0 bg-[#e9f9ef] border-[#bfe8cd]">
                <span className="size-10 rounded-full flex items-center justify-center shrink-0 text-white bg-[#1a9c4b]"><CheckCircle2 size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-[clamp(13px,3.8vw,15px)] font-extrabold truncate text-[#178a42]">{taka(totals.paid)}</span>
                  <span className="text-[11px] font-bold tracking-wide text-[#6b7690]">মোট পরিশোধ</span>
                </span>
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
            { value: totals.entries, label: "এন্ট্রি", icon: ListChecks, tone: "purple", href: "#ledger" },
            { value: lastPayment ? taka(lastPayment.amount) : "—", label: lastPayment ? `শেষ পরিশোধ · ${fmtDate(lastPayment.date)}` : "শেষ পরিশোধ", icon: Banknote, tone: "amber", href: "#ledger" },
          ]} />

          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5 text-[13px]">
            <span className="font-extrabold text-[15px]">{supplier.shopName}</span>
            <span className="flex items-center gap-2 text-[#3d4a63]"><Phone size={14} className="text-[#1f7cf0]" />{supplier.phone}</span>
            {supplier.address && <span className="flex items-start gap-2 text-[#3d4a63]"><MapPin size={14} className="text-[#1f7cf0] mt-0.5 shrink-0" />{supplier.address}</span>}
          </section>

          {infoRows.length > 0 && (
            <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5 text-[13px]">
              <span className="font-extrabold text-[15px]">আপনার তথ্য</span>
              {infoRows.map((r) => (
                <span key={r.label} className="flex items-start gap-2.5 text-[#3d4a63]">
                  <r.icon size={14} className="text-[#1f7cf0] mt-0.5 shrink-0" />
                  <span className="flex flex-col leading-tight"><span className="text-[10.5px] font-semibold text-[#6b7690]">{r.label}</span><b className="text-[#16213a] break-words">{r.value}</b></span>
                </span>
              ))}
              {categories.length > 0 && (
                <span className="flex flex-wrap gap-1.5 pt-1">
                  {categories.map((c) => <span key={c} className="px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[11.5px] font-extrabold inline-flex items-center">{SUPPLIER_PRODUCT_LABEL[c] ?? c}</span>)}
                </span>
              )}
            </section>
          )}

          {payRows.length > 0 && (
            <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5 text-[13px]">
              <span className="font-extrabold text-[15px] inline-flex items-center gap-1.5"><CreditCard size={16} className="text-[#1f7cf0]" />পেমেন্ট অ্যাকাউন্ট</span>
              {payRows.map((r) => (
                <span key={r.label} className="flex items-center justify-between gap-3 border-t border-[#eef1f6] pt-1.5 first:border-t-0 first:pt-0">
                  <span className="text-[#6b7690] font-semibold">{r.label}</span><b className="text-[#16213a] break-all text-right">{r.value}</b>
                </span>
              ))}
              <span className="text-[11px] text-[#6b7690]">তথ্য ভুল থাকলে SE Electronics এ জানান।</span>
            </section>
          )}

          {/* Account summary */}
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5">
            <span className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold">হিসাবের সারসংক্ষেপ</span>
              <span className="text-[12px] font-extrabold text-[#178a42]">{paidPct}% পরিশোধিত</span>
            </span>
            <span className="h-2.5 rounded-full bg-[#ffe9ec] overflow-hidden"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#1a9c4b,#34d36b)]" style={{ width: `${paidPct}%` }} /></span>
            <span className="grid grid-cols-2 gap-2 text-[12.5px]">
              <span className="rounded-md bg-[#f4f7fc] p-2 flex flex-col"><span className="text-[#5b6784] text-[11px] font-semibold">মাল গ্রহণ</span><b>{purchaseCount} বার</b></span>
              <span className="rounded-md bg-[#f4f7fc] p-2 flex flex-col"><span className="text-[#5b6784] text-[11px] font-semibold">পরিশোধ</span><b>{paymentCount} বার</b></span>
              <span className="rounded-md bg-[#f4f7fc] p-2 flex flex-col"><span className="text-[#5b6784] text-[11px] font-semibold">শেষ মাল গ্রহণ</span><b>{lastPurchase ? fmtDate(lastPurchase.date) : "—"}</b></span>
              <span className="rounded-md bg-[#f4f7fc] p-2 flex flex-col"><span className="text-[#5b6784] text-[11px] font-semibold">শেষ পরিশোধ</span><b>{lastPayment ? fmtDate(lastPayment.date) : "—"}</b></span>
            </span>
            <span className="flex items-center gap-2 text-[12px] text-[#5b6784]"><CalendarDays size={14} className="text-[#1f7cf0]" />অ্যাকাউন্ট খোলা হয়েছে {fmtDate(supplier.createdAt)}</span>
          </section>

          {/* SE Electronics contact */}
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5 text-[13px]">
            <span className="font-extrabold text-[15px]">SE Electronics যোগাযোগ</span>
            <a href={`tel:${contactDetails.customerCare}`} className="flex items-center gap-2 text-[#3d4a63]"><Phone size={14} className="text-[#1f7cf0]" />হেল্পলাইন: {contactDetails.customerCare}</a>
            <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-2 text-[#3d4a63]"><Mail size={14} className="text-[#1f7cf0]" />{contactDetails.email}</a>
            <span className="flex items-start gap-2 text-[#3d4a63]"><MapPin size={14} className="text-[#1f7cf0] mt-0.5 shrink-0" />হেড অফিস: {contactDetails.headOffice.trim()}</span>
          </section>

          <section id="ledger" className="scroll-mt-16 flex flex-col gap-2">
            <span className="text-[16px] font-extrabold px-0.5">লেনদেনের হিসাব</span>
            {recent.length === 0 ? (
              <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center text-[13px] text-[#5b6784]">এখনও কোনো লেনদেন নেই।</div>
            ) : (
              recent.map((e) => {
                const purchase = e.type === "purchase";
                return (
                  <div key={e.transactionId} className="relative rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.05)] active:bg-[#f4f7fc]">
                    <Link href={`/supplier/entry/${e.transactionId}`} aria-label="বিস্তারিত দেখুন" className="absolute inset-0 rounded-md" />
                    {e.photoUrl ? (
                      <span className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.photoUrl} alt="মালের ছবি" className="size-12 rounded-md object-cover border border-[#dfe6f2]" />
                      </span>
                    ) : (
                      <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0", purchase ? "bg-[#fff6e3] text-[#b8620b]" : "bg-[#e9f9ef] text-[#178a42]")}>{purchase ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span>
                    )}
                    <span className="flex flex-col min-w-0 flex-1 leading-tight">
                      <span className="text-[14px] font-extrabold">{purchase ? `মাল গ্রহণ${supplierProductLabel(e.productType) ? ` · ${supplierProductLabel(e.productType)}` : ""}` : "পরিশোধ করা হয়েছে"}</span>
                      {e.description && <span className="text-[13px] font-bold text-[#16213a] break-words">{purchase ? "পণ্য" : "মাধ্যম"}: {e.description}</span>}
                      <span className="text-[11.5px] text-[#5b6784]">{fmtDate(e.date)}</span>
                    </span>
                    <span className="flex flex-col items-end leading-tight shrink-0">
                      <span className={clsx("text-[15px] font-extrabold", purchase ? "text-[#16213a]" : "text-[#178a42]")}>{purchase ? "+" : "−"}{taka(e.amount)}</span>
                      <span className="text-[10.5px] text-[#5b6784]">বাকি {taka(e.balance)}</span>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1f5fc9]">বিস্তারিত<ChevronRight size={12} /></span>
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
