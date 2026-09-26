import { PaymentDataType } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Building2, Calendar, CheckCircle2, Clock, FileText, Hash, IdCard, Printer, Settings, User, Wallet, XCircle } from "lucide-react";

interface PaymentWebViewProps {
  data: Omit<PaymentDataType, "staff"> & { staff?: { name: string } };
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[42%_58%] border-b border-[#e6ebf4] last:border-0">
      <span className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f5f8fd] text-[13px] font-semibold text-[#3d4a63]"><Icon size={17} className="text-[#1f5fc9] shrink-0" />{label}</span>
      <span className="px-3 py-2.5 text-[13px] font-extrabold text-[#16213a] break-words">{children}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#dfe6f2] overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#e8f1ff]">
        <span className="size-10 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Icon size={19} /></span>
        <span className="text-[14px] font-extrabold tracking-[1.5px] text-[#0b3d91] uppercase">{title}</span>
      </div>
      <div className="p-2"><div className="rounded-md border border-[#e6ebf4] overflow-hidden">{children}</div></div>
    </section>
  );
}

/** Payment receipt ("Invoice View") shown in the preview modal. */
export default function PaymentWebView({ data }: PaymentWebViewProps) {
  const st = data.status as string;
  const paid = st === "completed" || st === "credited";
  const StatusIcon = paid ? CheckCircle2 : st === "rejected" ? XCircle : Clock;
  const statusLabel = st === "completed" ? "PAID" : st === "credited" ? "RECEIVED" : st.toUpperCase();
  const isBank = data.paymentMethod === "bank";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 text-[#16213a]">
      {/* Brand + invoice */}
      <section className="rounded-md border border-[#dfe6f2] overflow-hidden shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
        <div className="relative flex items-stretch min-h-[88px]">
          <div className="flex items-center gap-2.5 bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_100%)] text-white px-3 w-[58%] [clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]">
            <span className="text-[30px] font-extrabold italic tracking-[-2px] leading-none">SE</span>
            <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold">SE ELECTRONICS</span><span className="text-[9.5px] text-white/85">Trusted Power | Better Tomorrow</span></span>
          </div>
          <div className="flex-1 flex flex-col items-end justify-center gap-1.5 px-3">
            <span className="text-[20px] font-extrabold text-[#0b3d91] leading-none">{data.invoiceNumber.startsWith("BAL-") ? "RECEIPT" : "INVOICE"}</span>
            <span className="max-w-full truncate px-2.5 h-7 rounded-full bg-[#1f7cf0] text-white text-[11px] font-extrabold inline-flex items-center">#{data.invoiceNumber}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#e6ebf4] border-t border-[#e6ebf4] text-[11.5px]">
          <span className="flex items-start gap-2 p-2.5"><Calendar size={17} className="text-[#0b3d91] shrink-0" /><span className="flex flex-col"><span className="text-[10px] font-bold text-[#5b6784] tracking-wide">DATE</span><b>{formatDate(data.date || data.createdAt)}</b></span></span>
          <span className="flex items-start gap-2 p-2.5 min-w-0"><Hash size={17} className="text-[#0b3d91] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-bold text-[#5b6784] tracking-wide">RECEIPT NUMBER</span><b className="break-all">#{data.invoiceNumber}</b></span></span>
          <span className="flex items-start gap-2 p-2.5 min-w-0"><FileText size={17} className="text-[#0b3d91] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-bold text-[#5b6784] tracking-wide">ID</span><b className="break-all">{data.paymentId}</b></span></span>
        </div>
      </section>

      <Section icon={Building2} title="Sender Information">
        <Row icon={Building2} label="Company">SE ELECTRONICS</Row>
        <Row icon={Settings} label="Method"><span className="uppercase">{st === "credited" ? "SE Virtual Account" : data.paymentMethod}</span></Row>
        {isBank && data.senderBankInfo ? (
          <Row icon={Wallet} label="Bank">{data.senderBankInfo.bankName}<span className="block text-[12px] font-medium text-[#5b6784]">{data.senderBankInfo.accountNumber}</span></Row>
        ) : (
          <Row icon={Wallet} label="Wallet / TRX">{data.senderWalletNumber || "N/A"}<span className="block text-[12px] font-medium text-[#9aa4b8] break-all">{data.transactionId || "No Trx ID"}</span></Row>
        )}
        {data.serviceId && <Row icon={Hash} label="Service ID">#{data.serviceId}</Row>}
      </Section>

      <Section icon={User} title="Recipient Information">
        <Row icon={User} label="Staff"><span className="uppercase">{data.staff?.name || "N/A"}</span></Row>
        <Row icon={IdCard} label="Staff ID">{data.staffId}</Row>
        {isBank && data.receiverBankInfo ? (
          <Row icon={Wallet} label="Bank">{data.receiverBankInfo.bankName}<span className="block text-[12px] font-medium text-[#5b6784]">{data.receiverBankInfo.accountNumber}</span></Row>
        ) : (
          <Row icon={Wallet} label="Wallet">{st === "credited" ? "SE Virtual Account" : data.receiverWalletNumber || "N/A"}</Row>
        )}
        <Row icon={FileText} label="Details"><span className="italic font-medium text-[#3d4a63]">{data.description || "No description."}</span></Row>
      </Section>

      {/* Amount */}
      <section className={clsx("rounded-md border p-3 flex items-center gap-3", paid ? "bg-[#e9f9ef] border-[#bfe8cd]" : st === "rejected" ? "bg-[#ffe9ec] border-[#f7c3ca]" : "bg-[#fff6e3] border-[#f5dfa0]")}>
        <span className={clsx("size-12 rounded-full text-white flex items-center justify-center shrink-0 text-[20px] font-extrabold", paid ? "bg-[#1a9c4b]" : st === "rejected" ? "bg-[#e0243f]" : "bg-[#e0a11b]")}>৳</span>
        <span className="flex flex-col flex-1 min-w-0 leading-tight">
          <span className="text-[11px] font-bold tracking-[2px] text-[#5b6784]">AMOUNT</span>
          <span className={clsx("text-[clamp(26px,8vw,34px)] font-extrabold", paid ? "text-[#178a42]" : "text-[#16213a]")}>৳{data.amount.toLocaleString()} <small className="text-[13px]">TK</small></span>
        </span>
        <span className={clsx("shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] font-extrabold text-white", paid ? "bg-[#1a9c4b]" : st === "rejected" ? "bg-[#e0243f]" : "bg-[#e0a11b]")}><StatusIcon size={16} strokeWidth={2.6} />{statusLabel}</span>
      </section>

      <div className="grid grid-cols-2 divide-x divide-[#e6ebf4] rounded-md border border-[#dfe6f2] text-[12px]">
        <span className="flex items-center gap-2 p-2.5"><Calendar size={17} className="text-[#0b3d91]" /><span className="flex flex-col"><span className="text-[10px] font-bold text-[#5b6784]">DATE</span><b>{formatDate(data.date || data.createdAt)}</b></span></span>
        <span className="flex items-center gap-2 p-2.5 min-w-0"><Hash size={17} className="text-[#0b3d91]" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-bold text-[#5b6784]">ID</span><b className="truncate">{data.paymentId}</b></span></span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md bg-[linear-gradient(100deg,#eef3fb_0%,#dbe7fb_100%)] p-3">
        <span className="leading-tight"><span className="block font-script text-[22px] text-[#0b3d91]">Thank you</span><span className="text-[11.5px] text-[#3d4a63]">for choosing SE Electronics</span></span>
        <a href={`/pdf/download?type=payment&id=${data.invoiceNumber}`} target="_blank" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold shrink-0"><Printer size={16} />Download / Print</a>
      </div>
    </div>
  );
}
