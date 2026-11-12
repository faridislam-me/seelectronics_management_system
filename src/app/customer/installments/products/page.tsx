import { getMyInstallmentPlans } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const PLAN_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]" },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" },
  defaulted: { label: "খেলাপি", cls: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]" },
  banned: { label: "ব্যান", cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default async function MyInstallmentProductsPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyInstallmentPlans();
  const plans = res.success && "data" in res && res.data ? (res.data as any[]) : [];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[16px] font-extrabold truncate">আমার কিস্তিপণ্য</span>
            <span className="text-[11px] font-semibold text-[#5b6784]">সকল কিস্তি পণ্যের তালিকা</span>
          </span>
          <span className="shrink-0 text-[12px] font-extrabold text-[#0b3d91] bg-[#e8f1ff] px-2 py-1 rounded-full">{plans.length}</span>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center flex flex-col items-center gap-2">
            <span className="size-14 rounded-full bg-[#f5f7fb] flex items-center justify-center"><Package className="text-[#c9d3e6]" size={28} /></span>
            <span className="text-[14px] font-extrabold">কোনো কিস্তিপণ্য নেই</span>
            <span className="text-[12px] text-[#5b6784]">আপনার জন্য কোনো কিস্তি পণ্য নেই।</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {plans.map((p) => {
              const s = PLAN_STATUS[p.status] || PLAN_STATUS.active;
              const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
              return (
                <Link
                  key={p.planCode}
                  href={`/customer/installments/${p.planCode}`}
                  className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]"
                >
                  <span className="size-11 rounded-md bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0">
                    <CreditCard size={22} />
                  </span>
                  <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-extrabold truncate">{p.productModel}</span>
                      <span className={clsx("shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#5b6784] font-mono">{p.planCode}</span>
                    <div className="h-1.5 rounded-full bg-[#eef1f6] overflow-hidden">
                      <div className={clsx("h-full rounded-full", p.status === "completed" ? "bg-[#1a9c4b]" : "bg-[#1f7cf0]")} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#5b6784]">
                      <span>{p.paidCount}/{p.months} কিস্তি পরিশোধিত</span>
                      <span>
                        {p.status === "completed" ? (
                          <span className="inline-flex items-center gap-0.5 text-[#178a42]"><CheckCircle2 size={11} /> সম্পন্ন</span>
                        ) : (
                          <span className="text-[#c81f38]">বাকি {bdt(p.remainingAmount)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[#c9d3e6]" />
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-center text-[#5b6784] px-4">
          কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — <a href="tel:09649355555" className="font-bold text-[#1f5fc9]">09649355555</a>
        </p>
      </div>
    </CustomerLayout>
  );
}
