import { getComplaintById } from "@/actions/complaintActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { getObjectUrl } from "@/lib/s3";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, Calendar, Check, CheckCircle2, ChevronRight, Download, FileText, Info, MessageSquare, Search, Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ComplaintDocPage({ params }: { params: Promise<{ complaintId: string }> }) {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) return null;
  const { complaintId } = await params;
  const res = await getComplaintById(complaintId);
  if (!res.success || !res.data) notFound();
  const complaint = res.data as any;
  if (complaint.customerId !== session.customer.customerId) notFound();
  const evidencePhotoUrl = complaint.evidencePhotoKey ? await getObjectUrl(complaint.evidencePhotoKey) : null;

  const s = complaint.status as string;
  const isProcessing = ["processing", "hearing", "completed", "resolved"].includes(s);
  const isHearing = ["hearing", "completed", "resolved"].includes(s);
  const isCompleted = s === "completed" || s === "resolved";
  const dismissed = s === "dismissed";
  const statusLabel = isCompleted ? "সমাধান হয়েছে" : dismissed ? "খারিজ" : "অমীমাংসিত";

  const steps = [
    { title: "অভিযোগ গ্রহণ", desc: "আপনার অভিযোগটি সফলভাবে গৃহীত হয়েছে।", done: true, active: !isProcessing, date: complaint.createdAt, icon: Check, tone: "green" },
    { title: "তদন্ত চলছে", desc: "আমাদের টিম বিষয়টি যাচাই করছে।", done: isHearing, active: isProcessing && !isHearing, date: isProcessing ? complaint.updatedAt : null, icon: Search, tone: "blue" },
    { title: "সমাধান প্রক্রিয়া", desc: "সমস্যার সমাধান নিয়ে কাজ চলছে।", done: isCompleted, active: isHearing && !isCompleted, date: isHearing ? complaint.updatedAt : null, icon: Settings, tone: "purple" },
    { title: "সমাধান সম্পন্ন", desc: isCompleted ? "আপনার অভিযোগের সমাধান সম্পন্ন হয়েছে।" : "আপনার অভিযোগের সমাধান সম্পন্ন হবে শীঘ্রই।", done: isCompleted, active: false, date: isCompleted ? complaint.updatedAt : null, icon: Check, tone: "gray" },
  ];
  const tones: Record<string, { tile: string; row: string; chip: string }> = {
    green: { tile: "bg-[#1a9c4b]", row: "bg-[#e9f9ef]", chip: "bg-[#d4f3e0] text-[#178a42]" },
    blue: { tile: "bg-[#1f7cf0]", row: "bg-[#e8f1ff]", chip: "bg-[#d6e7ff] text-[#1b6fd6]" },
    purple: { tile: "bg-[#8b3fe8]", row: "bg-[#f3e9ff]", chip: "bg-[#e6d6fb] text-[#7a35d2]" },
    gray: { tile: "bg-[#5b6784]", row: "bg-[#f5f7fb]", chip: "bg-[#e6ebf4] text-[#5b6784]" },
  };

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        <div className="flex items-center gap-3">
          <Link href="/customer/complain" aria-label="Back" className="size-11 rounded-full bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight"><span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">অভিযোগের বিবরণ</span><span className="text-[12px] font-semibold text-[#5b6784]">আপনার অভিযোগের বিস্তারিত তথ্য</span></span>
        </div>

        {/* Complaint card */}
        <section className={clsx("rounded-md border p-3 flex flex-col gap-2.5", isCompleted ? "bg-[#e9f9ef] border-[#bfe8cd]" : "bg-[#ffe9ec] border-[#f7c3ca]")}>
          <div className="flex items-start gap-2.5">
            <span className={clsx("size-12 rounded-full text-white flex items-center justify-center shrink-0", isCompleted ? "bg-[#1a9c4b]" : "bg-[#e0243f]")}><User size={24} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className={clsx("text-[15px] font-extrabold", isCompleted ? "text-[#178a42]" : "text-[#c81f38]")}>গ্রাহকের দাখিলকৃত অভিযোগ</span>
              <span className="text-[12px] font-semibold text-[#3d4a63]"><b>{complaint.customer?.name}</b> এই অভিযোগটি দাখিল করেছেন।</span>
            </span>
            <span className={clsx("shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-extrabold", isCompleted ? "bg-[#d4f3e0] text-[#178a42]" : "bg-white text-[#c81f38]")}><AlertTriangle size={12} />{statusLabel}</span>
          </div>
          <div className="rounded-md bg-white/70 border border-white p-2.5 flex items-start gap-2.5">
            <span className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[13px] font-extrabold flex items-center gap-1.5"><FileText size={14} className="text-[#e0243f]" />বিষয়: {complaint.subject}</span>
              <span className="text-[12px] text-[#3d4a63] leading-relaxed italic whitespace-pre-line">&quot;অভিযুক্ত টেকনিশিয়ানের নাম: {complaint.staff?.name}, টেকনিশিয়ান আইডি: {complaint.staffId}{complaint.serviceId ? `, সার্ভিস আইডি: ${complaint.serviceId}` : ""} — {complaint.description}&quot;</span>
            </span>
            <AlertTriangle size={36} className="text-[#f7c3ca] shrink-0" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#3d4a63]"><Calendar size={13} className="text-[#e0243f]" />{formatDate(complaint.createdAt)} · ট্র্যাকিং নম্বর {complaint.complaintId}</span>
        </section>

        {/* Progress */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[15px] font-extrabold"><span className="size-9 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><Settings size={17} /></span>অভিযোগের অগ্রগতি</span>
            <Link href="/customer/complain/history" className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[11.5px] font-bold">বিস্তারিত দেখুন<ChevronRight size={12} /></Link>
          </div>
          <div className="relative flex flex-col gap-2 pl-1">
            <span className="absolute left-[27px] top-6 bottom-6 w-px bg-[#e3e8f1]" />
            {steps.map((st) => {
              const t = tones[st.tone];
              const on = st.done || st.active;
              return (
                <div key={st.title} className={clsx("relative rounded-md p-2.5 flex items-start gap-2.5", on ? t.row : "bg-[#f5f7fb]")}>
                  <span className={clsx("size-11 rounded-full text-white flex items-center justify-center shrink-0 z-10", on ? t.tile : "bg-[#9aa4b8]")}><st.icon size={20} /></span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-[14px] font-extrabold">{st.title}</span>
                    <span className="text-[11.5px] font-medium text-[#3d4a63]">{st.desc}</span>
                    {st.date && <span className="text-[11px] font-semibold text-[#5b6784] mt-0.5">{formatDate(st.date)}</span>}
                  </span>
                  <span className={clsx("shrink-0 h-7 px-2 rounded-md text-[11px] font-extrabold inline-flex items-center", on ? t.chip : "bg-[#e6ebf4] text-[#5b6784]")}>{st.done ? "সম্পন্ন" : st.active ? "চলমান" : "অপেক্ষমান"}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Officer */}
        {isHearing && (
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1.5">
            <span className="text-[14px] font-extrabold flex items-center gap-2"><ShieldCheck size={16} className="text-[#1a9c4b]" />দায়িত্বপ্রাপ্ত কর্মকর্তা</span>
            <span className="text-[12px] text-[#3d4a63]">আপনার অভিযোগটি পর্যালোচনা ও নিষ্পত্তির জন্য নিম্নলিখিত কর্মকর্তার কাছে প্রেরণ করা হয়েছে।</span>
            <span className="text-[11px] font-bold text-[#5b6784] uppercase tracking-wide mt-1">তদন্তকারী কর্মকর্তা (Investigation Officer)</span>
            <span className="text-[15px] font-extrabold">{complaint.hearingOfficerName || "মোঃ সাহাব উদ্দিন মাহমুদ"}</span>
            <span className="text-[13px] font-bold text-[#1a9c4b]">{complaint.hearingOfficerPhone || "০১৩১০৬৭৩৬০০"}</span>
            <span className="text-[12px] font-semibold">{complaint.hearingOfficerDesignation || "দায়িত্বরত কর্মকর্তা, প্রশাসনিক শাখা"}</span>
            <span className="text-[11.5px] text-[#5b6784]">সিলেট বিভাগীয় কার্যালয়, এস ই ইলেকট্রনিক্স</span>
            {isCompleted && complaint.punishmentType && (
              <div className="mt-1 rounded-md bg-[#ffe9ec] border border-[#f7c3ca] p-2.5">
                <span className="text-[11px] font-bold text-[#c81f38] uppercase tracking-wide">গৃহীত শাস্তিমূলক ব্যবস্থা (Disciplinary Action)</span>
                <span className="block text-[15px] font-extrabold text-[#c81f38] uppercase">{complaint.punishmentType}</span>
                {complaint.punishmentStartDate && <span className="text-[12px] font-bold text-[#c81f38]">সময়কালঃ {complaint.punishmentStartDate}{complaint.punishmentEndDate ? ` - ${complaint.punishmentEndDate}` : ""}</span>}
              </div>
            )}
          </section>
        )}

        {/* Company note */}
        <section className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-3 flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[15px] font-extrabold text-[#8a4a05]"><span className="size-9 rounded-md bg-[#e0a11b] text-white flex items-center justify-center"><MessageSquare size={17} /></span>কোম্পানির পক্ষ থেকে</span>
          <p className="text-[12.5px] italic text-[#5a3b00] leading-relaxed">&quot;{complaint.adminNote || "আমাদের নির্ধারিত সময়ের মধ্যে সমস্যার সমাধান করার জন্য আমরা আন্তরিকভাবে কাজ করছি। আপনার সহযোগিতার জন্য ধন্যবাদ। আমরা দ্রুত সমাধান নিয়ে আপনার সাথে যোগাযোগ করবো।"}&quot;</p>
          <span className="text-[10.5px] font-bold text-[#b8620b] uppercase tracking-wide">Updated on {formatDate(complaint.updatedAt)}</span>
        </section>

        {/* Attachments */}
        <section className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="size-11 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><FileText size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">সংযুক্তি (প্রমাণপত্র)</span><span className="text-[11.5px] font-semibold text-[#3d4a63]">আপনার অভিযোগের সাথে সংযুক্তি ফাইলগুলো এখানে দেখতে পারবেন।</span></span>
            <a href={`/pdf/download?type=complaint_customer&id=${complaint.complaintId}`} target="_blank" className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#1f7cf0] text-white text-[12px] font-extrabold"><Download size={14} />ডাউনলোড<ChevronRight size={12} /></a>
          </div>
          {evidencePhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={evidencePhotoUrl} alt="Evidence" className="w-full max-h-64 object-contain rounded-md bg-white border border-[#cfe0fb]" />
          )}
          <div className="flex flex-wrap gap-2">
            {isHearing && <a href={`/pdf/download?type=hearing-notice&id=${complaint.complaintId}`} target="_blank" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#cfe0fb] text-[#1b6fd6] text-[11.5px] font-bold"><Download size={13} />শুনানি নোটিশ</a>}
            {isCompleted && <a href={`/pdf/download?type=${complaint.punishmentType === "not_guilty" ? "staff-not-guilty" : "completion-notice"}&id=${complaint.complaintId}`} target="_blank" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#cfe0fb] text-[#1b6fd6] text-[11.5px] font-bold"><CheckCircle2 size={13} />নিষ্পত্তি নোটিশ</a>}
          </div>
        </section>

        {/* Policy */}
        <section className="relative overflow-hidden rounded-md bg-[#071f4d] text-white p-3 flex items-start gap-3">
          <ShieldCheck size={56} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10" />
          <span className="size-10 rounded-full bg-[#1f7cf0] flex items-center justify-center shrink-0"><Info size={20} /></span>
          <span className="flex flex-col leading-tight pr-14"><span className="text-[14px] font-extrabold">অভিযোগ নীতি</span><span className="text-[11.5px] text-white/85 leading-relaxed">আমাদের সঠিক অভিযোগ নিষ্পত্তি প্রক্রিয়া মেনে চলা হয়। গ্রাহকের অভিযোগ আমরা গুরুত্বের সাথে বিবেচনা করি এবং সমাধানের জন্য সর্বোচ্চ চেষ্টা করি।</span></span>
        </section>
      </div>
    </CustomerLayout>
  );
}
