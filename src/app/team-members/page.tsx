import { getAllTeamMembers } from "@/actions";
import { TeamMembers } from "@/components";
import { contactDetails } from "@/constants";
import { AppError } from "@/utils";
import PageBanner from "@/components/ui/PageBanner";
import { Mail, MapPin, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ staffId?: string }>;
}) {
  const { staffId } = await searchParams;
  const teamMembers = await getAllTeamMembers();

  if (!teamMembers.success) {
    throw new AppError("টিম মেম্বারদের তথ্য পাওয়া যায়নি।");
  }

  const staffs = teamMembers.data!;
  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
      <header className="bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 h-[56px] flex items-center gap-2.5">
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[16px] font-extrabold truncate">SE Electronics</span>
          <span className="text-[10.5px] text-white/85 font-medium truncate">Smart Solution &nbsp;Better Life</span>
        </span>
        <a href={`tel:${contactDetails.customerCare}`} aria-label="Call" className="size-9 rounded-md bg-white/15 border border-white/20 flex items-center justify-center"><Phone size={18} /></a>
      </header>

      <div className="mx-auto max-w-[1200px] px-2 pt-2 flex flex-col gap-2">
        {/* Banner */}
        <PageBanner src="/banners/team.jpg" alt="আমাদের টিম মেম্বার - একটি শক্তিশালী টিমই গড়ে তোলে সফলতার গল্প" width={803} height={232} />

        {/* Company contact (unchanged info) */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-1 text-[12px] text-[#3d4a63]">
          <span className="text-[14px] font-extrabold text-[#0b2a66]">এস ই ইলেকট্রনিকস সার্ভিস টিম মেম্বার</span>
          <span className="flex items-center gap-2"><Phone size={13} className="text-[#1f5fc9]" />হেল্পলাইন : <a href={`tel:${contactDetails.customerCare}`} className="font-bold text-[#1f5fc9]">{contactDetails.customerCare}</a></span>
          <span className="flex items-center gap-2"><Mail size={13} className="text-[#1f5fc9]" />Email : <b className="text-[#16213a]">{contactDetails.email}</b></span>
          <span className="flex items-start gap-2 text-[#5b6784]"><MapPin size={13} className="text-[#1f5fc9] mt-0.5 shrink-0" />হেড অফিস : {contactDetails.headOffice}</span>
        </section>

        <TeamMembers staffs={staffs} staffId={staffId} />
      </div>
    </div>
  );
}
