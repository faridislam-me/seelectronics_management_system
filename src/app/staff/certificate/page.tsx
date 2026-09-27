import { verifyStaffSession } from "@/actions";
import { getCertificatePreviewData, getStaffById, getStaffCertificateToken, getStaffProfileStats } from "@/actions/staffActions";
import CertificateTemplate from "@/components/features/staff/CertificateTemplate";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { ArrowLeft, Award, BadgeCheck, Download, FileWarning, Headset, IdCard, Phone, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

function TitleCard({ subtitle }: { subtitle: string }) {
  return (
    <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.30)]">
      <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <Link href="/staff/profile" aria-label="Back" className="size-9 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Award size={24} /></span>
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">Certificate Preview</span>
          <span className="text-[12px] text-white/85 font-semibold truncate">{subtitle}</span>
        </span>
      </div>
    </section>
  );
}

export default async function StaffCertificatePage({ searchParams }: PageProps) {
  const { token: tokenParam } = await searchParams;
  const session = await verifyStaffSession();
  const userId = session.isAuth && session.userId ? (session.userId as string) : null;
  if (!tokenParam && !userId) notFound();

  const [staffRes, statsRes] = userId ? await Promise.all([getStaffById(userId), getStaffProfileStats(userId)]) : [null, null];
  const staff = staffRes?.success ? staffRes.data : null;
  const balance = statsRes?.success ? statsRes.data?.availableBalance || 0 : 0;

  // SMS links carry a token; the dashboard button opens this page without one,
  // so look up the latest certificate admin issued to this staff member.
  let token = tokenParam || null;
  if (!token && userId) {
    const certRes = await getStaffCertificateToken(userId, staff?.phone);
    token = certRes.success ? certRes.token : null;
  }

  const res = token ? await getCertificatePreviewData(token) : null;

  if (!res || !res.success || !res.data) {
    const notIssued = !token;
    return (
      <StaffLayout balance={balance}>
        <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2 flex flex-col gap-2.5">
          <TitleCard subtitle="SE Electronics Certificate" />
          <section className="rounded-md bg-white border border-[#dfe6f2] p-5 flex flex-col items-center gap-3 text-center shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <span className={notIssued ? "size-16 rounded-full bg-[#fff6e3] text-[#e0a11b] flex items-center justify-center" : "size-16 rounded-full bg-[#ffe9ec] text-[#e0243f] flex items-center justify-center"}>
              {notIssued ? <Award size={32} /> : <FileWarning size={32} />}
            </span>
            <h1 className="text-[17px] font-extrabold leading-snug text-[#0b2a66]">
              {notIssued ? "আপনার জন্য এস ই ইলেকট্রনিকস কোন সার্টিফিকেট ইস্যু করা হয়নি" : res?.message || "Invalid or Expired Link"}
            </h1>
            <p className="text-[12.5px] font-medium leading-relaxed text-[#5b6784]">
              {notIssued
                ? "সার্টিফিকেট পেতে অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।"
                : "The certificate link may have expired or is invalid. Please contact the administrator to issue a new certificate."}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <Link href="/staff/profile" className="h-10 rounded-md border border-[#bcd4fb] bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5"><ArrowLeft size={16} />Return to Dashboard</Link>
              <Link href="/staff/support" className="h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5"><Headset size={16} />Support</Link>
            </div>
          </section>
        </div>
      </StaffLayout>
    );
  }

  const data = res.data as any;

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2 flex flex-col gap-2.5">
        <TitleCard subtitle={data.shopName || "Shop Certificate"} />

        {/* Issued-to summary */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#e9f9ef] text-[#178a42] text-[11px] font-extrabold"><BadgeCheck size={14} />ISSUED BY SE ELECTRONICS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {data.ownerName && <span className="flex items-center gap-1.5 min-w-0"><BadgeCheck size={15} className="text-[#1f7cf0] shrink-0" /><b className="truncate">{data.ownerName}</b></span>}
            {data.shopName && <span className="flex items-center gap-1.5 min-w-0"><Store size={15} className="text-[#1f7cf0] shrink-0" /><b className="truncate">{data.shopName}</b></span>}
            {data.phone && <span className="flex items-center gap-1.5 min-w-0"><Phone size={15} className="text-[#1f7cf0] shrink-0" /><b className="truncate">{data.phone}</b></span>}
            {(data.memberNumber || data.shopId) && <span className="flex items-center gap-1.5 min-w-0"><IdCard size={15} className="text-[#1f7cf0] shrink-0" /><b className="truncate">{data.memberNumber || data.shopId}</b></span>}
          </div>
          <Link href={`/pdf/download?token=${token}`} target="_blank" className="h-10 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(31,124,240,0.3)]"><Download size={17} />Download PDF</Link>
        </section>

        {/* Preview */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-1.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] overflow-hidden">
          <div className="w-full aspect-[297/210] bg-white overflow-hidden relative flex items-center justify-center">
            <div className="origin-center scale-[0.3] min-[400px]:scale-[0.38] min-[500px]:scale-[0.48] sm:scale-[0.55] md:scale-[0.72] lg:scale-[0.85] xl:scale-100 transition-all duration-300">
              <CertificateTemplate data={data} />
            </div>
          </div>
        </section>
      </div>
    </StaffLayout>
  );
}
