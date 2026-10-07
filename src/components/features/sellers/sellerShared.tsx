import clsx from "clsx";
import { Home, ShoppingBag, Wrench } from "lucide-react";
import Link from "next/link";

/** Short Bangla labels for service statuses (same meaning as the admin statuses). */
export const serviceStatusBn: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  in_progress: "টিম নিযুক্ত",
  appointment_retry: "পুনরায় সময় নির্ধারণ",
  staff_departed: "টিম রওনা হয়েছে",
  staff_arrived: "টিম পৌঁছেছে",
  service_center: "সার্ভিস সেন্টারে",
  service_center_received: "সেন্টারে গৃহীত",
  completed: "সম্পন্ন",
  canceled: "বাতিল",
};

export const statusTone = (s: string) =>
  s === "completed" ? "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" : s === "canceled" ? "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]" : s === "pending" ? "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]" : "bg-[#e8f1ff] text-[#1b6fd6] border-[#cfe0fb]";

export type PayKind = "cash" | "due" | "installment";

/** নগদ / বাকি / কিস্তি from the invoice's due fields. */
export function payKind(inv: { dueAmount: number; dueType: string | null } | null | undefined): PayKind {
  if (!inv || !(Number(inv.dueAmount) > 0)) return "cash";
  return inv.dueType === "installment" ? "installment" : "due";
}
export const payLabel: Record<PayKind, string> = { cash: "নগদ", due: "বাকি", installment: "কিস্তি" };

export function inWarranty(
  isWarrantyStopped: boolean | null | undefined,
  products: { warrantyStartDate: Date | string; warrantyDurationMonths: number }[] | undefined,
) {
  if (isWarrantyStopped) return false;
  const now = new Date();
  return (products ?? []).some((p) => {
    const e = new Date(p.warrantyStartDate);
    e.setMonth(e.getMonth() + p.warrantyDurationMonths);
    return e > now;
  });
}

/** Tabs: বিক্রি / সার্ভিস / ইন্সটল */
export function SellerTabs({ active, counts }: { active: "sales" | "services" | "installs"; counts?: { sales?: number; services?: number; installs?: number } }) {
  const tabs = [
    { key: "sales", label: "বিক্রি", icon: ShoppingBag, href: "/seller/customers", n: counts?.sales },
    { key: "services", label: "সার্ভিস", icon: Wrench, href: "/seller/services", n: counts?.services },
    { key: "installs", label: "ইন্সটল", icon: Home, href: "/seller/installs", n: counts?.installs },
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-md bg-white border border-[#e3e8f1] p-1">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className={clsx("h-9 rounded-md inline-flex items-center justify-center gap-1.5 text-[13px] font-extrabold", active === t.key ? "bg-[#1f7cf0] text-white" : "text-[#3d4a63]")}>
          <t.icon size={15} />
          {t.label}
          {t.n !== undefined && <span className={clsx("min-w-5 h-5 px-1 rounded-md text-[10.5px] inline-flex items-center justify-center", active === t.key ? "bg-white/25" : "bg-[#eef3fb]")}>{t.n}</span>}
        </Link>
      ))}
    </div>
  );
}

export function FilterChips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-2 px-2 [scrollbar-width:none]">
      {options.map((o) => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)} className={clsx("shrink-0 h-8 px-3 rounded-md border text-[12px] font-bold", value === o.key ? "bg-[#0b3d91] text-white border-[#0b3d91]" : "bg-white text-[#3d4a63] border-[#dfe6f2]")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Two labelled dropdowns (payment + warranty) so every list filters the same obvious way. */
export function FilterSelects({ pay, onPay, war, onWar }: { pay: "all" | PayKind; onPay: (v: "all" | PayKind) => void; war: "all" | "yes" | "no"; onWar: (v: "all" | "yes" | "no") => void }) {
  const cls = "h-10 w-full rounded-md border border-[#dfe6f2] bg-white px-2 text-[13px] font-bold text-[#16213a] outline-none focus:border-[#1f7cf0]";
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex flex-col gap-0.5">
        <span className="text-[11px] font-bold text-[#6b7690] px-0.5">পেমেন্ট</span>
        <select value={pay} onChange={(e) => onPay(e.target.value as "all" | PayKind)} className={cls}>
          <option value="all">সব</option>
          <option value="cash">{payLabel.cash}</option>
          <option value="due">{payLabel.due}</option>
          <option value="installment">{payLabel.installment}</option>
        </select>
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[11px] font-bold text-[#6b7690] px-0.5">ওয়ারেন্টি</span>
        <select value={war} onChange={(e) => onWar(e.target.value as "all" | "yes" | "no")} className={cls}>
          <option value="all">সব</option>
          <option value="yes">ওয়ারেন্টি আছে</option>
          <option value="no">ওয়ারেন্টি শেষ</option>
        </select>
      </label>
    </div>
  );
}
