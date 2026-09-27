import { verifyCustomerSession } from "@/actions/customerActions";
import { getCustomerSubscriptionApplications, getCustomerSubscriptions } from "@/actions/subscriptionActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ChevronRight, ClipboardList, Package, Plus, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PlansLandingPage() {
  const session = await verifyCustomerSession();

  if (!session.isAuth || !session.customer) {
    redirect("/customer/login");
  }

  const [subsRes, appsRes] = await Promise.all([
    getCustomerSubscriptions(session.customer.customerId, session.customer.phone),
    getCustomerSubscriptionApplications(session.customer.customerId, session.customer.phone),
  ]);
  const activeCount = (subsRes.data ?? []).filter((s: any) => s.isActive && s.status === "active").length;
  const appCount = (appsRes.data ?? []).length;

  const navigationItems = [
    {
      title: "সক্রিয় সাবস্ক্রিপশন",
      description: "আপনার বর্তমানে চালু থাকা মেইনটেন্যান্স প্ল্যানগুলো দেখুন এবং পরিচালনা করুন।",
      href: "/customer/plans/subscription",
      icon: ShieldCheck,
      tile: "bg-[#e9f9ef] text-[#1a9c4b]",
      border: "border-[#bfe8cd]",
      count: activeCount,
      countCls: "bg-[#e9f9ef] text-[#178a42]",
    },
    {
      title: "প্ল্যান আবেদনসমূহ",
      description: "আপনার মুলতুবি বা পূর্ববর্তী আবেদনগুলো দেখুন ও ট্র্যাক করুন।",
      href: "/customer/plans/application",
      icon: ClipboardList,
      tile: "bg-[#e8f1ff] text-[#1f7cf0]",
      border: "border-[#cfe0fb]",
      count: appCount,
      countCls: "bg-[#e8f1ff] text-[#1b6fd6]",
    },
    {
      title: "নতুন প্যাকেজ দেখুন",
      description: "আইপিএস ও ব্যাটারির মেইনটেন্যান্স প্যাকেজগুলো দেখে নতুন প্ল্যান কিনুন।",
      href: "/customer/maintenance-plans",
      icon: Package,
      tile: "bg-[#f3e9ff] text-[#8b3fe8]",
      border: "border-[#dcc6fb]",
      count: null as number | null,
      countCls: "",
    },
  ];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Title */}
        <section className="relative rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-3 pr-[88px] shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="size-12 rounded-md bg-[#1f7cf0] text-white flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(31,124,240,0.35)]"><Zap size={26} /></span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">মেইনটেন্যান্স প্ল্যান</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">আপনার সাবস্ক্রিপশন পরিচালনা বা আবেদন ট্র্যাক করতে নিচের অপশন থেকে বেছে নিন।</span>
          </span>
          <span className="absolute right-2 top-2 font-script text-[clamp(13px,3.8vw,16px)] leading-[1] text-right text-[#0b3d91] rotate-[-8deg]">Stay Protected<br />Stay Powered</span>
        </section>

        {/* Buy new plan */}
        <Link href="/customer/maintenance-plans" className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.3)] active:scale-[0.98] transition-transform">
          <Plus size={18} />নতুন প্ল্যান কিনুন
        </Link>

        {/* Navigation cards */}
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-md bg-white border ${item.border} p-2.5 flex items-center gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-transform`}>
            <span className={`size-12 rounded-md ${item.tile} flex items-center justify-center shrink-0`}><item.icon size={24} /></span>
            <span className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-extrabold leading-tight">{item.title}</span>
                {item.count !== null && <span className={`h-5 min-w-5 px-1.5 rounded-md text-[11px] font-extrabold inline-flex items-center justify-center ${item.countCls}`}>{item.count}</span>}
              </span>
              <span className="text-[12px] font-medium text-[#5b6784] leading-snug">{item.description}</span>
              <span className="text-[11.5px] font-extrabold text-[#1f7cf0] mt-0.5">প্রবেশ করুন</span>
            </span>
            <ChevronRight size={18} className="text-[#9aa4b8] shrink-0" />
          </Link>
        ))}
      </div>
    </CustomerLayout>
  );
}
