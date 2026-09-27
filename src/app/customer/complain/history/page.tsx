import { verifyCustomerSession } from "@/actions/customerActions";
import { getComplaintsByCustomer } from "@/actions/complaintActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Calendar, CheckCircle2, ChevronRight, Clock, Download, FileText, Gavel, Plus, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";

type Tone = { label: string; chip: string; badge: string; strip: string; icon: typeof CheckCircle2; msg: string };

function toneFor(status: string): Tone {
  if (status === "completed" || status === "resolved")
    return { label: status === "resolved" ? "RESOLVED" : "COMPLETED", chip: "bg-[#e9f9ef] text-[#178a42]", badge: "bg-[#1a9c4b]", strip: "bg-[#eefaf2] text-[#178a42]", icon: CheckCircle2, msg: "আপনার অভিযোগটি সফলভাবে সমাধান করা হয়েছে।" };
  if (status === "dismissed")
    return { label: "DISMISSED", chip: "bg-[#ffe9ec] text-[#c81f38]", badge: "bg-[#e0243f]", strip: "bg-[#fff1f3] text-[#c81f38]", icon: XCircle, msg: "আপনার অভিযোগটি খারিজ করা হয়েছে।" };
  if (status === "hearing")
    return { label: "HEARING", chip: "bg-[#fff6e3] text-[#b8620b]", badge: "bg-[#e0a11b]", strip: "bg-[#fffaf0] text-[#b8620b]", icon: Gavel, msg: "আপনার অভিযোগটির শুনানি চলছে।" };
  return { label: status === "processing" ? "IN PROGRESS" : status.replace(/_/g, " ").toUpperCase(), chip: "bg-[#e8f1ff] text-[#1b6fd6]", badge: "bg-[#0b3d91]", strip: "bg-[#eef4fd] text-[#1b6fd6]", icon: Clock, msg: "আপনার অভিযোগটি প্রক্রিয়াধীন রয়েছে।" };
}

export default async function ComplaintHistoryPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4 text-center">
        <div>
          <h2 className="text-xl font-extrabold mb-4">Please log in to view your complaints</h2>
          <Link href="/customer/login" className="bg-[#1f7cf0] text-white font-bold py-3 px-6 rounded-md">Login</Link>
        </div>
      </div>
    );
  }

  const res = await getComplaintsByCustomer(session.customer.customerId);
  const complaints = (res.success ? res.data || [] : []) as any[];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <span className="size-11 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_rgba(11,61,145,0.3)]"><FileText size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[clamp(16px,4.8vw,21px)] font-extrabold">My Complaints<span className="min-w-5 h-5 px-1.5 rounded-full bg-[#e0243f] text-white text-[11px] font-extrabold inline-flex items-center justify-center">{complaints.length}</span></span>
            <span className="text-[11px] font-semibold text-[#5b6784] leading-tight">Track and manage your complaint requests</span>
          </span>
          <Link href="/customer/complain" className="shrink-0 inline-flex items-center gap-1 h-9 px-2 rounded-md bg-[#1f7cf0] text-white text-[11px] font-extrabold leading-tight max-w-[112px] text-center shadow-[0_6px_14px_rgba(31,124,240,0.3)]"><Plus size={15} strokeWidth={3} />File New Complaint</Link>
        </div>

        {complaints.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
            <span className="size-14 rounded-full bg-[#f5f7fb] flex items-center justify-center"><FileText className="text-[#c9d3e6]" size={30} /></span>
            <span className="text-[15px] font-extrabold">No complaints filed</span>
            <span className="text-[12px] text-[#5b6784]">When you file a complaint about staff, it will appear here.</span>
          </div>
        ) : (
          complaints.map((c) => {
            const t = toneFor(c.status as string);
            return (
              <article key={c.id} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx("inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full text-[11px] font-extrabold tracking-wide", t.chip)}><span className={clsx("size-5 rounded-full text-white flex items-center justify-center", t.badge)}><t.icon size={12} strokeWidth={3} /></span>{t.label}</span>
                  <span className="text-[11.5px] font-bold text-[#5b6784] truncate">#{c.complaintId}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="relative size-12 rounded-full bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center shrink-0">
                    <FileText size={24} />
                    <span className={clsx("absolute -right-0.5 -bottom-0.5 size-5 rounded-full border-2 border-white text-white flex items-center justify-center", t.badge)}><t.icon size={10} strokeWidth={3} /></span>
                  </span>
                  <span className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[15.5px] font-extrabold leading-snug">{c.subject}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-[#5b6784]">
                      <span className="inline-flex items-center gap-1"><Calendar size={13} className="text-[#3d4a63]" />{formatDate(c.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 min-w-0"><ShieldAlert size={13} className="text-[#e0243f] shrink-0" />Against: <b className="text-[#16213a] truncate">{c.staff?.name}</b></span>
                    </span>
                  </span>
                </div>

                <div className={clsx("rounded-md px-2.5 py-2 flex items-center gap-2 text-[12px] font-bold", t.strip)}><t.icon size={15} className="shrink-0" />{t.msg}</div>

                <div className={clsx("grid gap-2", c.status === "completed" ? "grid-cols-2" : "grid-cols-1")}>
                  <Link href={`/customer/complain/doc/${c.complaintId}`} className="h-10 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5"><FileText size={16} />View Doc<ChevronRight size={15} /></Link>
                  {c.status === "completed" && (
                    <Link href={`/pdf/download?type=${c.punishmentType === "not_guilty" ? "staff-not-guilty" : "completion-notice"}&id=${c.complaintId}`} target="_blank" className="h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-[0_6px_14px_rgba(11,61,145,0.3)]"><Download size={16} />Download PDF<ChevronRight size={15} /></Link>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </CustomerLayout>
  );
}
