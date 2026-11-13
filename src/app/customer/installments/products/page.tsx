import { getMyInstallmentPlans } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { productImage } from "@/lib/serviceStatusStyle";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, ChevronRight, Package } from "lucide-react";

// Per-type real product photo (same assets the service pages use). ips_package
// shares the IPS photo; anything without a dedicated photo falls back to a
// generic product photo inside productImage().
const productPhoto = (type: string) => productImage(type === "ips_package" ? "ips" : type);
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

// Dashboard tiles deep-link here with ?filter=ongoing (চলমান কিস্তি) or
// ?filter=due (বাকি কিস্তি) so each tile opens its own filtered list.
const FILTERS: { key: string; label: string; subtitle: string }[] = [
  { key: "all", label: "সব", subtitle: "সকল কিস্তি পণ্যের তালিকা" },
  { key: "ongoing", label: "চলমান কিস্তি", subtitle: "চলমান কিস্তি পণ্যের তালিকা" },
  { key: "due", label: "বাকি কিস্তি", subtitle: "যেসব পণ্যের কিস্তি এখনো বাকি" },
];

function applyFilter(plans: any[], filter: string) {
  if (filter === "ongoing") return plans.filter((p) => p.status === "active");
  if (filter === "due") return plans.filter((p) => p.status === "active" && Number(p.remainingAmount) > 0);
  return plans;
}

export default async function MyInstallmentProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.key === sp.filter) ? sp.filter! : "all";
  const activeFilter = FILTERS.find((f) => f.key === filter)!;

  const res = await getMyInstallmentPlans();
  const allPlans = res.success && "data" in res && res.data ? (res.data as any[]) : [];
  const plans = applyFilter(allPlans, filter);

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
            <span className="text-[11px] font-semibold text-[#5b6784]">{activeFilter.subtitle}</span>
          </span>
          <span className="shrink-0 text-[12px] font-extrabold text-[#0b3d91] bg-[#e8f1ff] px-2 py-1 rounded-full">{plans.length}</span>
        </div>

        {/* Filter chips — each tile from the dashboard lands on its own filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-2 px-2 [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const activeChip = f.key === filter;
            const count = applyFilter(allPlans, f.key).length;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/customer/installments/products" : `/customer/installments/products?filter=${f.key}`}
                className={clsx(
                  "shrink-0 h-8 px-3 rounded-full border text-[11.5px] font-extrabold transition-colors flex items-center gap-1.5",
                  activeChip ? "border-[#0b3d91] bg-[#0b3d91] text-white" : "border-[#dfe6f2] bg-white text-[#5b6784]",
                )}
              >
                {f.label}
                <span className={clsx("text-[10px] font-extrabold rounded-full px-1.5 leading-[16px]", activeChip ? "bg-white/20 text-white" : "bg-[#eef1f6] text-[#5b6784]")}>{count}</span>
              </Link>
            );
          })}
        </div>

        {plans.length === 0 ? (
          <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center flex flex-col items-center gap-2">
            <span className="size-14 rounded-full bg-[#f5f7fb] flex items-center justify-center"><Package className="text-[#c9d3e6]" size={28} /></span>
            <span className="text-[14px] font-extrabold">{filter === "all" ? "কোনো কিস্তিপণ্য নেই" : "এই তালিকায় কোনো পণ্য নেই"}</span>
            <span className="text-[12px] text-[#5b6784]">
              {filter === "ongoing"
                ? "এই মুহূর্তে কোনো চলমান কিস্তি নেই।"
                : filter === "due"
                  ? "কোনো বাকি কিস্তি নেই — সব পরিশোধিত।"
                  : "আপনার জন্য কোনো কিস্তি পণ্য নেই।"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {plans.map((p) => {
              const s = PLAN_STATUS[p.status] || PLAN_STATUS.active;
              const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
              const done = p.status === "completed";
              // Admin-uploaded photo wins; otherwise a real per-type product photo.
              const imgSrc = p.productImageUrl || productPhoto(p.productType);
              const specLine = [p.productSpec, p.displayType, p.vaWatt, p.volt].filter(Boolean).join(" · ");
              return (
                <Link
                  key={p.planCode}
                  href={`/customer/installments/${p.planCode}`}
                  className={clsx(
                    "group relative rounded-md bg-white border border-[#e4e9f2] border-l-[3px] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.05)] active:scale-[0.995] transition",
                    done ? "border-l-[#1a9c4b]" : "border-l-[#1f7cf0]",
                  )}
                >
                  {/* Top: product image + name/spec + status */}
                  <div className="flex items-start gap-3">
                    <span className="size-16 rounded-md overflow-hidden flex items-center justify-center shrink-0 border bg-[#f6f9ff] border-[#e4e9f2] p-1">
                      {/* object-contain so the whole product photo shows (client: image must appear full, not zoomed/cropped). */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgSrc} alt={p.productModel} className="w-full h-full object-contain" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-extrabold leading-tight">
                          {p.productBrand ? `${p.productBrand} ` : ""}{p.productModel}
                        </span>
                        <span className={clsx("shrink-0 text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
                      </div>
                      {specLine && <span className="text-[11px] font-semibold text-[#5b6784]">{specLine}</span>}
                      <span className="text-[10.5px] font-bold text-[#8794ab] font-mono">{p.planCode}</span>
                    </div>
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
