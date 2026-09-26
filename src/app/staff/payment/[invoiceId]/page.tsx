import { getPaymentByNumber } from "@/actions/paymentActions";
import { getStaffProfileStats, verifyStaffSession } from "@/actions/staffActions";
import { InvoicePreviewButton } from "@/components/features/invoices";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { PaymentDataType } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, Building2, Calendar, CheckCircle2, ChevronRight, Clock, Copy, Crown, Download, Eye, FileText, Settings, User, Wallet, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const logos: Record<string, string> = { bkash: "/bkash.png", nagad: "/nagad.png", rocket: "/rocket.png", bank: "/bank.png" };

export default async function StaffInvoiceDetailsPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;
  const { invoiceId } = await params;
  const [paymentRes, statsRes] = await Promise.all([getPaymentByNumber(invoiceId), getStaffProfileStats(session.userId as string)]);
  if (!paymentRes.success || !paymentRes.data) notFound();
  const payment = paymentRes.data as PaymentDataType;
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
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5">
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
          <div className="relative overflow-hidden rounded-md bg-[linear-gradient(100deg,#ffe9f1_0%,#fff5f9_100%)] border border-[#ffd6e5] p-3 flex items-start gap-3">
            <span className="flex flex-col gap-1 min-w-0 flex-1 text-[12px] font-semibold text-[#5b6784] uppercase tracking-wide">
              <span className="text-[18px] font-extrabold text-[#16213a] normal-case tracking-normal inline-flex items-center gap-1.5">{payment.receiverWalletNumber || payment.receiverBankInfo?.accountNumber || String(session.username)}<Copy size={14} className="text-[#1f7cf0]" /></span>
              <span>Staff-member <span className="text-[#c9d3e6]">•</span> {method || "N/A"}</span>
              <span>Wallet number <b className="text-[#16213a]">{payment.receiverWalletNumber || "N/A"}</b></span>
              <span>Amount <b className="text-[#16213a]">৳{amount.toLocaleString()}</b></span>
              <span>Trx ID <b className="text-[#16213a]">{payment.transactionId || "N/A"}</b></span>
            </span>
            <span className="flex flex-col items-center gap-1 shrink-0">
              {logos[method] ? <Image src={logos[method]} alt={method} width={72} height={72} className="size-16 object-contain" /> : <span className="size-16 rounded-md bg-white border border-[#ffd6e5] flex items-center justify-center text-[#e0243f]"><Wallet size={28} /></span>}
              <span className="px-2 h-6 rounded-md bg-[#ffd6e5] text-[#c81f38] text-[10px] font-extrabold inline-flex items-center uppercase">{method ? `${method} wallet` : "wallet"}</span>
            </span>
          </div>
        </section>

        {/* Sender */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={Building2} title="Sender Information" tone="bg-[#1a9c4b]" />
          <div className="flex items-start gap-3">
            <span className="flex flex-col gap-0.5 min-w-0 flex-1 text-[12.5px] text-[#3d4a63]">
              <span className="text-[15px] font-extrabold text-[#16213a]">SE ELECTRONICS <span className="text-[10px] font-bold text-[#5b6784] tracking-[2px] uppercase">Corporate Office</span></span>
              {isBank ? (<><span>Bank: <b>{payment.senderBankInfo?.bankName || "Corporate Bank"}</b></span><span>Account: <b>{payment.senderBankInfo?.accountNumber || "********4590"}</b></span></>) : (<><span>Merchant: <b>{payment.senderWalletNumber || "N/A"}</b></span><span>Payment Method: <b>{payment.paymentMethod || "N/A"}</b></span><span>Trx ID: <b>{payment.transactionId || "N/A"}</b></span></>)}
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#e9f9ef] text-[#178a42] text-[10px] font-extrabold uppercase"><CheckCircle2 size={12} />Verified merchant</span>
          </div>
        </section>

        {/* Service */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Head icon={Settings} title="Service Information" tone="bg-[#e0a11b]" />
          <div className="flex items-start gap-3">
            <span className="flex flex-col gap-0.5 min-w-0 flex-1 text-[12.5px] text-[#3d4a63]">
              <span>Service Id: <b className="text-[#16213a]">{payment.serviceId || "N/A"}</b></span>
              <span>Customer: <b className="text-[#16213a]">{String(session.username)}</b></span>
              <span>Date: <b className="text-[#16213a]">{formatDate(payment.date || payment.createdAt!)}</b></span>
              {payment.description && <span>Note: <b className="text-[#16213a]">{payment.description}</b></span>}
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
