import { getComplaintById } from "@/actions/complaintActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { getObjectUrl } from "@/lib/s3";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, Camera, CheckCircle, Download, FileText, MessageSquare, ShieldCheck } from "lucide-react";
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

  const eleclogo = "/elecLogo.png";
  const elecSign = "/elecSign.png";
  const evidencePhotoUrl = complaint.evidencePhotoKey ? await getObjectUrl(complaint.evidencePhotoKey) : null;
  const isProcessing = ["processing", "hearing", "completed"].includes(complaint.status);
  const isHearing = ["hearing", "completed"].includes(complaint.status);
  const isCompleted = complaint.status === "completed";

  const steps = [
    { title: "দাখিল", label: "আবেদনের তারিখ", value: formatDate(complaint.createdAt), on: isProcessing || complaint.status === "under_trial" },
    { title: "প্রক্রিয়াধীন", label: "গ্রহণের তারিখ", value: isProcessing ? formatDate(complaint.updatedAt) : "অপেক্ষমান...", on: isProcessing },
    { title: "শুনানি", label: "শুনানির তারিখ", value: isHearing ? formatDate(complaint.updatedAt) : "পরিকল্পিত", on: isHearing },
    { title: "নিষ্পত্তি", label: "চূড়ান্ত পর্যালোচনার তারিখ", value: isCompleted ? formatDate(complaint.updatedAt) : "প্রক্রিয়াধীন...", on: isCompleted },
  ];
  const currentWord = isCompleted ? "নিষ্পত্তি" : isHearing ? "শুনানি" : isProcessing ? "প্রক্রিয়াধীন" : complaint.status === "under_trial" ? "দাখিল" : "অপেক্ষমান";
  const currentCls = isCompleted ? "text-[#178a42]" : isHearing ? "text-[#b8620b]" : isProcessing ? "text-[#1b6fd6]" : "text-[#1a9c4b]";

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Link href="/customer/complain" aria-label="ড্যাশবোর্ডে ফিরুন" className="size-11 rounded-full bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight"><span className="text-[clamp(17px,5vw,21px)] font-extrabold">অভিযোগ পত্র (Complaint Document)</span><span className="text-[12px] font-semibold text-[#5b6784]">ড্যাশবোর্ডে ফিরুন</span></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/pdf/download?type=complaint_customer&id=${complaint.complaintId}`} target="_blank" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold"><Download size={14} />অভিযোগ নথি</a>
          {isHearing && <a href={`/pdf/download?type=hearing-notice&id=${complaint.complaintId}`} target="_blank" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#e0a11b] text-white text-[12px] font-extrabold"><Download size={14} />শুনানি নোটিশ</a>}
          {isCompleted && <a href={`/pdf/download?type=completion-notice&id=${complaint.complaintId}`} target="_blank" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#1a9c4b] text-white text-[12px] font-extrabold"><Download size={14} />নিষ্পত্তি পত্র</a>}
        </div>

        {/* Status tracker */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="text-center text-[14px] font-extrabold uppercase tracking-[2px] text-[#0b3d91]">আবেদনের বর্তমান অবস্থা</span>
          <div className="relative flex flex-col gap-2">
            <span className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-[#e3e8f1]" />
            {steps.map((s) => (
              <div key={s.title} className="relative flex items-center gap-3">
                <span className={clsx("size-10 rounded-full border-2 bg-white flex items-center justify-center shrink-0 z-10", s.on ? "border-[#1a9c4b] text-[#1a9c4b] shadow-[0_0_12px_rgba(26,156,75,0.2)]" : "border-[#d7deea] text-[#d7deea]")}><CheckCircle size={18} /></span>
                <span className={clsx("flex-1 rounded-md border px-3 py-2 flex items-center justify-between gap-2", s.on ? "bg-[#e9f9ef] border-[#bfe8cd]" : "bg-[#f5f7fb] border-[#eef1f6]")}>
                  <span className={clsx("text-[14px] font-extrabold", s.on ? "text-[#178a42]" : "text-[#9aa4b8]")}>{s.title}</span>
                  <span className="flex flex-col items-end leading-tight"><span className="text-[10px] font-bold text-[#5b6784]">{s.label}</span><span className={clsx("text-[12px] font-extrabold", s.on ? "text-[#16213a]" : "text-[#9aa4b8]")}>{s.value}</span></span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Officer + disciplinary */}
        {isHearing && (
          <section className="rounded-md bg-[#e9f9ef] border border-[#bfe8cd] p-3 flex flex-col gap-1.5 text-center">
            <span className="text-[15px] font-extrabold flex items-center justify-center gap-2"><ShieldCheck size={17} className="text-[#1a9c4b]" />দায়িত্বপ্রাপ্ত কর্মকর্তা</span>
            <span className="text-[12px] text-[#3d4a63]">আপনার অভিযোগটি পর্যালোচনা ও নিষ্পত্তির জন্য নিম্নলিখিত কর্মকর্তার কাছে প্রেরণ করা হয়েছে।</span>
            <div className="rounded-md bg-white border border-[#bfe8cd] p-3 flex flex-col gap-0.5">
              <span className="text-[10.5px] font-bold text-[#5b6784] uppercase tracking-wide">তদন্তকারী কর্মকর্তা (Investigation Officer)</span>
              <span className="text-[16px] font-extrabold text-[#0f5f2e]">{complaint.hearingOfficerName || "মোঃ সাহাব উদ্দিন মাহমুদ"}</span>
              <span className="text-[13px] font-bold text-[#1a9c4b]">{complaint.hearingOfficerPhone || "০১৩১০৬৭৩৬০০"}</span>
              <span className="text-[12px] font-bold">{complaint.hearingOfficerDesignation || "দায়িত্বরত কর্মকর্তা, প্রশাসনিক শাখা"}</span>
              <span className="text-[11.5px] text-[#5b6784]">সিলেট বিভাগীয় কার্যালয়, এস ই ইলেকট্রনিক্স</span>
            </div>
            {isCompleted && complaint.punishmentType && (
              <div className="rounded-md bg-[#ffe9ec] border border-[#f7c3ca] p-3">
                <span className="text-[10.5px] font-bold text-[#c81f38] uppercase tracking-wide">গৃহীত শাস্তিমূলক ব্যবস্থা (Disciplinary Action)</span>
                <span className="block text-[16px] font-extrabold text-[#c81f38] uppercase">{complaint.punishmentType}</span>
                {complaint.punishmentStartDate && <span className="text-[12px] font-bold text-[#e0243f]">সময়কালঃ {complaint.punishmentStartDate} {complaint.punishmentEndDate ? `- ${complaint.punishmentEndDate}` : ""}</span>}
              </div>
            )}
          </section>
        )}

        {/* Summary + current state */}
        <div className="grid grid-cols-2 gap-2">
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1 text-[12.5px]">
            <span className="text-[13.5px] font-extrabold border-b border-[#eef1f6] pb-1 mb-1">অভিযোগের বিবরণ</span>
            <span><b>ট্র্যাকিং আইডি:</b> {complaint.complaintId}</span>
            <span><b>নাম:</b> {complaint.customer?.name}</span>
            <span><b>মোবাইল:</b> {complaint.customer?.phone}</span>
          </section>
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1 text-[12.5px]">
            <span className="text-[13.5px] font-extrabold border-b border-[#eef1f6] pb-1 mb-1">অভিযোগের বর্তমান অবস্থা</span>
            <span className={clsx("font-extrabold", currentCls)}>অভিযোগটি {currentWord} করা হয়েছে।</span>
            <span className="text-[11.5px] text-[#5b6784]">তারিখ: {formatDate(complaint.updatedAt)}</span>
          </section>
        </div>

        {(isHearing || isCompleted) && complaint.adminNote && (
          <section className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-3 flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-[12px] font-extrabold text-[#b8620b] uppercase tracking-[2px]"><MessageSquare size={15} />{isCompleted ? "নির্বাহী নিষ্পত্তি সারসংক্ষেপ" : "কর্মকর্তার শুনানি নোটিশ"}</span>
            <p className="text-[13px] font-bold italic text-[#5a3b00] leading-relaxed">&ldquo;{complaint.adminNote}&rdquo;</p>
          </section>
        )}

        {/* Official document */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3.5 flex flex-col gap-3 text-[13.5px] leading-relaxed shadow-[0_4px_14px_rgba(11,61,145,0.06)]" style={{ fontFamily: "'SolaimanLipi', serif" }}>
          <span className="flex items-center gap-2 text-[14px] font-extrabold text-[#0b3d91] border-b border-[#eef1f6] pb-2" style={{ fontFamily: "inherit" }}><FileText size={16} />অভিযোগ পত্র</span>
          <div>
            <p><span className="font-bold">বরাবর,</span></p>
            <p className="font-bold">এস ই ইলেকট্রনিক্স</p>
            <p>মহাপরিচালক / চেয়ারম্যান,</p>
            <p>বাদাম বাগিচা সিলেট সদর ৩১০০।</p>
          </div>
          <p><span className="font-bold">বিষয়ঃ-অভিযোগ ।</span></p>
          <p><span className="font-bold">মহোদয়,</span></p>
          <p>আমি অভিযোগকারী {complaint.customer?.name} কাস্টমার আইডিঃ {complaint.customer?.customerId} আপনার প্রতিষ্ঠানের একজন ওয়ারেন্টি ভুক্ত গ্রাহক অত্যন্ত দুঃখের সাথে জানাচ্ছি যে, গত ০৩/০৩/২০২৬ ইং তারিখে আমার প্রডাক্ট সমস্যা দেখা দিলে আমি আপনাদের কাষ্টমার কেয়ারে বিষয়টি জানালে আমার সার্ভিস অনুরোধটি গ্রহন করে আমার বাসায় সার্ভিস প্রদানের সময় আপনাদের কোম্পানীর একজন টেকনিশিয়ান আমার সাথে অত্যন্ত আপত্তিকর ও অপেশাদার আচরণ করেছেন।</p>
          <div className="rounded-md bg-[#f5f7fb] border border-[#eef1f6] p-3">
            <p className="font-bold mb-1">ঘটনার বিস্তারিত বিবরণঃ</p>
            <p className="text-justify whitespace-pre-wrap">
              টেকনিশিয়ান নামঃ {complaint.staff?.name}, টেকনিশিয়ানের আইডি: {complaint.staffId} ,সার্ভিস আইডিঃ {complaint.serviceId} ,সার্ভিসের
              <br /><br />
              ধরন: {complaint.description}
              <br /><br />
              এমতবস্থায় টেকনিশিয়ান {complaint.staff?.name}, সার্ভিস আইডিঃ {complaint.serviceId} এর জন্য আপনাদের স্বনামধন্য কোম্পানী এস ই ইলেকট্রনিক্স এর সম্মান ক্ষুনু হয়েছে। ও আমি তাহার এই আচরণের জন্য এস ই ইলেকট্রনিক্স এর মহাপরিচালক / চেয়ারম্যান, এর কাছে এই বিষয়ে সঠিক যাচাই বাছাই করে বিচারের জন্য জোর আবেদন করছি।
            </p>
          </div>
          <div>
            <p className="font-bold mb-1">অতএব</p>
            <p className="text-justify">অতএব, বিষয়টি গুরুত্বের সাথে বিবেচনা করে উক্ত টেকনিশিয়ানের বিরুদ্ধে প্রয়োজনীয় ব্যবস্থা গ্রহণ করার জন্য বিনীত অনুরোধ জানাচ্ছি। আশা করি, ভবিষ্যতে আপনাদের সেবার মান বজায় রাখতে আপনারা যথাযথ পদক্ষেপ নেবেন।</p>
          </div>
          <div className="flex items-end justify-between gap-3 pt-2 border-t border-[#eef1f6]">
            <div className="flex flex-col gap-1 text-[12.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={eleclogo} alt="" className="w-20" />
              <p><span className="font-semibold">তারিখঃ</span> <span className="font-mono">{new Date(complaint.createdAt).toLocaleDateString("bn-BD")}</span></p>
              <p><span className="font-semibold">অভিযোগ ট্র্যাকিং নাম্বার:</span> <span className="font-mono">{complaint.complaintId}</span></p>
              <p><span className="font-semibold">অভিযোগ গ্রহন নাম্বার:</span> <span className="font-mono">SE {complaint.complaintId.replace(/\D/g, "").slice(0, 5) || "14285"}</span></p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-[12.5px] text-right">
              <p className="font-bold">বিনীত নিবেদন</p>
              <p>{complaint.customer?.name}</p>
              <p>মোবাইল {complaint.customer?.phone}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={elecSign} alt="" className="w-24" />
            </div>
          </div>
        </section>

        {/* Evidence */}
        {evidencePhotoUrl && (
          <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2">
            <span className="flex items-center justify-center gap-2 text-[14px] font-extrabold"><Camera size={16} className="text-[#1f7cf0]" />সংযুক্ত প্রমাণাদি (Submitted Evidence)</span>
            <p className="text-[12px] font-bold text-[#5b6784]">দাখিলকৃত প্রমাণের ছবি:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evidencePhotoUrl} alt="Evidence" className="object-contain max-h-[500px] w-full rounded-md" />
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}
