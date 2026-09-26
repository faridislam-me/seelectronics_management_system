import { getComplaintsByCustomer } from "@/actions/complaintActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { contactDetails } from "@/constants";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, ClipboardCheck, FilePlus2, Headset, Info, PhoneCall, Search, Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

const statusMeta = (s: string) => {
  if (s === "completed" || s === "resolved") return { label: "সমাধান হয়েছে", cls: "bg-[#e9f9ef] text-[#178a42]", icon: CheckCircle2 };
  if (s === "hearing" || s === "processing") return { label: "প্রক্রিয়াধীন", cls: "bg-[#fff6e3] text-[#b8620b]", icon: Settings };
  if (s === "dismissed") return { label: "খারিজ", cls: "bg-gray-100 text-gray-600", icon: AlertCircle };
  return { label: "অভিযোগ গৃহীত", cls: "bg-[#ffe9ec] text-[#c81f38]", icon: AlertCircle };
};
const avatarTones = ["bg-[#ff4d8d]", "bg-[#8b3fe8]", "bg-[#1a9c4b]", "bg-[#e0243f]", "bg-[#1f7cf0]"];

export default async function ComplainDashboardPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4 text-center">
        <div><h2 className="text-xl font-extrabold mb-4">অভিযোগ দাখিল করতে অনুগ্রহ করে লগইন করুন</h2><Link href="/customer/login" className="bg-[#1f7cf0] text-white font-bold py-3 px-6 rounded-md">লগইন করুন</Link></div>
      </div>
    );
  }
  const res = await getComplaintsByCustomer(session.customer.customerId);
  const complaints = (res.success ? res.data || [] : []) as any[];
  const latest = complaints[0];

  const quick = [
    { label: "নতুন অভিযোগ", sub: "এস্টাফের বিরুদ্ধে অভিযোগ দাখিল করুন", icon: FilePlus2, color: "bg-[#e0243f]", href: "/customer/complain/new" },
    { label: "আমার অভিযোগ", sub: "আপনার করা অভিযোগ দেখুন", icon: Search, color: "bg-[#1f7cf0]", href: "/customer/complain/history" },
    { label: "অভিযোগের অবস্থা", sub: "চলমান অভিযোগের আপডেট দেখুন", icon: ShieldCheck, color: "bg-[#1a9c4b]", href: latest ? `/customer/complain/doc/${latest.complaintId}` : "/customer/complain/history" },
    { label: "অভিযোগ সংক্রান্ত নির্দেশিকা", sub: "কিভাবে অভিযোগ করবেন জানুন", icon: Info, color: "bg-[#8b3fe8]", href: "/customer/support" },
  ];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#e6efff_0%,#f5f8ff_60%,#1259c9_100%)] border border-[#cfe0fb] p-3 shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
          <span className="absolute right-3 top-3 w-[26%] rounded-md bg-[#1f7cf0] text-white text-center font-extrabold text-[clamp(11px,3.2vw,14px)] leading-snug p-2">আপনার কথাই আমাদের শক্তি</span>
          <ShieldCheck size={44} className="absolute right-5 bottom-3 text-white drop-shadow" fill="#1f7cf0" />
          <div className="flex items-center gap-2.5 pr-[28%]">
            <span className="size-12 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><User size={26} /></span>
            <span className="text-[clamp(18px,5.4vw,24px)] font-extrabold text-[#0b3d91] leading-tight">এস্টাফের বিরুদ্ধে কাস্টমার অভিযোগ</span>
          </div>
          <p className="mt-2 text-[12.5px] font-semibold text-[#3d4a63] leading-relaxed pr-[28%]">আপনার অভিজ্ঞতা আমাদের জন্য গুরুত্বপূর্ণ। এস্টাফের আচরণ সম্পর্কে অভিযোগ করুন, আমরা দ্রুত ব্যবস্থা নিচ্ছি!</p>
          <Link href="/customer/complain/new" className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[#e0243f] text-white text-[13px] font-extrabold shadow-[0_6px_14px_rgba(224,36,63,0.35)]"><FilePlus2 size={16} />অভিযোগ করুন<ChevronRight size={14} /></Link>
        </section>

        {/* Quick tiles */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2 grid grid-cols-4 divide-x divide-[#cfe0fb]">
          {quick.map((q) => (
            <Link key={q.label} href={q.href} className="flex flex-col items-center text-center gap-1 px-1">
              <span className={`size-11 rounded-full ${q.color} text-white flex items-center justify-center`}><q.icon size={20} /></span>
              <span className="text-[11px] font-extrabold leading-tight">{q.label}</span>
              <span className="text-[9.5px] font-semibold text-[#5b6784] leading-tight">{q.sub}</span>
              <span className={`size-5 rounded-full ${q.color} text-white flex items-center justify-center`}><ChevronRight size={11} strokeWidth={3} /></span>
            </Link>
          ))}
        </div>

        {/* Recent */}
        <div className="flex items-center justify-between px-0.5 mt-1">
          <span className="flex items-center gap-2 text-[16px] font-extrabold"><span className="size-8 rounded-md bg-[#0b3d91] text-white flex items-center justify-center"><ClipboardCheck size={16} /></span>সাম্প্রতিক অভিযোগ</span>
          <Link href="/customer/complain/history" className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[12px] font-bold">সব দেখুন<ChevronRight size={13} /></Link>
        </div>
        {complaints.length === 0 ? (
          <div className="rounded-md bg-white border border-[#dfe6f2] p-6 text-center text-[13px] font-medium text-[#5b6784]">কোনো সাম্প্রতিক অভিযোগ পাওয়া যায়নি।</div>
        ) : (
          complaints.slice(0, 5).map((c, i) => {
            const m = statusMeta(c.status);
            return (
              <Link key={c.complaintId} href={`/customer/complain/doc/${c.complaintId}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-start gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <span className={`size-12 rounded-full ${avatarTones[i % avatarTones.length]} text-white flex items-center justify-center shrink-0`}><User size={24} /></span>
                <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[14px] font-extrabold truncate">{c.staff?.name || "প্রযোজ্য নয়"}</span>
                  <span className="text-[11.5px] font-semibold text-[#5b6784]">ID: {c.complaintId}</span>
                  <span className="text-[12px] text-[#3d4a63] line-clamp-2">{c.subject}{c.description ? ` — ${c.description}` : ""}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5b6784] mt-0.5"><Calendar size={12} />{formatDate(c.createdAt)}</span>
                </span>
                <span className="flex flex-col items-end gap-2 shrink-0">
                  <span className={clsx("inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-extrabold", m.cls)}><m.icon size={12} />{m.label}</span>
                  <ChevronRight size={16} className="text-[#9aa4b8]" />
                </span>
              </Link>
            );
          })
        )}

        {/* Support */}
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-center gap-3">
          <span className="size-12 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shrink-0"><Headset size={24} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight"><span className="text-[14px] font-extrabold">সহায়তা প্রয়োজন?</span><span className="text-[11.5px] font-semibold text-[#3d4a63]">অভিযোগ দাখিল, স্ট্যাটাস চেক বা অন্য কোনো সহায়তার জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।</span></span>
          <a href={`tel:${contactDetails.customerCare}`} className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-md bg-[#1f7cf0] text-white text-[12px] font-extrabold"><PhoneCall size={14} />সাপোর্ট কল করুন</a>
        </div>
      </div>
    </CustomerLayout>
  );
}
