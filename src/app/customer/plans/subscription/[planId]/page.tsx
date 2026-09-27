import { getCustomerSubscriptionById } from "@/actions/subscriptionActions";
import { CustomerLayout } from "@/components/layout";
import clsx from "clsx";
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Receipt,
  ShieldCheck,
  Smartphone,
  Tag,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PlanDetailsPageProps {
  params: Promise<{
    planId: string;
  }>;
}

const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
        <span className="size-7 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Icon size={14} /></span>
        <span className="text-[13.5px] font-extrabold text-[#0b3d91]">{title}</span>
      </div>
      <div className="p-2.5">{children}</div>
    </section>
  );
}

export default async function SubscriptionPlanDetailsPage({ params }: PlanDetailsPageProps) {
  const { planId } = await params;
  const { success, data: sub } = await getCustomerSubscriptionById(planId);

  if (!success || !sub) {
    notFound();
  }

  const isActive = sub.isActive && sub.status === "active";
  const progress = sub.subscriptionDuration ? (sub.servicesCompleted / sub.subscriptionDuration) * 100 : 0;
  const pct = Math.min(100, Math.round(progress));
  const name = sub.subscriptionType.replace(/_/g, " ");
  const statusCls = isActive
    ? "bg-[#e9f9ef] text-[#178a42]"
    : sub.status === "expired"
      ? "bg-[#fff6e3] text-[#b8620b]"
      : "bg-[#ffe9ec] text-[#c81f38]";

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Title */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Link href="/customer/plans/subscription" aria-label="Back to Plans" className="size-9 rounded-md bg-[#eef3fb] text-[#0b3d91] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[clamp(17px,5vw,21px)] font-extrabold">Subscription Details</span>
            <span className="text-[11.5px] font-semibold text-[#5b6784]">Back to Plans · আপনার প্ল্যানের বিস্তারিত</span>
          </span>
          <span className="font-script text-[clamp(13px,3.8vw,16px)] leading-[1] text-right text-[#0b3d91] rotate-[-8deg] shrink-0">Stay Protected<br />Stay Powered</span>
        </section>

        {/* Plan summary (same style as Active Subscriptions card) */}
        <article className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-start gap-3">
            <span className={clsx("size-14 rounded-md text-white flex items-center justify-center shrink-0", isActive ? "bg-[linear-gradient(135deg,#0a2f70_0%,#1f7cf0_100%)]" : "bg-[#9aa4b8]")}><ShieldCheck size={28} /></span>
            <span className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[16px] font-extrabold capitalize leading-tight">{name}</span>
              <span className="self-start px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10.5px] font-extrabold tracking-wide inline-flex items-center">PACKAGE</span>
              <span className="self-start px-2 h-6 rounded-md bg-[#f5f7fb] border border-[#eef1f6] text-[11px] font-bold text-[#5b6784] inline-flex items-center">Subscription ID: {sub.subscriptionId}</span>
            </span>
            <span className={clsx("shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-extrabold uppercase", statusCls)}>
              <span className={clsx("size-1.5 rounded-full", isActive ? "bg-[#1a9c4b] animate-pulse" : "bg-current")} />{sub.status}
            </span>
          </div>

          <div className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] grid grid-cols-3 divide-x divide-[#e3e8f1] text-[11.5px]">
            <span className="flex items-start gap-1.5 p-2 min-w-0"><Smartphone size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-semibold text-[#5b6784]">Phone</span><b className="text-[clamp(10px,2.9vw,11.5px)] whitespace-nowrap tracking-tight">{sub.phone}</b></span></span>
            <span className="flex items-start gap-1.5 p-2 min-w-0"><Calendar size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-semibold text-[#5b6784]">Subscribed On</span><b>{fmt(sub.createdAt)}</b></span></span>
            <span className="flex items-start gap-1.5 p-2 min-w-0"><Clock size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-semibold text-[#5b6784]">Plan Duration</span><b>{sub.subscriptionDuration} Months</b></span></span>
          </div>

          <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2 flex items-center gap-2.5">
            <span className="size-10 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><Wrench size={18} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[11px] font-semibold text-[#1b6fd6]">Maintenance Coverage</span><span className="text-[13px] font-extrabold capitalize truncate">{name}</span></span>
          </div>

          {/* Service usage */}
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2 text-[12px]">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0b3d91] whitespace-nowrap"><Activity size={14} />Service Usage Progress</span>
              <span className="font-extrabold text-[#16213a] whitespace-nowrap"><span className="text-[15px]">{sub.servicesCompleted}</span> <span className="text-[#5b6784]">/ {sub.subscriptionDuration}</span></span>
            </span>
            <span className="-mt-1 text-[11px] font-semibold text-[#5b6784]">Total Services Completed</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[#e3e8f1] overflow-hidden"><div className="h-full rounded-full bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)]" style={{ width: `${pct}%` }} /></div>
              <span className="text-[13px] font-extrabold text-[#0b3d91] w-10 text-right">{pct}%</span>
            </div>
          </div>
        </article>

        {/* Technical specifications */}
        <Card icon={Info} title="Technical Specifications">
          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            {[
              { icon: ShieldCheck, k: "Battery Type", v: sub.batteryType },
              { icon: Building2, k: "IPS Brand", v: sub.ipsBrand || "N/A" },
              { icon: Zap, k: "Power Rating", v: sub.ipsPowerRating || "N/A" },
              { icon: Calendar, k: "Plan Duration", v: `${sub.subscriptionDuration} Months` },
            ].map((r) => (
              <span key={r.k} className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] p-2 flex items-start gap-1.5 min-w-0">
                <r.icon size={15} className="text-[#1f7cf0] shrink-0 mt-0.5" />
                <span className="flex flex-col min-w-0"><span className="text-[10.5px] font-semibold text-[#5b6784] uppercase tracking-wide">{r.k}</span><b className="break-words">{r.v}</b></span>
              </span>
            ))}
          </div>
        </Card>

        {/* Address */}
        <Card icon={MapPin} title="Registered Address">
          <div className="flex gap-2.5 text-[12.5px]">
            <span className="size-10 rounded-md bg-[#f5f8fd] border border-[#eef1f6] text-[#5b6784] flex items-center justify-center shrink-0"><Building2 size={18} /></span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <b className="break-words">{sub.streetAddress}</b>
              <span className="text-[#5b6784]">
                {sub.policeStation && `${sub.policeStation}, `}
                {sub.postOffice && `${sub.postOffice}, `}
                {sub.district}
              </span>
              <a href={`tel:${sub.phone}`} className="mt-1 inline-flex items-center gap-1.5 font-bold text-[#1f5fc9]"><Smartphone size={13} />{sub.phone}</a>
            </span>
          </div>
        </Card>

        {/* Billing */}
        <section className="rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_24px_rgba(10,47,112,0.3)]">
          <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[2px] text-white/80 uppercase"><CreditCard size={14} />Billing Information</span>
          <div className="mt-2 flex flex-col gap-1.5 text-[13px]">
            <span className="flex justify-between text-white/85"><span>Base Price</span><span>৳{sub.basePrice.toLocaleString()}</span></span>
            {!!sub.surchargeAmount && <span className="flex justify-between text-white/85"><span>Surcharge</span><span>+৳{sub.surchargeAmount.toLocaleString()}</span></span>}
            {!!sub.discountAmount && <span className="flex justify-between text-[#9ff0bd]"><span>Discount</span><span>-৳{sub.discountAmount.toLocaleString()}</span></span>}
            <span className="mt-1 pt-2 border-t border-white/20 flex items-end justify-between">
              <span className="flex flex-col"><span className="text-[10px] font-extrabold tracking-[1.5px] text-white/70 uppercase">Total Amount</span><span className="text-[clamp(24px,7vw,30px)] font-extrabold leading-none">৳{sub.totalFee.toLocaleString()}</span></span>
              <span className="px-2 h-6 rounded-md bg-white/20 border border-white/30 text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center">Paid</span>
            </span>
          </div>
        </section>

        {/* Payment details */}
        <Card icon={Receipt} title="Payment Details">
          <div className="flex flex-col divide-y divide-[#eef1f6] text-[12.5px]">
            <span className="flex justify-between gap-2 py-1.5"><span className="text-[#5b6784] font-semibold uppercase text-[11px] tracking-wide">Method</span><b className="uppercase">{sub.paymentType}</b></span>
            {sub.transactionId && <span className="flex justify-between gap-2 py-1.5"><span className="text-[#5b6784] font-semibold uppercase text-[11px] tracking-wide">TXID</span><b className="truncate max-w-[60%]">{sub.transactionId}</b></span>}
            {sub.walletNumber && <span className="flex justify-between gap-2 py-1.5"><span className="text-[#5b6784] font-semibold uppercase text-[11px] tracking-wide">Wallet</span><b>{sub.walletNumber}</b></span>}
            {sub.bankInfo && <span className="flex justify-between gap-2 py-1.5"><span className="text-[#5b6784] font-semibold uppercase text-[11px] tracking-wide">Bank</span><b>{(sub.bankInfo as any).bankName}</b></span>}
          </div>
        </Card>

        {/* Timeline */}
        <Card icon={Clock} title="Timeline">
          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            <span className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] p-2 flex items-start gap-1.5"><CheckCircle2 size={15} className="text-[#1a9c4b] shrink-0 mt-0.5" /><span className="flex flex-col"><span className="text-[10.5px] font-semibold text-[#5b6784] uppercase tracking-wide">Subscribed On</span><b>{fmt(sub.createdAt)}</b></span></span>
            <span className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] p-2 flex items-start gap-1.5"><Tag size={15} className="text-[#1f7cf0] shrink-0 mt-0.5" /><span className="flex flex-col"><span className="text-[10.5px] font-semibold text-[#5b6784] uppercase tracking-wide">Last Activity</span><b>{fmt(sub.updatedAt)}</b></span></span>
          </div>
        </Card>
      </div>
    </CustomerLayout>
  );
}
