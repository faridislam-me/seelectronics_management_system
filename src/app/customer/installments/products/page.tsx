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
          <div className="flex flex-col gap-2.5">
            {plans.map((p) => {
              const s = PLAN_STATUS[p.status] || PLAN_STATUS.active;
              const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
              const done = p.status === "completed";
              return (
                <Link
                  key={p.planCode}
                  href={`/customer/installments/${p.planCode}`}
                  className={clsx(
                    "group relative rounded-md bg-white border border-[#e4e9f2] border-l-[3px] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.05)] active:scale-[0.995] transition",
                    done ? "border-l-[#1a9c4b]" : "border-l-[#1f7cf0]",
                  )}
                >
                  {/* Top: product + status */}
                  <div className="flex items-center gap-2.5">
                    <span className={clsx("size-10 rounded-md flex items-center justify-center shrink-0", done ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#e8f1ff] text-[#0b3d91]")}>
                      <CreditCard size={20} />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1 leading-tight">
                      <span className="text-[14px] font-extrabold truncate">{p.productModel}</span>
                      <span className="text-[10.5px] font-bold text-[#8794ab] font-mono">{p.planCode}</span>
                    </div>
                    <span className={clsx("shrink-0 text-[9.5px] font-extrabold uppercase px-2 py-1 rounded-full border", s.cls)}>{s.label}</span>
                  </div>

                  {/* Progress */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold">
                      <span className="text-[#5b6784]">{p.paidCount}/{p.months} কিস্তি পরিশোধিত</span>
                      <span className={done ? "text-[#178a42]" : "text-[#0b3d91]"}>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eef1f6] overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all", done ? "bg-[#1a9c4b]" : "bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)]")}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: remaining + tracking cue */}
                  <div className="flex items-center justify-between border-t border-[#eef1f6] pt-2">
                    <span className="text-[11px] font-bold">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-[#178a42]"><CheckCircle2 size={13} /> সম্পূর্ণ পরিশোধিত</span>
                      ) : (
                        <span className="text-[#5b6784]">বাকি <span className="text-[#c81f38] font-extrabold">{bdt(p.remainingAmount)}</span></span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[#0b3d91]">
                      ট্র্যাকিং ও বিস্তারিত <ChevronRight size={14} className="transition group-active:translate-x-0.5" />
                    </span>
                  </div>
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
