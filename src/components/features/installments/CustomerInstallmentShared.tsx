import { productImage } from "@/lib/serviceStatusStyle";
import clsx from "clsx";
import { ArrowLeft, CalendarDays, CreditCard, Wallet } from "lucide-react";
import Link from "next/link";

// Pieces shared by the two customer plan pages: the plan detail page
// (CustomerInstallmentDetail) and the payment page (CustomerInstallmentPayment).

export const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const PLAN_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-[#e8f1ff] text-[#1b6fd6]" },
  completed: { label: "শেষ হয়েছে", cls: "bg-[#e9f9ef] text-[#178a42]" },
  defaulted: { label: "খেলাপি", cls: "bg-[#fff6e3] text-[#b8620b]" },
  banned: { label: "ব্যান", cls: "bg-[#ffe9ec] text-[#c81f38]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-500" },
};

/** True once the plan is fully paid off (server marks it "completed"). */
export const isPlanComplete = (plan: any): boolean =>
  plan?.status === "completed" || (plan?.remainingCount != null && plan.remainingCount <= 0 && plan?.status === "active");

// Human-readable product category labels for the stored productType codes.
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fridge: "ফ্রিজ",
  ac: "এসি",
  tv: "টিভি",
  oven: "ওভেন",
  washing_machine: "ওয়াশিং মেশিন",
  mobile: "মোবাইল",
  ips: "আই পি এস",
  battery: "ব্যাটারি",
  ips_package: "আই পি এস প্যাকেজ",
  stabilizer: "স্ট্যাবিলাইজার",
  blender: "ব্লেন্ডার",
  others: "অন্যান্য",
};

// Main product title = "{Brand} {category}" (e.g. "Walton ফ্রিজ"). Falls back to
// the category alone, then the model, so it is never empty.
export function productTitle(p: any): string {
  const type = p.productType ? PRODUCT_TYPE_LABELS[p.productType] || p.productType : "";
  const brand = (p.productBrand || "").trim();
  return [brand, type].filter(Boolean).join(" ").trim() || p.productModel || "প্রোডাক্ট";
}

/** Page header: back arrow, product title / model / plan code, status badge. */
export function PlanHeader({ plan, backHref }: { plan: any; backHref: string }) {
  const s = PLAN_STATUS[plan.status] || PLAN_STATUS.active;
  return (
    <div className="flex items-center gap-2.5">
      <Link href={backHref} className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
      <span className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-[16px] font-extrabold truncate">{productTitle(plan)}</span>
        <span className="text-[11.5px] font-bold text-[#16213a] truncate">মডেল: {plan.productModel}</span>
        <span className="text-[11px] font-bold text-[#5b6784] font-mono">{plan.planCode}</span>
      </span>
      <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border", s.cls)}>{s.label}</span>
    </div>
  );
}

const HeroStat = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <div className="flex flex-col items-center text-center px-1 gap-0.5">
    <span className={clsx("inline-flex", accent ? "text-[#0b3d91]" : "text-[#7b8aa3]")}>{icon}</span>
    <span className="text-[9.5px] font-semibold text-[#5b6784] leading-tight">{label}</span>
    <span className={clsx("text-[12.5px] font-black leading-tight", accent ? "text-[#0b3d91]" : "text-[#16213a]")}>{value}</span>
  </div>
);

/** Hero card — product photo + model/code/status + down payment / monthly / term. */
export function PlanHeroCard({ plan, productImageUrl }: { plan: any; productImageUrl?: string | null }) {
  const s = PLAN_STATUS[plan.status] || PLAN_STATUS.active;
  // Hero image: admin-set photo wins, else a real per-type product photo.
  const heroImg = productImageUrl || productImage(plan.productType === "ips_package" ? "ips" : plan.productType);
  return (
    <div className="rounded-xl bg-white border border-[#e4e9f2] p-3 shadow-[0_6px_18px_rgba(11,61,145,0.07)]">
      <div className="flex items-center gap-3">
        <span className="size-[80px] rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e9f2] bg-[#f3f8ff] p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImg} alt={plan.productModel} className="w-full h-full object-contain" />
        </span>
        <div className="flex flex-col min-w-0 flex-1 leading-tight gap-1">
          <span className="text-[19px] font-black truncate">{productTitle(plan)}</span>
          <span className="text-[12.5px] font-extrabold text-[#16213a] truncate">মডেল: {plan.productModel}</span>
          <span className="text-[12px] font-bold text-[#0b3d91] font-mono">{plan.planCode}</span>
          <span className={clsx("self-start text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 mt-3 pt-3 border-t border-[#eef1f6] divide-x divide-[#eef1f6]">
        <HeroStat icon={<Wallet size={16} />} label="ডাউন পেমেন্ট" value={bdt(plan.downPayment)} />
        <HeroStat icon={<CreditCard size={16} />} label="মাসিক কিস্তি" value={bdt(plan.monthlyAmount)} accent />
        <HeroStat icon={<CalendarDays size={16} />} label="মেয়াদ" value={`${plan.months} মাস`} />
      </div>
    </div>
  );
}
