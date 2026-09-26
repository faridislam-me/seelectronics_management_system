import { getComplaintsByCustomer } from "@/actions/complaintActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import PageBanner from "@/components/ui/PageBanner";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { CheckCircle, ChevronRight, ClipboardList, FileText, Home, PlusCircle } from "lucide-react";
import Link from "next/link";

const statusChip = (s: string) =>
  s === "completed" ? "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" : s === "hearing" ? "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]" : "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]";

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
  const last = complaints.length > 0 ? complaints[0] : null;
  const st = last?.status as string | undefined;
  const steps = last
    ? [
        { title: "অপেক্ষমাণ", sub: formatDate(last.createdAt), on: true },
        { title: "প্রক্রিয়াধীন", sub: st !== "under_trial" ? "পর্যালোচনায়" : "অপেক্ষায়", on: st !== "under_trial" },
        { title: "শুনানি", sub: st === "hearing" || st === "completed" ? "কর্মকর্তা তলব" : "পরিকল্পিত", on: st === "hearing" || st === "completed" },
        { title: "নিষ্পত্তি", sub: st === "completed" ? "সম্পন্ন" : "চূড়ান্ত ধাপ", on: st === "completed", final: true },
      ]
    : [];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
        <PageBanner src="/banners/complaint.jpg" alt="অভিযোগ করুন - নতুন অভিযোগ করুন" width={738} height={273} href="/customer/complain/new" />

        <span className="text-[18px] font-extrabold text-[#0b3d91] px-0.5">অভিযোগ ড্যাশবোর্ড</span>

        {/* Top action buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/customer/complain/new", label: "নতুন অভিযোগ", icon: PlusCircle, cls: "bg-[#e9f9ef] border-[#bfe8cd] text-[#178a42]", tile: "bg-[#1a9c4b]" },
            { href: "/customer/complain/history", label: "অভিযোগ তালিকা", icon: FileText, cls: "bg-[#e8f1ff] border-[#cfe0fb] text-[#1b6fd6]", tile: "bg-[#1f7cf0]" },
            { href: "/customer/profile", label: "ড্যাশবোর্ড", icon: Home, cls: "bg-[#ffe9ec] border-[#f7c3ca] text-[#c81f38]", tile: "bg-[#e0243f]" },
          ].map((b) => (
            <Link key={b.href} href={b.href} className={clsx("rounded-md border p-2.5 flex flex-col items-center gap-1.5 text-center active:scale-[0.98] transition-all", b.cls)}>
              <span className={clsx("size-10 rounded-full text-white flex items-center justify-center", b.tile)}><b.icon size={20} /></span>
              <span className="text-[12.5px] font-extrabold">{b.label}</span>
            </Link>
          ))}
        </div>

        {/* Last complaint */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="flex items-center gap-2 text-[15px] font-extrabold border-b border-[#eef1f6] pb-2"><span className="size-8 rounded-md bg-[#0b3d91] text-white flex items-center justify-center"><ClipboardList size={16} /></span>সর্বশেষ অভিযোগ</span>
          {last ? (
            <>
              <div className="relative flex flex-col gap-2">
                <span className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-[#e3e8f1]" />
                {steps.map((s) => (
                  <div key={s.title} className="relative flex items-center gap-3">
                    <span className={clsx("size-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white", s.on ? "border-[#1a9c4b] text-[#1a9c4b]" : "border-[#d7deea] text-[#c9d3e6]")}><CheckCircle size={18} /></span>
                    <span className={clsx("flex-1 rounded-md border px-3 py-1.5", s.on ? (s.final ? "bg-[#1a9c4b] border-transparent text-white" : "bg-[#e9f9ef] border-[#bfe8cd]") : "bg-[#f5f7fb] border-[#eef1f6] opacity-70")}>
                      <span className={clsx("block text-[13.5px] font-extrabold", s.on ? (s.final ? "text-white" : "text-[#178a42]") : "text-[#9aa4b8]")}>{s.title}</span>
                      <span className={clsx("block text-[11.5px] font-bold", s.on ? (s.final ? "text-white/85" : "text-[#1a9c4b]") : "text-[#c9d3e6]")}>{s.sub}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-md bg-[#f5f7fb] border border-[#eef1f6] p-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                <span className="flex flex-col"><span className="text-[11px] font-bold text-[#5b6784]">ট্র্যাকিং নম্বর:</span><span className="font-extrabold font-mono">{last.complaintId}</span></span>
                <span className="flex flex-col"><span className="text-[11px] font-bold text-[#5b6784]">অভিযুক্ত কর্মী:</span><span className="font-extrabold">{last.staff?.name || "প্রযোজ্য নয়"}</span></span>
                <span className="flex flex-col col-span-2"><span className="text-[11px] font-bold text-[#5b6784]">বিষয়:</span><span className="font-extrabold">{last.subject}</span></span>
                {last.serviceId && <span className="flex flex-col"><span className="text-[11px] font-bold text-[#5b6784]">সেবা আইডি:</span><span className="font-extrabold font-mono">{last.serviceId}</span></span>}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-extrabold text-[#8a4a05] bg-[#fff6e3] border border-[#f5dfa0] px-2 py-1 rounded-md">আবেদনের অবস্থা</span>
                  <span className={clsx("text-[11.5px] font-extrabold px-2 py-1 rounded-md border capitalize", statusChip(st!))}>{st!.replace("_", " ")}</span>
                </span>
                <Link href={`/customer/complain/doc/${last.complaintId}`} className="inline-flex items-center gap-1 h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[12.5px] font-extrabold">বিস্তারিত দেখুন<ChevronRight size={14} /></Link>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[13px] font-medium text-[#9aa4b8]">কোনো সাম্প্রতিক অভিযোগ পাওয়া যায়নি।</div>
          )}
        </section>

        {/* Recent notices */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="flex items-center gap-2 text-[15px] font-extrabold border-b border-[#eef1f6] pb-2"><span className="size-8 rounded-md bg-[#e0a11b] text-white flex items-center justify-center"><FileText size={16} /></span>সাম্প্রতিক অভিযোগ নোটিশ</span>
          {complaints.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-1 text-[11px] font-extrabold text-[#9aa4b8] uppercase tracking-wide"><span>অভিযুক্ত কর্মী</span><span>তারিখ</span><span>অবস্থা</span></div>
              {complaints.slice(0, 4).map((c) => (
                <Link key={c.complaintId} href={`/customer/complain/doc/${c.complaintId}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 rounded-md bg-[#f5f7fb] px-2.5 py-2">
                  <span className="text-[13px] font-extrabold truncate">{c.staff?.name}</span>
                  <span className="text-[11.5px] font-semibold text-[#5b6784]">{formatDate(c.createdAt)}</span>
                  <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border", statusChip(c.status))}>{c.status.replace("_", " ")}</span>
                </Link>
              ))}
            </>
          ) : (
            <div className="py-8 text-center text-[13px] font-medium text-[#9aa4b8]">কোনো নোটিশ পাওয়া যায়নি।</div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
