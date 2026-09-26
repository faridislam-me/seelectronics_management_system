import { getCustomerSubscriptionApplications } from "@/actions/subscriptionActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowRight, Calendar, Check, CheckCircle2, Clock, Coins, Eye, FileText, Loader2, Search, Wrench, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ApplicationListPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const { data: applications = [] } = await getCustomerSubscriptionApplications(session.customer.customerId, session.customer.phone);

  const chip = (s: string) =>
    s === "approved" ? { cls: "bg-[#e9f9ef] text-[#178a42]", icon: CheckCircle2 } : s === "rejected" ? { cls: "bg-[#ffe9ec] text-[#c81f38]", icon: XCircle } : s === "processing" ? { cls: "bg-[#e8f1ff] text-[#1b6fd6]", icon: Loader2 } : { cls: "bg-[#fff6e3] text-[#b8620b]", icon: Clock };

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        <div className="relative flex items-center gap-3 pr-24">
          <span className="size-14 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><FileText size={28} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-[clamp(19px,5.6vw,24px)] font-extrabold">Application Tracking</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">Track the status of your maintenance plan applications.</span>
          </span>
          <span className="absolute right-0 top-0 font-script text-[clamp(14px,4vw,18px)] leading-[1] text-right text-[#0b3d91] rotate-[-8deg]">We&apos;re<br />with you<br />always</span>
        </div>

        {applications.length > 0 ? (
          applications.map((app: any) => {
            const s = app.status as string;
            const c = chip(s);
            const reviewed = s === "processing" || s === "approved";
            const approved = s === "approved";
            const rejected = s === "rejected";
            const steps = [
              { t: "Application Received", sub: formatDate(app.createdAt), done: true, cur: false },
              { t: "Under Review", sub: reviewed || rejected ? formatDate(app.updatedAt || app.createdAt) : "Ongoing", done: reviewed, cur: s === "pending", fail: rejected },
              { t: "In Progress", sub: approved ? "Ongoing" : "Pending", done: false, cur: approved },
              { t: "Completed", sub: "Pending", done: false, cur: false },
            ];
            return (
              <article key={app.applicationId} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <div className="flex items-start gap-3">
                  <span className="size-14 rounded-md bg-[#e8f1ff] flex items-center justify-center shrink-0"><span className="size-10 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Wrench size={20} /></span></span>
                  <span className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[16px] font-extrabold capitalize leading-tight">{app.subscriptionType.replace(/_/g, " ")}</span>
                    <span className="text-[12px] font-bold text-[#5b6784]">ID: {app.applicationId}</span>
                    <span className="flex items-center gap-3 text-[12px] font-semibold text-[#3d4a63]"><span className="inline-flex items-center gap-1"><Calendar size={13} className="text-[#1f7cf0]" />{formatDate(app.createdAt)}</span><span className="text-[#c9d3e6]">|</span><span className="inline-flex items-center gap-1"><Coins size={13} className="text-[#1f7cf0]" />৳{app.totalFee.toLocaleString()}</span></span>
                  </span>
                  <span className={clsx("shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-extrabold uppercase", c.cls)}><c.icon size={13} className={s === "processing" ? "animate-spin" : ""} />{s}</span>
                </div>

                <div className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] px-2 py-2.5 flex items-start">
                  {steps.map((st, i) => (
                    <div key={st.t} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1 w-[66px] text-center">
                        <span className={clsx("size-8 rounded-full flex items-center justify-center border-2", st.fail ? "bg-[#e0243f] border-[#e0243f] text-white" : st.done ? "bg-[#1a9c4b] border-[#1a9c4b] text-white" : st.cur ? "bg-white border-[#1f7cf0] text-[#1f7cf0] shadow-[0_0_0_4px_#dbeafe]" : "bg-white border-[#d7deea] text-[#9aa4b8]")}>
                          {st.fail ? <XCircle size={15} /> : st.done ? <Check size={15} strokeWidth={3} /> : st.cur ? <span className="size-3 rounded-full bg-[#1f7cf0]" /> : <Clock size={14} />}
                        </span>
                        <span className={clsx("text-[10.5px] font-extrabold leading-tight", st.cur ? "text-[#1b6fd6]" : st.done ? "text-[#16213a]" : "text-[#9aa4b8]")}>{st.t}</span>
                        <span className="text-[9.5px] font-semibold text-[#5b6784] leading-tight">{st.sub}</span>
                      </div>
                      {i < steps.length - 1 && <span className={clsx("flex-1 h-0.5 mt-4 -mx-2", st.done ? "bg-[#1a9c4b]" : "bg-[#d7deea]")} />}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/application-track?trackingId=${app.applicationId}`} className="h-11 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center justify-center gap-2"><Eye size={17} />View Details</Link>
                  <Link href={`/application-track?trackingId=${app.applicationId}`} className="h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(11,61,145,0.3)]"><ArrowRight size={17} />Track Progress</Link>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
            <Search size={40} className="text-[#c9d3e6]" />
            <span className="text-[14px] font-extrabold uppercase tracking-wide text-[#5b6784]">No Applications Found</span>
            <span className="text-[12px] text-[#9aa4b8]">You haven&apos;t applied for any maintenance plans yet.</span>
            <Link href="/customer/maintenance-plans" className="mt-3 h-10 px-5 rounded-md border-2 border-[#1f7cf0] text-[#1f7cf0] text-[13px] font-extrabold inline-flex items-center">Apply Now</Link>
          </div>
        )}

        <div className="flex justify-end pr-2 mt-1"><span className="font-script text-[18px] text-[#0b3d91] leading-tight text-right rotate-[-6deg]">SE Electronics<br /><span className="text-[14px]">Your Trusted Service Partner</span></span></div>
      </div>
    </CustomerLayout>
  );
}
