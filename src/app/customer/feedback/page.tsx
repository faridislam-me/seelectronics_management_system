import { verifyCustomerSession } from "@/actions/customerActions";
import { getServiceHistoryById } from "@/actions/serviceActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import clsx from "clsx";
import { Calendar, CheckCircle2, ChevronRight, ClipboardList, Clock, MapPin, MessageSquare, Plus, Send, Star, User, Wrench } from "lucide-react";
import Link from "next/link";

export default async function CustomerFeedbackPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth) return null;
  const customer = session.customer!;
  const servicesRes = await getServiceHistoryById(customer.customerId);
  const all = servicesRes.success ? (servicesRes.data! as any[]) : [];
  const completed = all.filter((s) => (s.statusHistory?.[0]?.status || s.status || "pending") === "completed");
  const done = completed.filter((s) => s.feedback?.serviceId);
  const pending = completed.filter((s) => !s.feedback?.serviceId);
  const fmt = (d: string | Date) => new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

  const tabs = [
    { label: "সকল ফিডব্যাক", count: completed.length, icon: ClipboardList, active: true },
    { label: "সমাধানকৃত", count: done.length, icon: CheckCircle2 },
    { label: "প্রক্রিয়াধীন", count: 0, icon: Clock },
    { label: "নতুন", count: pending.length, icon: Star },
  ];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-3 bottom-3 font-script text-[clamp(13px,3.8vw,17px)] leading-[1] text-right text-white/90 rotate-[-8deg]">Your<br />Feedback<br />Matters ♥</span>
          <span className="absolute right-16 top-3 inline-flex gap-0.5">{[1, 2, 3, 4].map((i) => <Star key={i} size={14} className="text-[#f5c542]" fill="#f5c542" />)}</span>
          <div className="relative flex items-center gap-3 pr-20">
            <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><MessageSquare size={26} /></span>
            <span className="flex flex-col leading-tight"><span className="text-[15px] font-semibold text-white/90">Customer</span><span className="text-[clamp(24px,7vw,30px)] font-extrabold leading-none">Feedback</span></span>
          </div>
          <p className="relative mt-2 text-[14px] font-extrabold">আপনার মতামত আমাদের জন্য গুরুত্বপূর্ণ</p>
          <p className="relative text-[12.5px] text-white/90 leading-snug">SE ELECTRONICS সবসময় আপনার সেবা আরও উন্নত করতে চায়।</p>
        </section>

        {/* Tabs (static counters) */}
        <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <span key={t.label} className={clsx("shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12.5px] font-bold border", t.active ? "bg-[#0b3d91] text-white border-[#0b3d91]" : "bg-white text-[#16213a] border-[#dfe6f2]")}>
              <t.icon size={14} />{t.label}<span className={clsx("min-w-5 h-5 px-1 rounded-full text-[10px] font-extrabold inline-flex items-center justify-center", t.active ? "bg-white/20" : "bg-[#eef3fb] text-[#5b6784]")}>{t.count}</span>
            </span>
          ))}
        </div>

        {completed.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
            <span className="text-[15px] font-extrabold">এখনো কোনো সম্পন্ন সার্ভিস নেই</span>
            <span className="text-[12px] font-medium text-[#5b6784]">সার্ভিস সম্পন্ন হলে এখান থেকে আপনি ফিডব্যাক দিতে পারবেন।</span>
            <Link href="/customer/services" className="mt-2 h-10 px-4 rounded-md bg-[#1f7cf0] text-white text-sm font-bold inline-flex items-center">সার্ভিস ট্র্যাকিং দেখুন</Link>
          </div>
        ) : (
          completed.map((s) => {
            const has = !!s.feedback?.serviceId;
            const rating = Math.round(Number(s.feedback?.rating || 0));
            return (
              <article key={s.serviceId} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <div className="flex items-center gap-2.5">
                  <span className="size-11 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><User size={22} /></span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-[15px] font-extrabold truncate">{customer.name},</span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5b6784] truncate"><MapPin size={12} />{customer.address || "বাংলাদেশ"}</span>
                  </span>
                  {has ? (
                    <span className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-[#1a9c4b] text-white text-[11px] font-extrabold"><CheckCircle2 size={13} />সম্পন্ন হয়েছে</span>
                  ) : (
                    <Link href={`/service-feedback?serviceId=${s.serviceId}`} className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-[#1f7cf0] text-white text-[11px] font-extrabold"><Star size={13} />ফিডব্যাক দিন</Link>
                  )}
                </div>
                <div className="flex flex-col gap-1 border-t border-[#eef1f6] pt-2 text-[12.5px] font-semibold text-[#3d4a63]">
                  <span className="inline-flex items-center gap-2"><Wrench size={14} className="text-[#0b3d91]" /><span className="font-extrabold text-[#16213a]">{s.productModel}</span><span className="text-[#9aa4b8]">#{s.serviceId} · {s.type}</span></span>
                  <span className="inline-flex items-center gap-2"><Calendar size={14} className="text-[#0b3d91]" />{fmt(s.createdAt)}</span>
                </div>
                <div className="rounded-md bg-[#e8f1ff] p-2.5 flex items-start gap-2">
                  <p className="text-[12.5px] leading-relaxed text-[#16213a] flex-1">আপনার মূল্যবান ফিডব্যাক আমাদের জন্য অত্যন্ত গুরুত্বপূর্ণ। আপনার মতামতের ভিত্তিতে <b>SE ELECTRONICS</b> আরও উন্নত ও চমৎকার সেবা প্রদান করতে অবিরাম কাজ করে যাচ্ছে। আমাদের লক্ষ্য আপনার সন্তুষ্টি।</p>
                  {has && <span className="inline-flex gap-0.5 shrink-0">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= rating ? "text-[#f5a623]" : "text-[#d7deea]"} fill={i <= rating ? "#f5a623" : "#d7deea"} />)}</span>}
                </div>
              </article>
            );
          })
        )}

        {/* CTA */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-center gap-3">
          <span className="size-11 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><Send size={20} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">আপনারও মতামত দিন</span><span className="text-[11.5px] font-semibold text-[#3d4a63]">আপনার ফিডব্যাক আমাদের আরও ভালো হতে সাহায্য করবে।</span></span>
          <Link href={pending[0] ? `/service-feedback?serviceId=${pending[0].serviceId}` : "/customer/services"} className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12px] font-extrabold"><Plus size={14} strokeWidth={3} />ফিডব্যাক দিন<ChevronRight size={13} /></Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
