import { getMyInstallmentPlans } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import { productImage } from "@/lib/serviceStatusStyle";
import clsx from "clsx";
import { ArrowLeft, CalendarClock, CheckCircle2, ChevronRight, Handshake, Package } from "lucide-react";

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
      <div className="flex flex-col gap-3 px-2 pt-2 pb-3 text-[#16213a]">
        {/* Header — brand banner with soft wave, matching the কিস্তির পণ্য design */}
        <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(110deg,#0a2f70,#1f7cf0)] text-white px-3.5 py-3.5 shadow-[0_10px_26px_rgba(11,61,145,0.28)]">
          <div className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-2 top-6 size-20 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-3">
            <Link href="/customer/installments" className="size-9 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <ArrowLeft size={18} />
            </Link>
            <span className="size-10 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <CalendarClock size={22} />
            </span>
            <span className="flex flex-col leading-tight min-w-0 flex-1">
              <span className="text-[17px] font-black truncate">আমার কিস্তিপণ্য</span>
              <span className="text-[11px] font-semibold text-white/85">{activeFilter.subtitle}</span>
            </span>
            <span className="shrink-0 text-[13px] font-black bg-white/20 border border-white/25 px-2.5 py-1 rounded-full">{plans.length}</span>
          </div>
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
                  "shrink-0 h-9 px-3.5 rounded-full border text-[12px] font-extrabold transition-colors flex items-center gap-1.5",
                  activeChip ? "border-transparent bg-[linear-gradient(110deg,#0a2f70,#1f7cf0)] text-white shadow-[0_4px_12px_rgba(11,61,145,0.25)]" : "border-[#dfe6f2] bg-white text-[#5b6784]",
                )}
              >
                {f.label}
                <span className={clsx("text-[10px] font-black rounded-full px-1.5 leading-[16px]", activeChip ? "bg-white/20 text-white" : "bg-[#eef1f6] text-[#5b6784]")}>{count}</span>
              </Link>
            );
          })}
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl bg-white border border-dashed border-[#c9d3e6] p-8 text-center flex flex-col items-center gap-2">
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
          <div className="flex flex-col gap-3">
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
                    "group relative rounded-xl bg-white border border-[#e4e9f2] p-3 flex flex-col gap-3 shadow-[0_6px_18px_rgba(11,61,145,0.07)] active:scale-[0.995] transition overflow-hidden",
                  )}
                >
                  <span className={clsx("absolute left-0 top-0 h-full w-[4px]", done ? "bg-[#1a9c4b]" : "bg-[linear-gradient(180deg,#1f7cf0,#0b3d91)]")} />

                  {/* Top: product image + name/spec + status */}
                  <div className="flex items-start gap-3">
                    <span className="size-[72px] rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e9f2] bg-[#f3f8ff] p-1.5">
                      {/* object-contain so the whole product photo shows (client: image must appear full, not zoomed/cropped). */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgSrc} alt={p.productModel} className="w-full h-full object-contain" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[15px] font-black leading-tight">
                          {p.productBrand ? `${p.productBrand} ` : ""}{p.productModel}
                        </span>
                        <span className={clsx("shrink-0 text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
                      </div>
                      {specLine && <span className="text-[11.5px] font-semibold text-[#5b6784]">{specLine}</span>}
                      <span className="text-[10.5px] font-bold text-[#8794ab] font-mono">{p.planCode}</span>
                    </div>
                  </div>

                  {/* কিস্তি সুবিধা highlight — monthly + total, like the কিস্তির পণ্য design */}
                  <div className="rounded-lg bg-[#f3f8ff] border border-[#ddeafb] p-2.5 flex items-center justify-between gap-2">
                    <span className="flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-[#5b6784]">মাসিক কিস্তি</span>
                      <span className="text-[18px] font-black text-[#0b3d91] leading-none mt-0.5">
                        {bdt(p.monthlyAmount)}<span className="text-[11px] font-bold text-[#5b6784]"> / মাস</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-[#5b6784]">মোট মূল্য</span>
                      <span className="text-[13px] font-extrabold text-[#16213a] mt-0.5">{bdt(p.totalPayable)}</span>
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
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

                  {/* Footer: remaining + CTA */}
                  <div className="flex items-center justify-between border-t border-[#eef1f6] pt-2.5">
                    <span className="text-[11.5px] font-bold">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-[#178a42]"><CheckCircle2 size={14} /> সম্পূর্ণ পরিশোধিত</span>
                      ) : (
                        <span className="text-[#5b6784]">বাকি <span className="text-[#c81f38] font-black text-[13px]">{bdt(p.remainingAmount)}</span></span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 h-9 px-3.5 rounded-lg bg-[linear-gradient(110deg,#0a2f70,#1f7cf0)] text-white text-[12px] font-extrabold shadow-[0_5px_14px_rgba(11,61,145,0.28)]">
                      ট্র্যাকিং ও বিস্তারিত <ChevronRight size={15} className="transition group-active:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom banner — সহজ কিস্তি, সহজ জীবন */}
        {plans.length > 0 && (
          <div className="relative overflow-hidden rounded-xl bg-[#eaf2ff] border border-[#dbe8fb] px-4 py-3.5 flex items-center gap-3">
            <div className="pointer-events-none absolute -right-6 -bottom-8 size-28 rounded-full bg-white/50" />
            <span className="size-11 rounded-xl bg-white flex items-center justify-center shrink-0 text-[#0b3d91] shadow-[0_4px_12px_rgba(11,61,145,0.12)]">
              <Handshake size={24} />
            </span>
            <span className="relative flex flex-col leading-tight">
              <span className="text-[15px] font-black text-[#0b3d91]">সহজ কিস্তি, সহজ জীবন</span>
              <span className="text-[11.5px] font-semibold text-[#45608f]">স্বল্প কিস্তিতে আপনার প্রয়োজনীয় পণ্য এখন আরও কাছে।</span>
            </span>
          </div>
        )}

        <p className="text-[11px] text-center text-[#5b6784] px-4">
          কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — <a href="tel:09649355555" className="font-bold text-[#1f5fc9]">09649355555</a>
        </p>
      </div>
    </CustomerLayout>
  );
}
