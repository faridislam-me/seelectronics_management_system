import { getCustomerSubscriptions } from "@/actions/subscriptionActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { ArrowRight, Calendar, Clock, CreditCard, Package, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ActiveSubscriptionListPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const { data: allSubscriptions = [] } = await getCustomerSubscriptions(session.customer.customerId, session.customer.phone);
  const activeSubscriptions = allSubscriptions.filter((sub) => sub.isActive && sub.status === "active");

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        {/* Title */}
        <div className="relative flex items-center gap-3 pr-24">
          <span className="size-14 rounded-md bg-[#1f7cf0] text-white flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(31,124,240,0.35)]"><CreditCard size={28} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-[clamp(19px,5.6vw,24px)] font-extrabold">Active Subscriptions</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">Your currently active maintenance plans and their coverage.</span>
          </span>
          <span className="absolute right-0 top-1 font-script text-[clamp(14px,4vw,18px)] leading-[1] text-right text-[#0b3d91] rotate-[-8deg]">Stay Protected<br />Stay Powered</span>
        </div>

        {activeSubscriptions.length > 0 ? (
          activeSubscriptions.map((sub) => {
            const pct = sub.subscriptionDuration ? Math.min(100, Math.round((sub.servicesCompleted / sub.subscriptionDuration) * 100)) : 0;
            const name = sub.subscriptionType.replace(/_/g, " ");
            return (
              <article key={sub.subscriptionId} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <div className="flex items-start gap-3">
                  <span className="size-14 rounded-md bg-[linear-gradient(135deg,#0a2f70_0%,#1f7cf0_100%)] text-white flex items-center justify-center shrink-0"><ShieldCheck size={28} /></span>
                  <span className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[16px] font-extrabold capitalize leading-tight">{name}</span>
                    <span className="self-start px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10.5px] font-extrabold tracking-wide inline-flex items-center">PACKAGE</span>
                    <span className="self-start px-2 h-6 rounded-md bg-[#f5f7fb] border border-[#eef1f6] text-[11px] font-bold text-[#5b6784] inline-flex items-center">ID: {sub.subscriptionId}</span>
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#e9f9ef] text-[#178a42] text-[11px] font-extrabold"><span className="size-1.5 rounded-full bg-[#1a9c4b] animate-pulse" />ACTIVE</span>
                </div>

                <div className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] grid grid-cols-3 divide-x divide-[#e3e8f1] text-[11.5px]">
                  <span className="flex items-start gap-1.5 p-2 min-w-0"><Smartphone size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col min-w-0"><span className="text-[10px] font-semibold text-[#5b6784]">Subscription ID</span><b className="truncate">{sub.phone}</b></span></span>
                  <span className="flex items-start gap-1.5 p-2"><Calendar size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col"><span className="text-[10px] font-semibold text-[#5b6784]">Started On</span><b>{new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</b></span></span>
                  <span className="flex items-start gap-1.5 p-2"><Clock size={16} className="text-[#1f7cf0] shrink-0" /><span className="flex flex-col"><span className="text-[10px] font-semibold text-[#5b6784]">Services Used</span><b>{sub.servicesCompleted} of {sub.subscriptionDuration}</b></span></span>
                </div>

                <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2 flex items-center gap-2.5">
                  <span className="size-10 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><Wrench size={18} /></span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[11px] font-semibold text-[#1b6fd6]">Maintenance Coverage</span><span className="text-[13px] font-extrabold capitalize truncate">{name}</span></span>
                  <Link href={`/customer/plans/subscription/${sub.subscriptionId}`} className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md border-2 border-[#1f7cf0] bg-white text-[#1f7cf0] text-[12px] font-extrabold">View Details<ArrowRight size={14} /></Link>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#e3e8f1] overflow-hidden"><div className="h-full rounded-full bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)]" style={{ width: `${pct}%` }} /></div>
                  <span className="text-[13px] font-extrabold text-[#0b3d91] w-10 text-right">{pct}%</span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
            <Package size={40} className="text-[#c9d3e6]" />
            <span className="text-[14px] font-extrabold uppercase tracking-wide text-[#5b6784]">No Active Subscriptions</span>
            <span className="text-[12px] text-[#9aa4b8]">You don&apos;t have any active maintenance plans at the moment.</span>
            <Link href="/customer/maintenance-plans" className="mt-3 h-10 px-5 rounded-md bg-[#1f7cf0] text-white text-[13px] font-extrabold inline-flex items-center">Browse Plans</Link>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
