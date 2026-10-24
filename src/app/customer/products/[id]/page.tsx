import { verifyCustomerSession } from "@/actions/customerActions";
import { getMyProduct } from "@/actions/customerProductActions";
import { CustomerAppHeader, CustomerAppNav } from "@/components/ui/CustomerAppChrome";
import { productImage, serviceStatusStyle } from "@/lib/serviceStatusStyle";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  Banknote, Calendar, CheckCircle2, ChevronRight, ClipboardList, Clock, CreditCard, Download, FileText, Hash, History,
  Home, Package, ShieldCheck, ShieldX, User, Wrench, XCircle, Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CUSTOMER_PRODUCT_NAV as NAV_ITEMS } from "@/components/features/customers/customerProductNav";

function Row({ icon: Icon, label, value, tone }: { icon: typeof User; label: string; value: React.ReactNode; tone?: "red" | "green" }) {
  return (
    <span className="flex items-start gap-2 py-1.5 text-[12.5px]">
      <Icon size={15} className="text-[#1f5fc9] mt-0.5 shrink-0" />
      <span className="w-[108px] shrink-0 text-[#5b6784] font-semibold">{label}</span>
      <b className={clsx("min-w-0 break-words", tone === "red" && "text-[#c81f38]", tone === "green" && "text-[#178a42]")}>{value}</b>
    </span>
  );
}

export default async function CustomerProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyProduct(id);
  if (!res) notFound();
  const { product: p, isWarrantyStopped, warrantyStopReason } = res;
  const card = "rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]";
  const noWarranty = p.warrantyDurationMonths === 0;
  const warrantyOk = p.warrantyActive && !isWarrantyStopped;
  const customerIdShown = p.originalCustomerId || session.customer.customerId;

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-16">
      <CustomerAppHeader backHref="/customer/products" title="Product Details" subtitle="প্রোডাক্ট, ইনভয়েস ও সার্ভিস হিস্টোরি" />

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5 max-w-3xl mx-auto">
        {/* Product header */}
        <section className={clsx(card, "flex flex-col gap-2.5")}>
          <div className="flex items-start gap-3">
            <span className="relative size-[96px] rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
              <Image src={productImage(p.type)} alt={p.type} fill sizes="96px" className="object-contain p-1" />
            </span>
            <span className="flex flex-col gap-1.5 min-w-0 flex-1">
              <span className="self-start px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-extrabold tracking-wide inline-flex items-center uppercase">{p.type}</span>
              <span className="text-[clamp(14px,4vw,16px)] font-extrabold leading-tight break-words">{p.model}</span>
              {p.serialNumber && <span className="text-[11px] font-bold text-[#5b6784] break-all">S/N: {p.serialNumber}</span>}
              <span className={clsx("self-start inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-extrabold", warrantyOk ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>
                {warrantyOk ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                {noWarranty ? "No Warranty" : isWarrantyStopped ? "Warranty Stopped" : p.warrantyActive ? "Warranty Valid" : "Warranty Expired"}
              </span>
            </span>
          </div>
          {isWarrantyStopped && (
            <p className={clsx("rounded-md border p-2.5 text-[12.5px] leading-relaxed font-semibold", warrantyStopReason === "misuse" ? "bg-[#fff1f2] border-[#f7c3ca] text-[#c81f38]" : "bg-[#fff8ea] border-[#f5dfa0] text-[#8a4a05]")}>
              {warrantyStopReason === "misuse"
                ? "ওয়ারেন্টি বাতিল: পণ্যের অপব্যবহার/ক্ষতি প্রমাণিত হওয়ায় এস ই ইলেকট্রনিক্স আপনার ওয়ারেন্টি বাতিল করেছে।"
                : "ওয়ারেন্টি সাময়িক বন্ধ: বকেয়া টাকা পরিশোধ না করায় আপনার ওয়ারেন্টি বন্ধ আছে।"}
            </p>
          )}
        </section>

        {/* Purchase + warranty */}
        <section className={clsx(card, "flex flex-col gap-1")}>
          <span className="flex items-center gap-2.5 mb-1">
            <span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Package size={18} /></span>
            <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold text-[#0b3d91]">কেনার তথ্য</span><span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5b6784]">Purchase &amp; Warranty</span></span>
          </span>
          <div className="flex flex-col divide-y divide-[#eef1f6]">
            <Row icon={Calendar} label="কেনার তারিখ" value={formatDate(p.invoiceDate)} />
            <Row icon={Banknote} label="দাম" value={`৳${p.unitPrice.toLocaleString()}${p.quantity > 1 ? ` × ${p.quantity} = ৳${(p.unitPrice * p.quantity).toLocaleString()}` : ""}`} />
            <Row icon={ShieldCheck} label="ওয়ারেন্টি" value={noWarranty ? "নেই" : `${p.warrantyDurationMonths} মাস (${formatDate(p.warrantyStartDate)} থেকে)`} />
            {!noWarranty && (
              <Row icon={p.warrantyActive ? Clock : XCircle} label={p.warrantyActive ? "শেষ হবে" : "শেষ হয়েছে"} value={formatDate(p.warrantyEnd)} tone={p.warrantyActive ? "green" : "red"} />
            )}
            <Row icon={Hash} label="Invoice No" value={`#${p.invoiceNumber}`} />
            <Row icon={User} label="Customer ID" value={`#${customerIdShown}`} />
            <Row icon={CreditCard} label="পেমেন্ট" value={<>{String(p.paymentType).toUpperCase()} · {p.invoiceDue > 0 ? <span className="text-[#c81f38]">বকেয়া ৳{p.invoiceDue.toLocaleString()}</span> : <span className="text-[#178a42]">পরিশোধিত</span>}</>} />
          </div>
          <a href={`/pdf/download?type=invoice&id=${p.invoiceNumber}`} target="_blank" className="mt-1.5 h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3 shadow-[0_6px_14px_rgba(11,61,145,0.3)]">
            <span className="inline-flex items-center gap-2"><Download size={17} />এই প্রোডাক্টের ইনভয়েস ডাউনলোড</span><ChevronRight size={16} />
          </a>
        </section>

        {/* Service / install history for this unit */}
        <section className={clsx(card, "flex flex-col gap-2")}>
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Wrench size={18} /></span>
              <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold text-[#0b3d91]">সার্ভিস ও ইনস্টলেশন</span><span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5b6784]">এই প্রোডাক্টের হিস্টোরি</span></span>
            </span>
            <span className="text-[11px] font-extrabold text-[#5b6784] text-right leading-tight">
              <span className="inline-flex items-center gap-1"><Zap size={12} className="text-[#1f7cf0]" />{p.installCount} ইনস্টল</span><br />
              <span className="inline-flex items-center gap-1"><Wrench size={12} className="text-[#1f7cf0]" />{p.repairCount} সার্ভিস</span>
            </span>
          </span>

          {p.services.length === 0 ? (
            <p className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-3 py-3 text-[12.5px] font-semibold text-[#5b6784] text-center">এই প্রোডাক্টের জন্য এখনো কোনো সার্ভিস বা ইনস্টলেশন হয়নি।</p>
          ) : (
            p.services.map((s, i) => {
              const st = serviceStatusStyle(s.status);
              const done = s.status === "completed";
              const canceled = s.status === "canceled";
              const StatusIcon = done ? CheckCircle2 : canceled ? XCircle : Clock;
              return (
                <Link key={s.serviceId} href={`/customer/services/${s.serviceId}`} className="rounded-md border border-[#eef1f6] bg-[#f9fbfe] p-2.5 flex items-center gap-2.5">
                  <span className="size-10 rounded-md bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0">{s.type === "install" ? <Zap size={20} /> : <Wrench size={20} />}</span>
                  <span className="flex flex-col gap-0.5 min-w-0 flex-1 leading-tight">
                    <span className="text-[13px] font-extrabold">{s.type === "install" ? "ইনস্টলেশন" : "সার্ভিস"} #{p.services.length - i}</span>
                    <span className="text-[11.5px] font-semibold text-[#5b6784] break-all">ID: {s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
                  </span>
                  <span className={clsx("shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-md border text-[10px] font-extrabold", st.cls)}><StatusIcon size={12} strokeWidth={2.6} />{st.label}</span>
                  <ChevronRight size={16} className="text-[#0b3d91] shrink-0" />
                </Link>
              );
            })
          )}

          <Link href="/get-service" className="h-10 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[12.5px] font-extrabold tracking-wide inline-flex items-center justify-center gap-2">
            <ClipboardList size={16} />নতুন সার্ভিস রিকোয়েস্ট
          </Link>
        </section>

        <Link href="/customer/products" className="h-10 rounded-md bg-white border border-[#dfe6f2] text-[#0b3d91] text-[12.5px] font-extrabold inline-flex items-center justify-center gap-2">
          <FileText size={15} />সব প্রোডাক্ট দেখুন
        </Link>
      </main>

      <CustomerAppNav active="/customer/products" items={NAV_ITEMS} />
    </div>
  );
}
