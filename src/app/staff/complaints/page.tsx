import { getComplaintsByStaff } from "@/actions/complaintActions";
import { verifyStaffSession } from "@/actions";
import { getStaffProfileStats } from "@/actions/staffActions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, ChevronRight, Clock, FileText, Gavel, History, ShieldAlert, User } from "lucide-react";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  completed: "সম্পন্ন",
  under_trial: "বিচারাধীন",
  processing: "প্রক্রিয়াধীন",
  hearing: "শুনানি",
};

const statusTone = (status: string) => {
  switch (status) {
    case "pending": return { chip: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]", icon: Clock, tile: "bg-[#ffe9ec] text-[#c81f38]" };
    case "completed": return { chip: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]", icon: CheckCircle, tile: "bg-[#e9f9ef] text-[#178a42]" };
    case "under_trial":
    case "processing":
    case "hearing": return { chip: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]", icon: Gavel, tile: "bg-[#fff6e3] text-[#b8620b]" };
    default: return { chip: "bg-[#eef1f6] text-[#5b6784] border-[#dfe6f2]", icon: FileText, tile: "bg-[#eef1f6] text-[#5b6784]" };
  }
};

export default async function StaffComplaintsPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const staffId = session.userId as string;
  const [complaintsRes, statsRes] = await Promise.all([
    getComplaintsByStaff(staffId, true), // fetch all complaints
    getStaffProfileStats(staffId),
  ]);

  const complaints = complaintsRes.success && complaintsRes.data ? complaintsRes.data : [];
  const stats = statsRes.success ? statsRes.data : null;

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="px-2 pt-2 pb-2 flex flex-col gap-2 text-[#16213a]">
        {/* Title */}
        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
          <History size={84} className="absolute -right-3 -bottom-4 text-white/10" />
          <Link href="/staff/profile" aria-label="Back" className="relative size-9 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
          <span className="relative size-11 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><ShieldAlert size={22} /></span>
          <span className="relative flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[clamp(17px,5vw,20px)] font-extrabold">অভিযোগের ইতিহাস</span>
            <span className="text-[12px] font-semibold text-white/85">মোট {complaints.length} টি রেকর্ড পাওয়া গেছে</span>
          </span>
          <span className="relative shrink-0 h-8 min-w-8 px-2 rounded-md bg-white text-[#0b3d91] text-[15px] font-extrabold inline-flex items-center justify-center">{complaints.length}</span>
        </section>

        {/* Complaints List */}
        {complaints.length > 0 ? (
          complaints.map((complaint) => {
            const tone = statusTone(complaint.status);
            return (
              <Link key={complaint.complaintId} href={`/staff/complaints/${complaint.complaintId}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-transform">
                <div className="flex items-start gap-2.5">
                  <span className="size-10 rounded-md bg-[#e8f1ff] text-[#1f5fc9] flex items-center justify-center shrink-0"><User size={20} /></span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-[14.5px] font-extrabold truncate">{complaint.customer?.name || "গ্রাহক"}</span>
                    <span className="text-[11px] font-bold text-[#5b6784] truncate">ID: {complaint.complaintId}</span>
                  </span>
                  <span className={clsx("shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-extrabold", tone.chip)}>
                    <tone.icon size={13} />{statusLabel[complaint.status] || complaint.status}
                  </span>
                </div>

                <div className="rounded-md bg-[#f5f8fd] border border-[#eef1f6] px-2.5 py-2">
                  <p className="text-[13.5px] font-extrabold line-clamp-1">{complaint.subject}</p>
                  <p className="text-[12px] text-[#5b6784] line-clamp-2 leading-relaxed">{complaint.description}</p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#5b6784]"><Calendar size={13} className="text-[#1f7cf0]" />{formatDate(complaint.createdAt)}</span>
                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold">বিস্তারিত<ChevronRight size={14} /></span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 flex flex-col items-center text-center gap-2">
            <span className="size-14 rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center"><CheckCircle size={30} /></span>
            <h3 className="text-[16px] font-extrabold">কোনো অভিযোগ নেই</h3>
            <p className="text-[12.5px] text-[#5b6784] max-w-[260px]">বর্তমানে আপনার বিরুদ্ধে কোনো আনুষ্ঠানিক অভিযোগ নেই।</p>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-2.5 flex gap-2.5">
          <span className="size-9 rounded-md bg-[#ffecb8] text-[#b8620b] flex items-center justify-center shrink-0"><AlertTriangle size={18} /></span>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-extrabold text-[#7a4a05]">প্রয়োজনীয় পদক্ষেপ</h4>
            <p className="text-[12px] text-[#8a5a12] leading-relaxed">যদি কোনো অভিযোগ &apos;শুনানি&apos; অবস্থায় থাকে, তাহলে নির্ধারিত তারিখে প্রধান কার্যালয়ে উপস্থিত হন অথবা প্রশাসনের সাথে যোগাযোগ করুন।</p>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
