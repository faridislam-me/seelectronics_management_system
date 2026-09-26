import { applyForVipCard, verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { contactDetails } from "@/constants";
import vipBg from "@/assets/images/vipbg.jpeg";
import { BadgePercent, CheckCircle2, ChevronRight, Clock, CreditCard, Crown, Gift, Megaphone, MessageCircle, ShieldCheck, Star, Wrench } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { VipFlipCard } from "./VipFlipCard";

const perks = [
  { icon: BadgePercent, label: "বিশেষ ডিসকাউন্ট", tile: "bg-[#e8f1ff] text-[#1f7cf0]" },
  { icon: Wrench, label: "ফাস্ট সার্ভিস সুবিধা", tile: "bg-[#f3e9ff] text-[#8b3fe8]" },
  { icon: Star, label: "প্রায়োরিটি সাপোর্ট", tile: "bg-[#fff6e3] text-[#e0a11b]" },
  { icon: Gift, label: "এক্সক্লুসিভ অফার", tile: "bg-[#e9f9ef] text-[#1a9c4b]" },
  { icon: ShieldCheck, label: "ওয়ারেন্টি সুবিধা", tile: "bg-[#e8f1ff] text-[#1f7cf0]" },
];

export default async function VipCardPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4 text-center">
        <div><h2 className="text-xl font-extrabold mb-4">Please log in to view this page</h2><Link href="/customer/login" className="bg-[#1f7cf0] text-white font-bold py-3 px-6 rounded-md">Login</Link></div>
      </div>
    );
  }
  const customer = session.customer as any;
  const vipStatus = customer.vipStatus as string | null;
  const vipCardNumber = customer.vipCardNumber as string | null;
  const approved = vipStatus === "approved";
  const pending = vipStatus === "pending" || vipStatus === "processing";

  async function handleApply() {
    "use server";
    await applyForVipCard();
    revalidatePath("/customer/vip-card");
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        {/* Card / application */}
        {approved && vipCardNumber ? (
          <div className="rounded-md overflow-hidden"><VipFlipCard customer={customer} vipCardNumber={vipCardNumber} vipBgSrc={vipBg?.src || "/vipbg.jpeg"} baseUrl={process.env.NEXT_PUBLIC_BASE_URL} /></div>
        ) : (
          <section className="relative overflow-hidden rounded-md bg-[#071f4d] bg-[linear-gradient(110deg,#071f4d_0%,#0b3d91_55%,#1259c9_100%)] text-white p-3.5 border border-[#f5c542]/60 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
            <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="flex flex-col"><span className="text-[12px] font-bold tracking-[2px] text-white/85">SE ELECTRONICS</span><span className="flex items-center gap-2 text-[clamp(26px,8vw,36px)] font-extrabold leading-none text-[#f5c542]"><Crown size={30} fill="#f5c542" />VIP</span><span className="text-[13px] font-extrabold tracking-[2px]">MEMBERSHIP CARD</span></span>
              <span className="size-12 rounded-md bg-white/10 border border-white/20 flex items-center justify-center"><Crown size={24} className="text-[#f5c542]" /></span>
            </div>
            <p className="relative mt-3 text-[12.5px] leading-relaxed text-white/90">
              {pending ? "Your application is currently being reviewed by our administrative team. We will notify you once it's approved." : vipStatus === "expired" ? "Your previous VIP card has expired. Re-apply now to continue enjoying exclusive benefits, priority support, and special discounts." : "Join our elite membership program to enjoy exclusive benefits, priority support, and special discounts on all services."}
            </p>
            <div className="relative mt-3">
              {pending ? (
                <span className="inline-flex items-center gap-2 h-10 px-3 rounded-md bg-white/15 border border-white/25 text-[12px] font-extrabold uppercase tracking-wide"><Clock size={16} className="animate-pulse" />Status: {vipStatus?.toUpperCase()}</span>
              ) : (
                <form action={handleApply}>
                  {vipStatus === "rejected" && <span className="mb-2 inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#ffe9ec] text-[#c81f38] text-[12px] font-extrabold">Status: Rejected</span>}
                  <button className="h-11 w-full rounded-md bg-[#f5c542] text-[#0a2f70] text-[14px] font-extrabold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"><Crown size={18} />{vipStatus === "rejected" ? "Apply Again" : vipStatus === "expired" ? "Renew VIP Card" : "Apply for VIP Card"}</button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Announcement */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-center gap-3">
          <span className="size-11 rounded-full bg-white text-[#1f7cf0] flex items-center justify-center shrink-0"><Megaphone size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[13.5px] font-extrabold">{approved ? "আপনি এখন SE Electronics এর সম্মানিত VIP সদস্য!" : "VIP Card আবেদন ফি: ১৫০০ টাকা"}</span>
            <span className="text-[11.5px] font-semibold text-[#3d4a63]">{approved ? "স্বাগতম! বিশেষ সুবিধা ও অফারের জন্য সবসময় আমাদের সাথে থাকুন।" : "এস ই ইলেকট্রনিক্স – ভিআইপি মেম্বারশিপ বেনিফিট"}</span>
          </span>
          <ChevronRight size={18} className="text-[#1f7cf0] shrink-0" />
        </div>

        {/* Perks */}
        <div className="flex items-center justify-between px-0.5"><span className="flex items-center gap-2 text-[17px] font-extrabold"><Crown size={20} className="text-[#f5a623]" fill="#f5a623" />VIP সদস্যদের বিশেষ সুবিধা</span><a href="#benefits" className="text-[12px] font-bold text-[#1f7cf0]">সকল সুবিধা দেখুন →</a></div>
        <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 grid grid-cols-5 divide-x divide-[#eef1f6]">
          {perks.map((p) => (
            <div key={p.label} className="flex flex-col items-center text-center gap-1.5 px-1">
              <span className={`size-12 rounded-md ${p.tile} flex items-center justify-center`}><p.icon size={22} /></span>
              <span className="text-[10.5px] font-bold leading-tight">{p.label}</span>
            </div>
          ))}
        </div>

        {/* My card + banner */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex flex-col gap-2">
            <span className="flex items-center gap-2"><span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Crown size={17} /></span><span className="text-[14px] font-extrabold">আমার VIP কার্ড</span></span>
            <span className="text-[11.5px] font-semibold text-[#3d4a63] leading-snug">আপনার সদস্যপদ নম্বর, মেয়াদ এবং কার্ডের তথ্য দেখুন</span>
            <a href="#top" className="mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold"><CreditCard size={15} />কার্ড দেখুন<ChevronRight size={13} /></a>
          </div>
          <div className="relative overflow-hidden rounded-md bg-[#071f4d] bg-[linear-gradient(135deg,#071f4d_0%,#0b3d91_60%,#1259c9_100%)] text-white p-2.5 flex flex-col justify-between">
            <span className="absolute -right-6 -bottom-8 size-28 rounded-full bg-[#f5c542]/20" />
            <span className="text-[11px] font-extrabold">SE Electronics</span>
            <span className="text-[15px] font-extrabold leading-tight">আপনার আস্থা<br /><span className="text-[#f5c542]">আমাদের প্রেরণা</span></span>
            <span className="text-[11px] font-semibold text-white/85">সর্বদা আপনার পাশে</span>
            <Crown size={34} className="absolute right-2 top-2 text-[#f5c542]" fill="#f5c542" />
          </div>
        </div>

        {/* Full benefit text (unchanged copy) */}
        <section id="benefits" className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-3">
          <p className="text-[12.5px] text-[#3d4a63] leading-relaxed">আপনার নিরবচ্ছিন্ন বিদ্যুৎ সেবা এবং মানসিক প্রশান্তি নিশ্চিত করতে এস ই ইলেকট্রনিক্স নিয়ে এলো বিশেষ VIP Member Card। এই কার্ডধারী গ্রাহকগণ আমাদের আইপিএস, ব্যাটারী এবং ভোল্টেজ স্ট্যাবিলাইজার সেবার ওপর বিশেষ অগ্রাধিকার ও সাশ্রয়ী সুবিধা উপভোগ করবেন।</p>
          <span className="flex items-center gap-2 text-[15px] font-extrabold"><span className="size-8 rounded-md bg-[#fff6e3] text-[#e0a11b] flex items-center justify-center"><Crown size={16} /></span>কার্ডধারীদের জন্য বিশেষ সুবিধাসমূহ</span>
          <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5"><span className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#0b3d91]"><CheckCircle2 size={15} />সার্ভিসিং-এ ৫% নগদ ছাড় (Service Discount)</span><p className="mt-1 text-[12px] text-[#3d4a63] leading-relaxed">আপনার ব্যবহৃত আইপিএস, ব্যাটারী কিংবা ভোল্টেজ স্ট্যাবিলাইজার-এর যেকোনো ধরণের মেরামত বা নিয়মিত সার্ভিসিং ফি-র ওপর সরাসরি ৫% ডিসকাউন্ট পাবেন। আমাদের দক্ষ টেকনিশিয়ান দ্বারা দ্রুত ও মানসম্মত সেবার নিশ্চয়তা দিচ্ছি।</p></div>
          <div className="rounded-md bg-[#f3e9ff] border border-[#dcc6fb] p-2.5"><span className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#7a35d2]"><CheckCircle2 size={15} />নতুন ক্রয়ে বিশেষ ছাড় ও রেফারেল বোনাস</span><p className="mt-1 text-[12px] text-[#3d4a63] leading-relaxed">এই ভিআইপি কার্ড নাম্বার ব্যবহার করে আপনি নিজে অথবা আপনার রেফারেন্সে অন্য কেউ যদি নতুন আইপিএস, ব্যাটারি বা স্ট্যাবিলাইজার ক্রয় করেন, তাহলে মোট মূল্যের ওপর ৪% বিশেষ ছাড় প্রদান করা হবে ক্রেতাকে। পাশাপাশি, যাঁর ভিআইপি কার্ড ব্যবহার করা হবে, তিনি অতিরিক্ত ২% রেফারেল বোনাস উপভোগ করবেন। এটি আপনার এবং আপনার পরিচিতদের জন্য একটি লাভজনক ও সাশ্রয়ী সুবিধা।</p></div>
          <div className="grid grid-cols-1 gap-2 rounded-md bg-[#f5f7fb] p-2.5 text-[12px]">
            <div><span className="font-extrabold text-[11px] uppercase tracking-wide">ইলেক্ট্রিক সার্ভিস</span><p className="text-[#3d4a63]">নতুন আইপিএস ইনস্টলেশন বা ফিটিং।</p></div>
            <div><span className="font-extrabold text-[11px] uppercase tracking-wide">বাসা বদল সার্ভিস</span><p className="text-[#3d4a63]">বাসা বা অফিস পরিবর্তনের সময় ফ্যান, লাইট, এসি এবং ইলেকট্রিক ওয়্যারিং খোলা বা নতুন করে ফিটিং করা।</p></div>
            <div><span className="font-extrabold text-[11px] uppercase tracking-wide">রক্ষণাবেক্ষণ প্যাকেজ</span><p className="text-[#3d4a63]">ব্যাটারী রিফিল প্যাক এবং আইপিএস ও ব্যাটারীর &quot;সম্পূর্ণ রক্ষণাবেক্ষণ (Full Maintenance) প্যাক&quot;-এর ওপর ৫% ছাড়।</p></div>
          </div>
          <span className="flex items-center gap-2 text-[15px] font-extrabold"><span className="size-8 rounded-md bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center"><Crown size={16} /></span>আমাদের বিশেষ ভিআইপি মেম্বারশিপ সেবাসমূহ</span>
          {[
            { t: "দক্ষ টেকনিশিয়ান", d: "অভিজ্ঞ ইলেকট্রিশিয়ান দ্বারা নিরাপদ ওয়্যারিং ও ফিটিং।" },
            { t: "ব্যাটারী কেয়ার", d: "ব্যাটারীর দীর্ঘস্থায়িত্ব নিশ্চিত করতে প্রফেশনাল রিফিল ও চেকআপ।" },
            { t: "হোম সার্ভিস", d: "সিলেট শহর ও এর আশেপাশে দ্রুত হোম ডেলিভারি ও সার্ভিস সুবিধা।" },
          ].map((s) => <div key={s.t} className="flex gap-2 rounded-md border border-[#eef1f6] p-2"><CheckCircle2 size={16} className="text-[#1a9c4b] shrink-0 mt-0.5" /><span><span className="block text-[13px] font-extrabold">{s.t}</span><span className="text-[11.5px] text-[#3d4a63]">{s.d}</span></span></div>)}
          <div className="rounded-md bg-[#0b3d91] text-white p-3 flex flex-col gap-2">
            <span className="text-[15px] font-extrabold">কেন আমাদের বেছে নেবেন?</span>
            {["দ্রুত বিক্রয়োত্তর সেবা।", "অরিজিনাল পার্টসের নিশ্চয়তা।", "দক্ষ টেকনিশিয়ান দ্বারা সার্ভিসিং।"].map((t) => <span key={t} className="flex items-center gap-2 text-[12.5px]"><CheckCircle2 size={14} className="text-[#7fb4ff]" />{t}</span>)}
            <span className="text-[12.5px]"><b>নির্ভরযোগ্যতা:</b> দীর্ঘস্থায়ী ব্যাটারী এবং সেনসিটিভ ডিভাইসের জন্য সেরা ভোল্টেজ স্ট্যাবিলাইজার।</span>
            <span className="text-[12.5px]"><b>দ্রুত সেবা:</b> সিলেট শহর ও এর আশেপাশে আমাদের টেকনিশিয়ান টিম দ্রুত হোম সার্ভিস প্রদান করে।</span>
          </div>
          <div className="rounded-md bg-[#ffe9ec] border border-[#f7c3ca] p-2.5">
            <span className="text-[13.5px] font-extrabold text-[#c81f38]">📌 নিয়ম ও শর্তাবলী:</span>
            <ul className="mt-1 flex flex-col gap-1 text-[12px] text-[#3d4a63]">
              {["সার্ভিস গ্রহণ বা পণ্য ক্রয়ের সময় অবশ্যই ভিআইপি কার্ড বা কার্ড নাম্বারটি প্রদর্শন করতে হবে।", "ইলেকট্রিক ওয়্যারিং বা ফিটিং সার্ভিসের ক্ষেত্রে কাজ শুরুর আগেই কার্ড নাম্বারটি নিশ্চিত করতে হবে।", "অন্য কোনো রানিং অফারের সাথে এই ডিসকাউন্টটি যুক্ত করা যাবে না।"].map((t) => <li key={t} className="flex gap-2"><span className="text-[#e0243f] font-black">•</span>{t}</li>)}
            </ul>
          </div>
          <div className="rounded-md bg-[#f5f7fb] p-2.5 flex items-center gap-3">
            <span className="flex flex-col min-w-0 flex-1"><span className="text-[13px] font-extrabold">Need Assistance?</span><span className="text-[11.5px] text-[#3d4a63]">Our support team is ready to help you with your VIP membership.</span></span>
            <a href={`https://wa.me/${contactDetails.whatsApp.replace(/\+/g, "")}`} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#25D366] text-white text-[12px] font-extrabold"><MessageCircle size={15} />WhatsApp</a>
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
