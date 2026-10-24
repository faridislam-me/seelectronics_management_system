import { verifyCustomerSession } from "@/actions/customerActions";
import { getMyProducts } from "@/actions/customerProductActions";
import { CUSTOMER_PRODUCT_NAV as NAV_ITEMS } from "@/components/features/customers/customerProductNav";
import { CustomerAppHeader, CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import { productImage, serviceStatusStyle } from "@/lib/serviceStatusStyle";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  Boxes, Calendar, CheckCircle2, ChevronRight, Download, FileText, Hash, Package, ShieldCheck, ShieldX, Wrench, Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerProductsPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const data = await getMyProducts();
  const products = data?.products ?? [];
  const unmatched = data?.unmatchedServices ?? [];
  const activeCount = products.filter((p) => p.warrantyActive).length;
  const card = "rounded-md bg-white border border-[#dfe6f2] shadow-[0_4px_18px_rgba(11,61,145,0.06)]";

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-16">
      <CustomerAppHeader backHref="/customer/profile" title="My All Products" subtitle="আপনার কেনা সব প্রোডাক্ট" />

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5 max-w-3xl mx-auto">
        {/* Summary */}
        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_10px_24px_rgba(10,47,112,0.3)]">
          <span className="absolute -right-10 -top-12 size-40 rounded-full bg-white/10" />
          <span className="relative size-14 rounded-full bg-white text-[#0b3d91] flex items-center justify-center shrink-0"><Boxes size={28} /></span>
          <span className="relative flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">{products.length} টি প্রোডাক্ট</span>
            <span className="text-[12.5px] font-semibold text-white/90">{activeCount} টি ওয়ারেন্টিতে আছে · প্রতিটির নিজস্ব ইনভয়েস ও সার্ভিস হিস্টোরি</span>
          </span>
        </section>

        {products.length === 0 ? (
          <div className={clsx(card, "p-8 text-center flex flex-col items-center gap-3")}>
            <span className="size-16 rounded-full bg-[#eef3fb] text-[#9aa4b8] flex items-center justify-center"><Package size={32} /></span>
            <span className="text-[16px] font-extrabold">কোনো প্রোডাক্ট পাওয়া যায়নি</span>
            <span className="text-[13px] text-[#5b6784] font-medium">আপনার অ্যাকাউন্টে এখনো কোনো কেনা প্রোডাক্ট নেই।</span>
          </div>
        ) : (
          products.map((p) => {
            const serviced = p.installCount + p.repairCount;
            return (
              <article key={p.id} className={clsx(card, "p-3 flex flex-col gap-2.5")}>
                <div className="flex items-start gap-3">
                  <Link href={`/customer/products/${p.id}`} className="relative size-[84px] rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
                    <Image src={productImage(p.type)} alt={p.type} fill sizes="84px" className="object-contain p-1" />
                  </Link>
                  <span className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-extrabold tracking-wide inline-flex items-center uppercase">{p.type}</span>
                      <span className={clsx("inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-extrabold", p.warrantyActive ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>
                        {p.warrantyActive ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                        {p.warrantyDurationMonths === 0 ? "No Warranty" : p.warrantyActive ? "Warranty Valid" : "Warranty Expired"}
                      </span>
                    </span>
                    <Link href={`/customer/products/${p.id}`} className="text-[clamp(13px,3.8vw,15px)] font-extrabold leading-tight break-words">{p.model}</Link>
                    {p.serialNumber && <span className="text-[11px] font-bold text-[#5b6784] break-all">S/N: {p.serialNumber}</span>}
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#5b6784]">
                      <span className="inline-flex items-center gap-1"><Calendar size={13} className="text-[#1f7cf0]" />{formatDate(p.invoiceDate)}</span>
                      <span className="inline-flex items-center gap-1">৳{(p.unitPrice * p.quantity).toLocaleString()}{p.quantity > 1 ? ` (×${p.quantity})` : ""}</span>
                    </span>
                  </span>
                </div>

                {/* Identity: invoice + the customer ID it was issued under */}
                <div className="grid grid-cols-2 gap-1.5 text-[11.5px]">
                  <span className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-2 py-1.5 leading-tight min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-[#5b6784]">Invoice No</span>
                    <b className="break-all">#{p.invoiceNumber}</b>
                  </span>
                  <span className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-2 py-1.5 leading-tight min-w-0">
                    <span className="block text-[10px] font-bold uppercase text-[#5b6784]">Customer ID</span>
                    <b className="break-all">#{p.originalCustomerId || session.customer.customerId}</b>
                  </span>
                  <span className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-2 py-1.5 leading-tight">
                    <span className="block text-[10px] font-bold uppercase text-[#5b6784]">{p.warrantyActive ? "ওয়ারেন্টি শেষ হবে" : "ওয়ারেন্টি"}</span>
                    <b className={p.warrantyActive ? "text-[#0b3d91]" : "text-[#c81f38]"}>{p.warrantyDurationMonths === 0 ? "নেই" : formatDate(p.warrantyEnd)}</b>
                  </span>
                  <span className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-2 py-1.5 leading-tight">
                    <span className="block text-[10px] font-bold uppercase text-[#5b6784]">সার্ভিস / ইনস্টল</span>
                    <b>{serviced === 0 ? "এখনো হয়নি" : <><Zap size={11} className="inline text-[#1f7cf0]" /> {p.installCount} ইনস্টল · <Wrench size={11} className="inline text-[#1f7cf0]" /> {p.repairCount} সার্ভিস</>}</b>
                  </span>
                </div>

                {/* Latest request on this unit */}
                {p.services[0] && (() => {
                  const s = p.services[0];
                  const st = serviceStatusStyle(s.status);
                  return (
                    <Link href={`/customer/services/${s.serviceId}`} className="flex items-center gap-2 rounded-md border border-[#eef1f6] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#3d4a63]">
                      {s.type === "install" ? <Zap size={14} className="text-[#1f7cf0] shrink-0" /> : <Wrench size={14} className="text-[#1f7cf0] shrink-0" />}
                      <span className="min-w-0 flex-1 truncate">{s.type === "install" ? "ইনস্টলেশন" : "সার্ভিস"} #{s.serviceId} · {formatDate(s.createdAt)}</span>
                      <span className={clsx("shrink-0 inline-flex items-center px-2 h-6 rounded-md border text-[10px] font-extrabold", st.cls)}>{st.label}</span>
                    </Link>
                  );
                })()}

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/customer/products/${p.id}`} className="h-11 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3">
                    <span className="inline-flex items-center gap-2"><FileText size={17} />DETAILS</span><ChevronRight size={16} />
                  </Link>
                  <a href={`/pdf/download?type=invoice&id=${p.invoiceNumber}`} target="_blank" className="h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3 shadow-[0_6px_14px_rgba(11,61,145,0.3)]">
                    <span className="inline-flex items-center gap-2"><Download size={17} />INVOICE</span><ChevronRight size={16} />
                  </a>
                </div>
              </article>
            );
          })
        )}

        {/* Requests whose product text matched none of the owned units */}
        {unmatched.length > 0 && (
          <section className={clsx(card, "p-3 flex flex-col gap-2")}>
            <span className="flex items-center gap-2">
              <span className="size-9 rounded-md bg-[#fff6e3] text-[#b8620b] flex items-center justify-center"><Hash size={18} /></span>
              <span className="flex flex-col leading-tight">
                <span className="text-[15px] font-extrabold">অন্যান্য সার্ভিস / ইনস্টলেশন</span>
                <span className="text-[11px] font-semibold text-[#5b6784]">কোন প্রোডাক্টের, তা নিশ্চিত করা যায়নি</span>
              </span>
            </span>
            {unmatched.map((s) => {
              const st = serviceStatusStyle(s.status);
              return (
                <Link key={s.serviceId} href={`/customer/services/${s.serviceId}`} className="flex items-center gap-2 rounded-md border border-[#eef1f6] bg-white px-2.5 py-2 text-[12px] font-semibold text-[#3d4a63]">
                  {s.type === "install" ? <Zap size={14} className="text-[#1f7cf0] shrink-0" /> : <Wrench size={14} className="text-[#1f7cf0] shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{s.productModel} · #{s.serviceId} · {formatDate(s.createdAt)}</span>
                  <span className={clsx("shrink-0 inline-flex items-center px-2 h-6 rounded-md border text-[10px] font-extrabold", st.cls)}>{st.label}</span>
                </Link>
              );
            })}
          </section>
        )}

        {products.length > 0 && (
          <p className="text-[11.5px] text-[#5b6784] font-medium px-1 flex items-start gap-1.5"><CheckCircle2 size={14} className="text-[#178a42] shrink-0 mt-0.5" />প্রতিটি প্রোডাক্ট আলাদা ইনভয়েস ও কাস্টমার আইডি দিয়ে খুঁজে পাওয়া যায় — যেকোনো আইডি দিয়ে লগইন বা ওয়ারেন্টি চেক করা যাবে।</p>
        )}
      </main>

      <CustomerAppNav active="/customer/products" items={NAV_ITEMS} />
    </div>
  );
}
