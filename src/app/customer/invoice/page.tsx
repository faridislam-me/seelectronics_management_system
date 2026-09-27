import { verifyCustomerSession } from "@/actions/customerActions";
import { getInvoiceByNumber } from "@/actions/invoiceActions";
import { CustomerLayout } from "@/components/layout";
import CopyButton from "@/components/ui/CopyButton";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { redirect } from "next/navigation";
import { AlertCircle, Banknote, Calendar, CheckCircle2, ClipboardList, Clock, CreditCard, Download, FileText, Hash, MapPin, Package, Phone, ShieldCheck, ShieldX, ShoppingCart, User, Wrench } from "lucide-react";
import Link from "next/link";
import { InvoicesType, Product } from "@/types";

export default async function CustomerInvoicePage() {
  const session = await verifyCustomerSession();
  
  if (!session.isAuth || !session.customer) {
    redirect("/customer/login");
  }

  if (!session.customer.invoiceNumber) {
    return (
      <CustomerLayout>
        <div className="p-8 pb-2 max-w-lg mx-auto text-center mt-10">
          <div className="size-20 mx-auto bg-gray-100 rounded-full flex gap-2 items-center justify-center text-gray-400 mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">No Invoice Found</h1>
          <p className="text-gray-500 font-medium mb-8">
            There is no invoice associated with your current customer profile.
          </p>
          <Link href="/customer/profile" className="px-6 py-3 bg-brand text-white font-black uppercase tracking-widest text-sm rounded-md">
            Return to Dashboard
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const res = await getInvoiceByNumber(session.customer.invoiceNumber);

  if (!res.success || !res.data) {
    return (
      <CustomerLayout>
        <div className="p-8 pb-2 max-w-lg mx-auto text-center mt-10">
          <div className="size-20 mx-auto bg-rose-50 rounded-full flex gap-2 items-center justify-center text-rose-400 mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Invoice Unavailable</h1>
          <p className="text-gray-500 font-medium mb-8">
            We couldn't retrieve your invoice at this time. Please try again later or contact support.
          </p>
          <Link href="/customer/profile" className="px-6 py-3 bg-brand text-white font-black uppercase tracking-widest text-sm rounded-md">
            Return to Dashboard
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const invoiceData = res.data as (InvoicesType & { products: Product[] });
  const isDue = invoiceData.dueAmount > 0;
  const products = invoiceData.products ?? [];

  return (
    <CustomerLayout>
      <div className="px-2 pt-2 pb-2 max-w-4xl mx-auto flex flex-col gap-2.5 text-[#16213a]">
        {/* Title + invoice number */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-wrap items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="size-12 rounded-full bg-[linear-gradient(135deg,#1f7cf0,#0b3d91)] text-white flex items-center justify-center shrink-0"><FileText size={24} /></span>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold text-[#0b2a66]">Invoice View</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">আপনার ইনভয়েসের বিস্তারিত তথ্য এখানে দেখুন</span>
          </span>
          <span className="w-full min-[400px]:w-auto rounded-md bg-[#eef4fd] border border-[#dfe8f7] px-2.5 py-1.5 flex items-center gap-2 min-w-0">
            <ClipboardList size={18} className="text-[#1f5fc9] shrink-0" />
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-[10.5px] font-semibold text-[#5b6784]">Invoice No.</span>
              <b className="text-[13px] break-all">#{invoiceData.invoiceNumber}</b>
            </span>
            <span className="text-[#1f5fc9] shrink-0"><CopyButton content={invoiceData.invoiceNumber} /></span>
          </span>
        </section>

        {/* Header actions (kept) */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5">
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[14px] font-extrabold uppercase">Invoice Details</span>
            <span className="text-[11.5px] font-medium text-[#5b6784]">Preview your official receipt below.</span>
          </span>
          <a href={`/pdf/download?type=invoice&id=${session.customer.invoiceNumber}`} target="_blank" className="shrink-0 h-10 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold uppercase inline-flex items-center gap-1.5"><Download size={15} />Download PDF</a>
        </section>

        {/* Customer info + summary */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><User size={18} /></span>
            <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold text-[#0b3d91]">গ্রাহকের তথ্য</span><span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5b6784]">Customer Details</span></span>
          </div>
          <div className="flex flex-col min-[400px]:flex-row gap-2">
            <div className="flex-1 min-w-0 flex flex-col divide-y divide-[#eef1f6] text-[12.5px]">
              {[
                { icon: User, k: "নাম", v: invoiceData.customerName },
                { icon: Phone, k: "মোবাইল নাম্বার", v: invoiceData.customerPhone },
                { icon: MapPin, k: "ঠিকানা", v: invoiceData.customerAddress },
                { icon: Hash, k: "Cust ID", v: `#${invoiceData.customerId}` },
                { icon: CreditCard, k: "Method", v: String(invoiceData.paymentType || "").toUpperCase() },
                ...(invoiceData.serviceId ? [{ icon: Wrench, k: "Service ID", v: `#${invoiceData.serviceId}` }] : []),
              ].map((r) => (
                <span key={r.k} className="flex items-start gap-2 py-1.5">
                  <r.icon size={15} className="text-[#1f5fc9] mt-0.5 shrink-0" />
                  <span className="w-[92px] shrink-0 text-[#5b6784] font-semibold">{r.k}</span>
                  <b className="min-w-0 break-words">{r.v}</b>
                </span>
              ))}
            </div>
            <div className="min-[400px]:w-[140px] shrink-0 rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2 grid grid-cols-2 min-[400px]:grid-cols-1 gap-2 text-[12px] content-start">
              <span className="flex items-start gap-1.5"><Calendar size={16} className="text-[#1f5fc9] shrink-0" /><span className="flex flex-col leading-tight"><span className="text-[10.5px] font-semibold text-[#5b6784]">তারিখ</span><b>{formatDate(invoiceData.date)}</b></span></span>
              <span className="flex items-start gap-1.5"><Banknote size={16} className="text-[#1f5fc9] shrink-0" /><span className="flex flex-col leading-tight"><span className="text-[10.5px] font-semibold text-[#5b6784]">মোট টাকা</span><b className="text-[15px]">৳{invoiceData.total.toLocaleString()}</b></span></span>
              <span className={clsx("col-span-2 min-[400px]:col-span-1 h-8 rounded-md border inline-flex items-center justify-center gap-1 text-[11.5px] font-extrabold", isDue ? "bg-[#fff0f2] border-[#f7c3ca] text-[#c81f38]" : "bg-[#e9f9ef] border-[#bfe8cd] text-[#178a42]")}>
                {isDue ? <Clock size={14} /> : <CheckCircle2 size={14} />}{isDue ? "Payment Pending" : "পেমেন্ট সম্পন্ন"}
              </span>
            </div>
          </div>
          <p className={clsx("text-[10.5px] font-bold tracking-[0.2em] uppercase", isDue ? "text-[#c81f38]" : "text-[#178a42]")}>Sales Invoice · {isDue ? "Payment Pending" : "Fully Paid Receipt"}</p>
        </section>

        {/* Products */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><ShoppingCart size={18} /></span>
            <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold text-[#0b3d91]">প্যাকেজের বিবরণ</span><span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5b6784]">Product Specifications</span></span>
          </div>
          {products.map((product, index) => (
            <div key={product.id} className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] p-2 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="size-10 rounded-full bg-[#1f5fc9] text-white flex items-center justify-center shrink-0"><Package size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
                  <span className="self-start px-1.5 h-5 rounded-md bg-[#e3edff] text-[#1f5fc9] text-[10.5px] font-extrabold uppercase inline-flex items-center">{product.type}</span>
                  <b className="text-[13.5px] break-words">{product.model}</b>
                  <span className="text-[10.5px] font-bold text-[#9aa4b8]">ITEM #{(index + 1).toString().padStart(2, "0")}</span>
                </span>
                <span className="shrink-0 rounded-md bg-[#dbe8ff] px-2 py-1 text-right leading-tight"><span className="block text-[9.5px] font-bold uppercase text-[#5b6784]">Line Total</span><b className="text-[15px] text-[#0b3d91]">৳{(product.unitPrice * product.quantity).toLocaleString()}</b></span>
              </div>
              <div className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-1.5 text-[12px]">
                <span className="rounded-md bg-white border border-[#eef1f6] px-2 py-1.5 leading-tight"><span className="block text-[10px] font-bold uppercase text-[#5b6784]">Warranty</span>
                  {product.warrantyDurationMonths === 0 ? <b className="inline-flex items-center gap-1"><ShieldX size={13} className="text-[#e0243f]" />None</b> : <b className="inline-flex items-center gap-1"><ShieldCheck size={13} className="text-[#1a9c4b]" />{product.warrantyDurationMonths} Months</b>}
                </span>
                <span className="rounded-md bg-white border border-[#eef1f6] px-2 py-1.5 leading-tight"><span className="block text-[10px] font-bold uppercase text-[#5b6784]">Quantity</span><b>×{product.quantity}</b></span>
                <span className="rounded-md bg-white border border-[#eef1f6] px-2 py-1.5 leading-tight"><span className="block text-[10px] font-bold uppercase text-[#5b6784]">Unit Price</span><b>৳{product.unitPrice.toLocaleString()}</b></span>
                <span className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] px-2 py-1.5 leading-tight"><span className="block text-[10px] font-bold uppercase text-[#1f7cf0]">Status</span><b className="text-[#1b6fd6]">ACTIVE</b></span>
              </div>
            </div>
          ))}

          {/* Financial summary */}
          <div className="rounded-md border border-[#dfe6f2] overflow-hidden text-[12.5px]">
            {invoiceData.subtotal > invoiceData.total && (
              <>
                <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#eef1f6]"><span className="font-bold uppercase text-[#5b6784]">Subtotal</span><b>৳{invoiceData.subtotal.toLocaleString()}</b></div>
                <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#eef1f6] text-[#c81f38]"><span className="font-bold uppercase">Referral Discount</span><b>-৳{(invoiceData.subtotal - invoiceData.total).toLocaleString()}</b></div>
              </>
            )}
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#eef1f6]"><span className="font-bold uppercase text-[#5b6784]">Total Bill</span><b>৳{invoiceData.total.toLocaleString()}</b></div>
            {isDue ? (
              <>
                <div className="flex items-center justify-between px-2.5 py-2 bg-[#e9f9ef] text-[#178a42]"><span className="font-bold uppercase">Advance Paid</span><b>৳{(invoiceData.total - invoiceData.dueAmount).toLocaleString()}</b></div>
                <div className="flex items-center justify-between px-2.5 py-2 bg-[#e0243f] text-white"><span className="font-bold uppercase text-[11px]">Balance Due</span><b className="text-[18px]">৳{invoiceData.dueAmount.toLocaleString()}</b></div>
              </>
            ) : (
              <div className="flex items-center justify-between px-2.5 py-2 bg-[#1a9c4b] text-white"><span className="font-bold uppercase text-[11px]">Full Amount Paid</span><b className="text-[18px]">৳{invoiceData.total.toLocaleString()}</b></div>
            )}
          </div>
        </section>

        {/* Company notice */}
        <section className="rounded-md bg-[#eef4fd] border border-dashed border-[#bcd4fb] p-2.5">
          <p className="text-[12.5px] font-extrabold uppercase tracking-wide text-[#0b3d91] mb-0.5">Company Notice</p>
          <p className="text-[12px] leading-relaxed text-[#5b6784]">This is a computer generated invoice and does not require a signature. The warranty is subject to the terms and conditions printed on the official warranty card.</p>
        </section>
      </div>
    </CustomerLayout>
  );
}
