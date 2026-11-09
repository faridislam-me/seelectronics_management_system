import { getMyInstallmentDashboard } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  History,
  Phone,
  PlusCircle,
  User,
} from "lucide-react";
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

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review: { label: "পর্যালোচনাধীন", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default async function CustomerInstallmentsPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyInstallmentDashboard();
  if (!res.success || !("data" in res) || !res.data) {
    return (
      <CustomerLayout>
        <div className="p-6 text-center text-[#5b6784]">তথ্য লোড করা যায়নি</div>
      </CustomerLayout>
    );
  }

  const { customer, photoUrl, plans, applications, overdueCount, totalPaid, totalRemaining } = res.data;
  const activePlans = plans.filter((p: any) => p.status === "active");
  const primaryPlan = activePlans[0] as any | undefined;
  const pendingApps = (applications as any[]).filter((a: any) => a.status !== "approved");
  const firstPlanCode = plans.length > 0 ? (plans[0] as any).planCode : null;

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
        {/* Profile card */}
        <div className="rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_55%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={customer.name} className="size-16 rounded-full object-cover border-2 border-white/30 shrink-0" />
          ) : (
            <span className="size-16 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center shrink-0">
              <User size={28} className="text-white/80" />
            </span>
          )}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[16px] font-extrabold truncate">{customer.name}</span>
            <span className="text-[12px] font-semibold text-white/90">{customer.phone}</span>
            {customer.address && <span className="text-[11px] text-white/75 truncate">{customer.address}</span>}
            <span className="text-[10px] font-mono text-white/60 mt-0.5">{customer.customerId}</span>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-[10px] font-bold text-white/60 uppercase">মোট পরিশোধ</span>
            <span className="text-[18px] font-extrabold leading-tight">{bdt(totalPaid)}</span>
            {totalRemaining > 0 && (
              <span className="text-[11px] font-bold text-[#ff8a8a]">বাকি {bdt(totalRemaining)}</span>
            )}
          </div>
        </div>

        {/* Active plan summary */}
        {primaryPlan && (
          <Link
            href={`/customer/installments/${primaryPlan.planCode}`}
            className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold truncate">{primaryPlan.productModel}</p>
                <p className="text-[11px] font-bold text-[#5b6784] font-mono">{primaryPlan.planCode}</p>
              </div>
              <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border", PLAN_STATUS[primaryPlan.status]?.cls || PLAN_STATUS.active.cls)}>
                {PLAN_STATUS[primaryPlan.status]?.label || "চলমান"}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold text-[#5b6784] mb-1">
                <span>{primaryPlan.paidCount}/{primaryPlan.months} কিস্তি পরিশোধিত</span>
                <span className="text-[#c81f38]">বাকি {bdt(primaryPlan.remainingAmount)}</span>
              </div>
              <div className="h-2 rounded-full bg-[#eef1f6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1f7cf0]"
                  style={{ width: `${primaryPlan.months > 0 ? Math.round((primaryPlan.paidCount / primaryPlan.months) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#eef1f6]">
              <span className="text-[12px] font-semibold text-[#5b6784]">মাসিক <b className="text-[#0b3d91]">{bdt(primaryPlan.monthlyAmount)}</b></span>
              <span className="inline-flex items-center gap-0.5 text-[12px] font-extrabold text-[#0b3d91]">বিস্তারিত<ChevronRight size={15} /></span>
            </div>
          </Link>
        )}

        {/* Action grid */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/customer/installments/apply" className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all">
            <span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><PlusCircle size={20} /></span>
            <span className="text-[12px] font-extrabold">কিস্তির আবেদন</span>
          </Link>
          <Link href="#applications" className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all relative">
            <span className="size-10 rounded-full bg-[#fff6e3] text-[#b8620b] flex items-center justify-center shrink-0"><ClipboardList size={20} /></span>
            <span className="text-[12px] font-extrabold">আবেদন ট্র্যাক</span>
            {pendingApps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-[#c81f38] text-white text-[10px] font-extrabold flex items-center justify-center">{pendingApps.length}</span>
            )}
          </Link>
          {firstPlanCode ? (
            <Link href={`/customer/installments/${firstPlanCode}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all">
              <span className="size-10 rounded-full bg-[#f3e9ff] text-[#8b3fe8] flex items-center justify-center shrink-0"><History size={20} /></span>
              <span className="text-[12px] font-extrabold">পেমেন্ট</span>
            </Link>
          ) : (
            <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center opacity-50">
              <span className="size-10 rounded-full bg-[#f3e9ff] text-[#8b3fe8] flex items-center justify-center shrink-0"><History size={20} /></span>
              <span className="text-[12px] font-extrabold">পেমেন্ট</span>
            </div>
          )}
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
            <span className="size-10 rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center shrink-0"><CreditCard size={20} /></span>
            <span className="text-[12px] font-extrabold">চলমান কিস্তি</span>
            <span className="text-[15px] font-extrabold text-[#1a9c4b] -mt-1">{activePlans.length}</span>
          </div>
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
            <span className="size-10 rounded-full bg-[#ffe9ec] text-[#c81f38] flex items-center justify-center shrink-0"><AlertTriangle size={20} /></span>
            <span className="text-[12px] font-extrabold">বাকি কিস্তি</span>
            <span className="text-[15px] font-extrabold text-[#c81f38] -mt-1">{overdueCount}</span>
          </div>
          <a href="tel:09649355555" className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col items-center gap-1.5 text-center shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all">
            <span className="size-10 rounded-full bg-[#e0f7f5] text-[#0e8a7d] flex items-center justify-center shrink-0"><Phone size={20} /></span>
            <span className="text-[12px] font-extrabold">যোগাযোগ</span>
          </a>
        </div>

        {/* Pending applications */}
        {pendingApps.length > 0 && (
          <div id="applications" className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold flex items-center gap-1.5"><ClipboardList size={15} className="text-[#0b3d91]" /> আমার আবেদন</span>
            {pendingApps.map((a: any) => {
              const st = APP_STATUS[a.status] || APP_STATUS.pending;
              return (
                <Link
                  key={a.applicationCode}
                  href={`/customer/installments/applications/${a.applicationCode}`}
                  className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]"
                >
                  <span className="size-9 rounded-full bg-[#f5f7fb] flex items-center justify-center shrink-0"><ClipboardList size={16} className="text-[#5b6784]" /></span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-[12px] font-extrabold truncate">{a.productModel}</span>
                    <span className="text-[10px] font-semibold text-[#5b6784]">{a.applicationCode} · {formatDate(a.createdAt)}</span>
                  </span>
                  <span className="flex flex-col items-end shrink-0 gap-1">
                    <span className={clsx("text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border", st.cls)}>{st.label}</span>
                    <span className="text-[10px] font-extrabold text-[#0b3d91]">ট্র্যাক →</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* All plans */}
        {plans.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold flex items-center gap-1.5"><CreditCard size={15} className="text-[#0b3d91]" /> সকল কিস্তি প্ল্যান</span>
            {(plans as any[]).slice(primaryPlan ? 1 : 0).map((p: any) => {
              const s = PLAN_STATUS[p.status] || PLAN_STATUS.active;
              const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
              return (
                <Link
                  key={p.planCode}
                  href={`/customer/installments/${p.planCode}`}
                  className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]"
                >
                  <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-extrabold truncate">{p.productModel}</span>
                      <span className={clsx("shrink-0 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#eef1f6] overflow-hidden">
                      <div className={clsx("h-full rounded-full", p.status === "completed" ? "bg-[#1a9c4b]" : "bg-[#1f7cf0]")} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#5b6784]">
                      <span>{p.paidCount}/{p.months} পরিশোধিত</span>
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

        {plans.length === 0 && pendingApps.length === 0 && (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center flex flex-col items-center gap-2">
            <span className="size-14 rounded-full bg-[#f5f7fb] flex items-center justify-center"><CreditCard className="text-[#c9d3e6]" size={28} /></span>
            <span className="text-[14px] font-extrabold">কোনো কিস্তি নেই</span>
            <span className="text-[12px] text-[#5b6784]">আপনার জন্য কোনো কিস্তি প্ল্যান চালু নেই।</span>
          </div>
        )}

        <p className="text-[11px] text-center text-[#5b6784] px-4">
          কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — 09649355555
        </p>
      </div>
    </CustomerLayout>
  );
}
