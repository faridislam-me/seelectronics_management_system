import { getPaymentByNumber } from "@/actions/paymentActions";
import { getServiceById } from "@/actions";
import { getStaffProfileStats, verifyStaffSession } from "@/actions/staffActions";
import { InvoicePreviewButton } from "@/components/features/invoices";
import { methodLogos, methodThemes } from "@/components/features/payments/paymentThemes";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { PaymentDataType } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, Building2, Calendar, CheckCircle2, ChevronRight, Clock, Copy, Crown, Download, Eye, FileText, Settings, User, Wallet, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const logos = methodLogos;
const themes = methodThemes;

export default async function StaffInvoiceDetailsPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;
  const { invoiceId } = await params;
  const [paymentRes, statsRes] = await Promise.all([getPaymentByNumber(invoiceId), getStaffProfileStats(session.userId as string)]);
  if (!paymentRes.success || !paymentRes.data) notFound();
  const payment = paymentRes.data as PaymentDataType;
  // Credited payments often carry the job id only in the note ("Service charge added for job #SEXXXX").
  // The job id may be stored on the payment or only written in the note, with or
  // without "#" (e.g. "...job #SEKXUBYAED" or "সার্ভিস আই ডি পেমেন্ট টা SEP7WH2OO3 ...").
  // Try every SE-prefixed code that contains a digit until one matches a service.
  const noteIds = [...(payment.description || "").toUpperCase().matchAll(/\bSE(?=[A-Z]*\d)[A-Z0-9]{6,12}\b/g)].map((m) => m[0]);
  const candidates = [...new Set([payment.serviceId, ...noteIds].filter(Boolean) as string[])];
  let service: any = null;
  let jobId: string | null = payment.serviceId || noteIds[0] || null;
  for (const id of candidates) {
    const res = await getServiceById(id).catch(() => null);
    if (res?.success && res.data) { service = res.data; jobId = id; break; }
  }
  const svcStatus = (service?.status as string | undefined) ?? null;
  const svcAddress = service ? [service.customerAddress, service.customerAddressPoliceStation, service.customerAddressDistrict].filter(Boolean).join(", ") : "";
  const stats = statsRes.success ? statsRes.data : null;
  if (payment.staffId !== session.userId) notFound();

  const st = payment.status as string;
  const status = st === "credited" ? { label: "RECEIVED", cls: "bg-[#1a9c4b] text-white", icon: CheckCircle2 } : st === "completed" ? { label: "PAID", cls: "bg-[#1a9c4b] text-white", icon: CheckCircle2 } : st === "rejected" ? { label: "REJECTED", cls: "bg-[#e0243f] text-white", icon: XCircle } : { label: st.toUpperCase(), cls: "bg-[#e0a11b] text-white", icon: Clock };
  const method = (payment.paymentMethod || "").toLowerCase();
  const isBank = method === "bank";
  const amount = Number(payment.amount || 0);
  const Row = ({ k, v, accent }: { k: string; v: React.ReactNode; accent?: string }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#eef1f6] last:border-0 text-[13px]"><span className="font-semibold text-[#3d4a63]">{k}</span><span className={clsx("font-extrabold", accent)}>{v}</span></div>
  );
  const Head = ({ icon: Icon, title, tone }: { icon: any; title: string; tone: string }) => (
    <span className="flex items-center gap-2.5"><span className={`size-10 rounded-full ${tone} text-white flex items-center justify-center`}><Icon size={19} /></span><span className="text-[15px] font-extrabold">{title}</span></span>
  );

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <Link href="/staff/payment" aria-label="Back" className="size-11 rounded-full bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight min-w-0"><span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">Payment Details</span><span className="text-[12px] font-semibold text-[#5b6784]">Invoice Information &amp; Transaction Details</span></span>
        </div>

        {/* Invoice banner */}
        <section className={clsx("rounded-md border p-3 flex items-center gap-3", st === "rejected" ? "bg-[#ffe9ec] border-[#f7c3ca]" : "bg-[#e9f9ef] border-[#bfe8cd]")}>
          <span className={clsx("size-12 rounded-full text-white flex items-center justify-center shrink-0", st === "rejected" ? "bg-[#e0243f]" : "bg-[#1a9c4b]")}><FileText size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[10.5px] font-bold text-[#5b6784] tracking-wide">INVOICE</span>
            <span className="text-[clamp(13px,3.8vw,16px)] font-extrabold break-all">{payment.invoiceNumber}</span>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5b6784]"><Calendar size={12} />{formatDate(payment.date || payment.createdAt!)}</span>
          </span>
          <span className={clsx("shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-[11px] font-extrabold", status.cls)}><status.icon size={13} strokeWidth={2.8} />{status.label}</span>
        </section>

        {/* Payment information */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={Wallet} title="Payment Information" tone="bg-[#1f7cf0]" />
          <div className="rounded-md bg-[#f5f7fb] px-3">
            <Row k="Amount Delivered" v={`৳${amount.toLocaleString()}`} />
            <Row k="Sub-Total" v={`৳${amount.toLocaleString()}`} />
            <Row k="COD Charge & Fees" v="+৳0" accent="text-[#e0243f]" />
          </div>
          <div className="border-t border-dashed border-[#c9d3e6] pt-2 flex items-center gap-2">
            <span className="size-9 rounded-md bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><FileText size={17} /></span>
            <span className="text-[13px] font-bold text-[#3d4a63] flex-1 truncate">{payment.receiverWalletNumber || String(session.username)}</span>
            <span className="text-[13px] font-bold text-[#3d4a63]">Total Settlement</span>
            <span className="rounded-md bg-[#e9f9ef] text-[#178a42] px-2.5 py-1 text-[18px] font-extrabold leading-none">৳{amount.toLocaleString()}</span>
          </div>
        </section>

        {/* Recipient */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={User} title="Recipient Information" tone="bg-[#8b3fe8]" />
          {(() => {
            const isVirtual = st === "credited";
            const key = isVirtual ? "virtual" : themes[method] ? method : "bank";
            const t = themes[key];
            const dark = key === "virtual";
            const idLine = isVirtual ? String(payment.staffId) : payment.receiverWalletNumber || payment.receiverBankInfo?.accountNumber || String(session.username);
            return (
              <div className={clsx("relative overflow-hidden rounded-md border p-3 flex items-start gap-3", t.card, t.border)}>
                {/* watermark */}
                <span className={clsx("absolute -right-4 -bottom-6 opacity-[0.08] pointer-events-none", t.mark)}>
                  {logos[key] ? <Image src={logos[key]} alt="" width={140} height={140} className="size-32 object-contain" /> : <Wallet size={120} />}
                </span>
                <span className={clsx("relative flex flex-col gap-1 min-w-0 flex-1 text-[12px] font-semibold uppercase tracking-wide", dark ? "text-white/80" : "text-[#5b6784]")}>
                  <span className={clsx("text-[18px] font-extrabold normal-case tracking-normal inline-flex items-center gap-1.5", dark ? "text-white" : "text-[#16213a]")}>{idLine}<Copy size={14} className={dark ? "text-[#7fb4ff]" : "text-[#1f7cf0]"} /></span>
                  <span>Staff-member <span className="opacity-50">•</span> {isVirtual ? "Virtual Balance" : method || "N/A"}</span>
                  {isVirtual ? (
                    <><span>Account <b className="text-white">SE Virtual Account</b></span><span>Credited for <b className="text-white">{jobId ? `Job #${jobId}` : "Completed service"}</b></span></>
                  ) : (
                    <span>{key === "bank" ? "Account number" : "Wallet number"} <b className="text-[#16213a]">{payment.receiverWalletNumber || payment.receiverBankInfo?.accountNumber || "N/A"}</b></span>
                  )}
                  <span>Amount <b className={dark ? "text-white" : "text-[#16213a]"}>৳{amount.toLocaleString()}</b></span>
                  <span>Trx ID <b className={dark ? "text-white" : "text-[#16213a]"}>{payment.transactionId || "N/A"}</b></span>
                </span>
                <span className="relative flex flex-col items-center gap-1.5 shrink-0">
                  {isVirtual ? (
                    <span className="size-16 rounded-md bg-white/15 border border-white/25 text-white flex flex-col items-center justify-center"><Wallet size={28} /></span>
                  ) : logos[key] ? (
                    <span className="size-16 rounded-md bg-white border border-white flex items-center justify-center shadow-sm"><Image src={logos[key]} alt={key} width={56} height={56} className="size-12 object-contain" /></span>
                  ) : (
                    <span className={clsx("size-16 rounded-md bg-white flex items-center justify-center shadow-sm", t.mark)}><Wallet size={28} /></span>
                  )}
                  <span className={clsx("px-2 h-6 rounded-md text-[10px] font-extrabold inline-flex items-center uppercase whitespace-nowrap", t.chip)}>{t.label}</span>
                </span>
              </div>
            );
          })()}
        </section>

        {/* Sender */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={Building2} title="Sender Information" tone="bg-[#1a9c4b]" />
          <div className="flex items-start gap-3">
            <span className="flex flex-col gap-0.5 min-w-0 flex-1 text-[12.5px] text-[#3d4a63]">
              <span className="text-[15px] font-extrabold text-[#16213a]">SE ELECTRONICS <span className="text-[10px] font-bold text-[#5b6784] tracking-[2px] uppercase">Corporate Office</span></span>
              {isBank ? (<><span>Bank: <b>{payment.senderBankInfo?.bankName || "Corporate Bank"}</b></span><span>Account: <b>{payment.senderBankInfo?.accountNumber || "********4590"}</b></span></>) : (<><span>Merchant: <b>{payment.senderWalletNumber || "N/A"}</b></span><span>Payment Method: <b>{st === "credited" ? "SE Virtual Account" : payment.paymentMethod || "N/A"}</b></span><span>Trx ID: <b>{payment.transactionId || "N/A"}</b></span></>)}
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#e9f9ef] text-[#178a42] text-[10px] font-extrabold uppercase"><CheckCircle2 size={12} />Verified merchant</span>
          </div>
        </section>

        {/* Service */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={Settings} title="Service Information" tone="bg-[#e0a11b]" />
          <div className="flex items-start gap-3">
            <span className="flex flex-col gap-0.5 min-w-0 flex-1 text-[12.5px] text-[#3d4a63]">
              <span>Service Id: <b className="text-[#16213a]">{jobId || "N/A"}</b></span>
              <span>Customer: <b className="text-[#16213a]">{service?.customerName || "N/A"}</b></span>
              <span>Mobile: {service?.customerPhone ? <a href={`tel:${service.customerPhone}`} className="font-bold text-[#1f5fc9]">{service.customerPhone}</a> : <b className="text-[#16213a]">N/A</b>}</span>
              <span>Address: <b className="text-[#16213a]">{svcAddress || "N/A"}</b></span>
              {service?.productType && <span>Product: <b className="text-[#16213a] uppercase">{service.productType}</b>{service.productModel ? <b className="text-[#16213a]"> · {service.productModel}</b> : null}</span>}
              <span>Date: <b className="text-[#16213a]">{formatDate(payment.date || payment.createdAt!)}</b></span>
              {payment.description && <span>Note: <b className="text-[#16213a]">{payment.description}</b></span>}
              {svcStatus && (
                <span className="mt-1 inline-flex items-center gap-1.5 self-start">
                  Job Status:
                  <span className={clsx("inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-extrabold uppercase", svcStatus === "completed" ? "bg-[#e9f9ef] text-[#178a42]" : svcStatus === "canceled" ? "bg-[#ffe9ec] text-[#c81f38]" : "bg-[#e8f1ff] text-[#1b6fd6]")}>
                    {svcStatus === "completed" ? <CheckCircle2 size={13} /> : svcStatus === "canceled" ? <XCircle size={13} /> : <Clock size={13} />}
                    {svcStatus === "completed" ? "Completed" : svcStatus.replace(/_/g, " ")}
                  </span>
                </span>
              )}
            </span>
            <span className="flex flex-col items-end gap-1 shrink-0">
              <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-[#fff6e3] text-[#b8620b] text-[11px] font-extrabold uppercase"><Crown size={13} />{st === "credited" ? "Credited" : st}</span>
              <span className="text-[12px] font-bold text-[#3d4a63]">COD: <b className="text-[#16213a]">{amount.toLocaleString()}</b></span>
            </span>
          </div>
        </section>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2">
          <InvoicePreviewButton paymentData={payment} className="h-11 w-full rounded-md border-2 border-[#1f7cf0] bg-white text-[#1f7cf0] text-[14px] font-extrabold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Eye size={18} /><span>Preview Invoice</span><ChevronRight size={16} />
          </InvoicePreviewButton>
          {st === "completed" && (
            <a target="_blank" href={`/pdf/download?type=payment&id=${payment.invoiceNumber}`} className="h-11 w-full rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2"><Download size={18} />Download Receipt</a>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
