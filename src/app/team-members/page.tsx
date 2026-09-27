import { getAllTeamMembers } from "@/actions";
import { TeamMembers } from "@/components";
import { contactDetails } from "@/constants";
import { AppError } from "@/utils";
import { Mail, MapPin, Phone, Users } from "lucide-react";

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
        <section className="relative overflow-hidden rounded-md border border-[#cfe0fb] bg-[linear-gradient(100deg,#eaf2ff_0%,#f6f9ff_55%,#dbe8fb_100%)] p-3 min-h-[118px] flex items-center shadow-[0_6px_18px_rgba(11,61,145,0.08)]">
          <div className="relative z-10 flex items-start gap-2.5 pr-[34%]">
            <Users size={34} className="text-[#0b3d91] shrink-0" />
            <span className="flex flex-col gap-1 leading-tight">
              <span className="text-[clamp(18px,5.4vw,24px)] font-extrabold text-[#0b3d91]">আমাদের টিম মেম্বার</span>
              <span className="text-[12.5px] font-semibold text-[#3d4a63]">&quot;একটি শক্তিশালী টিমই গড়ে তোলে সফলতার গল্প&quot;</span>
            </span>
          </div>
          {/* building illustration */}
          <div aria-hidden className="absolute right-0 bottom-0 w-[34%] h-full">
            <div className="absolute right-3 bottom-0 w-[78%] h-[86%] rounded-t-md bg-[linear-gradient(180deg,#1d3f7a,#0b2a66)] grid grid-cols-3 gap-1 p-2 content-start">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} className="h-3 rounded-[2px] bg-[#7fb4ff]/60" />)}
            </div>
          </div>
        </section>

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
