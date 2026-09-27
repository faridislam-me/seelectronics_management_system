import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import {
  Zap,
  Plus,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PlansLandingPage() {
  const session = await verifyCustomerSession();

  if (!session.isAuth || !session.customer) {
    redirect("/customer/login");
  }

  const navigationItems = [
    {
      title: "সক্রিয় সাবস্ক্রিপশন",
      description:
        "আপনার বর্তমানে চালু থাকা মেইনটেন্যান্স প্ল্যানগুলো দেখুন এবং পরিচালনা করুন।",
      href: "/customer/plans/subscription",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "প্ল্যান আবেদনসমূহ",
      description:
        "আপনার মুলতুবি বা পূর্ববর্তী আবেদনগুলো দেখুন ও ট্র্যাক করুন।",
      href: "/customer/plans/application",
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
  ];

  return (
    <CustomerLayout>
      <div className="space-y-6 pb-2">
        {/* Header Banner */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80 shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-brand/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Zap className="text-brand w-6 h-6 sm:w-8 sm:h-8 shrink-0 animate-pulse" />
                <span>মেইনটেন্যান্স প্ল্যান</span>
              </h1>

              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1 leading-snug">
                আপনার সাবস্ক্রিপশন পরিচালনা বা আবেদন ট্র্যাক করতে নিচের অপশন
                থেকে বেছে নিন।
              </p>
            </div>
            <Link
              href="/customer/maintenance-plans"
              className="bg-brand text-white w-full sm:w-auto px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-hover transition-all active:scale-[0.98] shadow-sm shrink-0"
            >
              <Plus size={16} />
              নতুন প্ল্যান কিনুন
            </Link>
          </div>
        </div>

        {/* Primary Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group relative bg-white/80 backdrop-blur-sm border border-gray-100/85 rounded-2xl p-5 hover:border-brand/40 hover:shadow-md transition-all duration-300 overflow-hidden active:scale-[0.99]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:bg-brand/10 transition-colors"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div
                    className={`size-11 rounded-xl ${item.bg} flex items-center justify-center mb-4 border ${item.border} shrink-0 shadow-sm`}
                  >
                    <item.icon className={item.color} size={20} />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                    {item.title}
                  </h2>
                  <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-brand font-black text-xs uppercase tracking-wider group-hover:gap-2.5 transition-all">
                  <span>প্রবেশ করুন</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
}
