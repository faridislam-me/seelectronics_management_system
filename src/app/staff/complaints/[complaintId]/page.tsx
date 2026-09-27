import { verifyStaffSession } from "@/actions";
import { getComplaintById } from "@/actions/complaintActions";
import { getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileDown,
  MessageSquare,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StaffComplaintDetailsPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const { complaintId } = await params;
  const [res, statsRes] = await Promise.all([
    getComplaintById(complaintId),
    getStaffProfileStats(session.userId as string),
  ]);

  if (!res.success || !res.data) notFound();

  const complaint = res.data;
  const stats = statsRes.success ? statsRes.data : null;

  // Security check: only the accused staff can see their complaint
  if (complaint.staffId !== session.userId) {
    notFound();
  }

  const isProcessing =
    complaint.status === "processing" ||
    complaint.status === "hearing" ||
    complaint.status === "completed";
  const isHearing =
    complaint.status === "hearing" || complaint.status === "completed";
  const isCompleted = complaint.status === "completed";

  const steps = [
    { title: "অপেক্ষমাণ", sub: formatDate(complaint.createdAt), done: true, iconDone: isProcessing || complaint.status === "under_trial", final: false },
    { title: "প্রক্রিয়াধীন", sub: isProcessing ? "তদন্তাধীন" : "নির্ধারিত পদক্ষেপের অপেক্ষায়", done: isProcessing, iconDone: isProcessing, final: false },
    { title: "শুনানি", sub: isHearing ? "সমন জারি হয়েছে" : "অপেক্ষমাণ", done: isHearing, iconDone: isHearing, final: false },
    { title: "নিষ্পত্তি", sub: isCompleted ? "সমাধান হয়েছে" : "চূড়ান্তকরণ", done: isCompleted, iconDone: isCompleted, final: true },
  ];
  const lastDone = steps.reduce((acc, st, i) => (st.done ? i : acc), 0);

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="px-2 pt-2 pb-2 flex flex-col gap-2 text-[#16213a]">
        {/* Header */}
        <section className="rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-2.5 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
          <Link href="/staff/profile" aria-label="Back" className="size-9 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
          <span className="size-10 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><ShieldAlert size={20} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[clamp(16px,4.8vw,19px)] font-extrabold">অভিযোগের বিস্তারিত</span>
            <span className="text-[11.5px] font-semibold text-white/85 truncate">ট্র্যাকিং আইডি: {complaint.complaintId}</span>
          </span>
        </section>

        {/* Complaint Warning Card */}
        <section className="relative overflow-hidden rounded-md bg-[#fff1f3] border border-[#f7c3ca] p-2.5 flex flex-col gap-2">
          <AlertTriangle size={70} className="absolute -right-2 -top-2 text-[#e0243f]/10" />
          <div className="relative flex items-center gap-2.5">
            <span className="size-10 rounded-md bg-white text-[#e0243f] flex items-center justify-center shrink-0 shadow-sm"><User size={20} /></span>
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="text-[14.5px] font-extrabold text-[#b3182f]">গ্রাহকের দাখিলকৃত অভিযোগ</span>
              <span className="text-[12px] font-semibold text-[#c81f38]/80">{complaint.customer?.name} এই অভিযোগটি দাখিল করেছেন।</span>
            </span>
          </div>
          <div className="relative rounded-md bg-white/80 border border-[#f7c3ca] p-2.5">
            <p className="text-[13px] font-extrabold text-[#9b1427] mb-1">বিষয়: {complaint.subject}</p>
            <p className="text-[12.5px] text-[#3d4a63] leading-relaxed">&quot;{complaint.description}&quot;</p>
          </div>
        </section>

        {/* Status Tracker */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <h3 className="text-[14px] font-extrabold text-[#0b3d91] mb-2">অভিযোগের ধাপসমূহ</h3>
          <ol className="flex flex-col">
            {steps.map((st, i) => {
              const current = i === lastDone;
              return (
                <li key={st.title} className="flex gap-2.5">
                  <span className="flex flex-col items-center">
                    <span className={clsx("relative size-7 rounded-full border-2 flex items-center justify-center shrink-0", st.iconDone ? (st.final ? "bg-[#1a9c4b] border-[#1a9c4b] text-white" : "bg-[#e9f9ef] border-[#1a9c4b] text-[#1a9c4b]") : "bg-white border-[#d7deea] text-[#c3cad8]")}>
                      {current && st.iconDone && <span className="absolute inset-0 rounded-full bg-[#1a9c4b]/30 animate-ping" />}
                      <CheckCircle size={14} />
                    </span>
                    {i < steps.length - 1 && <span className={clsx("w-0.5 flex-1 min-h-3", steps[i + 1].done ? "bg-[#1a9c4b]" : "bg-[#e3e8f1]")} />}
                  </span>
                  <div className={clsx("flex-1 mb-2 rounded-md border px-2.5 py-1.5", st.done ? (st.final ? "bg-[#1a9c4b] border-[#1a9c4b] text-white" : "bg-[#f3fbf6] border-[#cdeedb]") : "bg-[#f7f9fc] border-[#eef1f6] opacity-70")}>
                    <h4 className={clsx("text-[13px] font-extrabold leading-tight", st.done ? (st.final ? "text-white" : "text-[#146c36]") : "text-[#9aa4b8]")}>{st.title}</h4>
                    <span className={clsx("mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold", st.done ? (st.final ? "text-white/90" : "text-[#178a42]") : "text-[#b3bccb]")}><Calendar size={12} />{st.sub}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Admin Resolution / Notes */}
        {complaint.adminNote && (
          <section className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="size-8 rounded-md bg-[#ffecb8] text-[#b8620b] flex items-center justify-center"><MessageSquare size={16} /></span>
              <h4 className="text-[13.5px] font-extrabold text-[#7a4a05]">অ্যাডমিন রেজোলিউশনের বিস্তারিত</h4>
            </div>
            <div className="rounded-md bg-white border border-[#f5dfa0] p-2.5">
              <p className="text-[12.5px] text-[#3d4a63] leading-relaxed font-semibold italic">&quot;{complaint.adminNote}&quot;</p>
            </div>
            <p className="text-[10.5px] font-bold text-[#b8620b]/70 text-center">Updated on {formatDate(complaint.updatedAt)}</p>
          </section>
        )}

        {/* Punishment Document Download - Only for completed complaints */}
        {isCompleted && (
          <section className="rounded-md bg-[#eef4fd] border border-[#cfe0fb] p-2.5 flex items-center gap-2.5">
            <span className="size-10 rounded-md bg-white text-[#1f5fc9] flex items-center justify-center shrink-0 shadow-sm"><FileDown size={20} /></span>
            <span className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-[13.5px] font-extrabold text-[#0b3d91]">{complaint.punishmentType === "not_guilty" ? "নিষ্পত্তি ও দায়মুক্তি পত্র" : "শাস্তিমূলক আদেশনামা"}</span>
              <span className="text-[11.5px] text-[#1f5fc9]/80">{complaint.punishmentType === "not_guilty" ? "আপনার দায়মুক্তি পত্রটি ডাউনলোড করুন" : "আপনার বিরুদ্ধে গৃহীত শাস্তিমূলক ব্যবস্থার আদেশনামা ডাউনলোড করুন"}</span>
            </span>
            <Link
              href={`/pdf/download?type=${complaint.punishmentType === "not_guilty" ? "staff-not-guilty" : "complaint"}&id=${complaint.complaintId}`}
              target="_blank"
              className="shrink-0 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12.5px] font-extrabold inline-flex items-center gap-1.5"
            >
              <FileDown size={15} />ডাউনলোড
            </Link>
          </section>
        )}

        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#0b3d91_100%)] text-white p-2.5">
          <ShieldAlert size={60} className="absolute -right-2 -top-2 text-white/10" />
          <h4 className="relative text-[14.5px] font-extrabold mb-1">অভ্যন্তরীণ নীতি</h4>
          <p className="relative text-[12.5px] text-white/80 leading-relaxed">
            আমাদের স্টাফ গাইডলাইন অনুসারে, যেকোনো অভিযোগ ৪৮ ঘণ্টার মধ্যে পর্যালোচনা করা আবশ্যক। অনুগ্রহ করে ম্যানেজমেন্টের সাথে সমন্বয় করুন যদি শুনানির তারিখ নির্ধারিত হয়।
          </p>
        </section>
      </div>
    </StaffLayout>
  );
}
