import { getMyInstallmentPlans } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { CheckCircle2, ChevronRight, CreditCard, PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]" },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" },
  defaulted: { label: "খেলাপি", cls: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]" },
  banned: { label: "ব্যান", cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default async function CustomerInstallmentsPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyInstallmentPlans();
  const plans = (res.success && Array.isArray(res.data) ? res.data : []) as any[];

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <span className="size-11 rounded-full bg-[#0b3d91] text-white flex items-center justify-center shrink-0 shadow-[0_6px_14px_rgba(11,61,145,0.3)]"><CreditCard size={22} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-[clamp(16px,4.8vw,21px)] font-extrabold">আমার কিস্তি</span>
            <span className="text-[11px] font-semibold text-[#5b6784]">আপনার চলমান ও সম্পন্ন কিস্তির তথ্য</span>
          </span>
        </div>

        {/* Apply button */}
        <Link
          href="/customer/installments/apply"
          className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]"
        >
          <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><PlusCircle size={22} /></span>
          <span className="flex flex-col leading-tight flex-1">
            <span className="text-[14px] font-extrabold">কিস্তির আবেদন করুন</span>
            <span className="text-[11px] font-semibold text-white/80">নতুন পণ্যের জন্য কিস্তির আবেদন জমা দিন</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-white/60" />
        </Link>

        {plans.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
            <span className="size-14 rounded-full bg-[#f5f7fb] flex items-center justify-center"><CreditCard className="text-[#c9d3e6]" size={30} /></span>
            <span className="text-[15px] font-extrabold">কোনো কিস্তি নেই</span>
            <span className="text-[12px] text-[#5b6784]">আপনার জন্য কোনো কিস্তি প্ল্যান চালু নেই।</span>
          </div>
        ) : (
          plans.map((p) => {
            const s = STATUS[p.status] || STATUS.active;
            const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
            return (
              <Link
                key={p.planCode}
                href={`/customer/installments/${p.planCode}`}
                className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold truncate">{p.productModel}</p>
                    <p className="text-[11px] font-bold text-[#5b6784] font-mono">{p.planCode}</p>
                  </div>
                  <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border", s.cls)}>{s.label}</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#5b6784] mb-1">
                    <span>{p.paidCount}/{p.months} কিস্তি পরিশোধিত</span>
                    <span className="text-[#c81f38]">বাকি {bdt(p.remainingAmount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#eef1f6] overflow-hidden">
                    <div className={clsx("h-full rounded-full", p.status === "completed" ? "bg-[#1a9c4b]" : "bg-[#1f7cf0]")} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#eef1f6]">
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#5b6784]">
                    {p.status === "completed" ? <><CheckCircle2 size={14} className="text-[#178a42]" /> সম্পন্ন</> : <>মাসিক <b className="text-[#0b3d91]">{bdt(p.monthlyAmount)}</b></>}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-extrabold text-[#0b3d91]">বিস্তারিত<ChevronRight size={15} /></span>
                </div>
              </Link>
            );
          })
        )}

        <p className="text-[11px] text-center text-[#5b6784] px-4 pt-1">
          কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — 09649355555
        </p>
      </div>
    </CustomerLayout>
  );
}
