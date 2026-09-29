"use client";

import { formatDate } from "@/utils";
import clsx from "clsx";
import { ExternalLink, Home, Phone, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterChips, PayKind, SellerTabs, inWarranty, payKind, payLabel, serviceStatusBn, statusTone } from "./sellerShared";

export type SellerJob = {
  serviceId: string;
  status: string;
  type: string;
  productType: string;
  productModel: string;
  staffName: string | null;
  staffPhone: string | null;
  reportedIssue: string | null;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  customerId: string;
  pay: PayKind;
  warranty: boolean;
  history: { status: string; createdAt: Date }[];
};

/** Read-only list of the seller's customer jobs (repairs or installs) with filters and a status timeline. */
export default function SellerJobsClient({ kind, jobs, counts }: { kind: "repair" | "install"; jobs: SellerJob[]; counts: { sales: number; services: number; installs: number } }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "completed" | "canceled">("all");
  const [pay, setPay] = useState<"all" | PayKind>("all");
  const [war, setWar] = useState<"all" | "yes" | "no">("all");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (t && ![j.customerName, j.customerPhone, j.customerId, j.serviceId, j.productModel].some((v) => v?.toLowerCase().includes(t))) return false;
      if (status === "completed" && j.status !== "completed") return false;
      if (status === "canceled" && j.status !== "canceled") return false;
      if (status === "active" && ["completed", "canceled"].includes(j.status)) return false;
      if (pay !== "all" && j.pay !== pay) return false;
      if (war === "yes" && !j.warranty) return false;
      if (war === "no" && j.warranty) return false;
      return true;
    });
  }, [jobs, q, status, pay, war]);

  const title = kind === "install" ? "ইন্সটল লিস্ট" : "সার্ভিস লিস্ট";

  return (
    <div className="flex flex-col gap-2 p-2">
      <SellerTabs active={kind === "install" ? "installs" : "services"} counts={counts} />
      <div className="flex items-end justify-between px-0.5">
        <span className="flex flex-col"><span className="text-[17px] font-extrabold text-[#16213a]">{title}</span><span className="text-[11.5px] font-semibold text-[#6b7690]">{list.length} / {jobs.length} টি · স্ট্যাটাস SE Electronics অফিস থেকে আপডেট হয়</span></span>
      </div>
      <label className="flex items-center gap-2 h-10 px-3 rounded-md bg-white border border-[#e3e8f1] text-sm">
        <Search size={16} className="text-[#9aa4b8]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, ফোন, আইডি বা সার্ভিস আইডি" className="flex-1 outline-none bg-transparent" />
      </label>
      <FilterChips value={status} onChange={setStatus} options={[{ key: "all", label: "সব" }, { key: "active", label: "চলমান" }, { key: "completed", label: "সম্পন্ন" }, { key: "canceled", label: "বাতিল" }]} />
      <FilterChips value={pay} onChange={setPay} options={[{ key: "all", label: "সব পেমেন্ট" }, { key: "cash", label: payLabel.cash }, { key: "due", label: payLabel.due }, { key: "installment", label: payLabel.installment }]} />
      <FilterChips value={war} onChange={setWar} options={[{ key: "all", label: "সব ওয়ারেন্টি" }, { key: "yes", label: "ওয়ারেন্টি আছে" }, { key: "no", label: "ওয়ারেন্টি শেষ" }]} />

      {list.length === 0 && <div className="rounded-md bg-white border border-[#e3e8f1] py-8 text-center text-sm text-[#9aa4b8]">কিছু পাওয়া যায়নি</div>}
      {list.map((j) => (
        <details key={j.serviceId} className="rounded-md bg-white border border-[#e3e8f1] shadow-[0_4px_14px_rgba(11,61,145,0.05)]">
          <summary className="list-none cursor-pointer p-2.5 flex items-center gap-2.5">
            <span className={clsx("size-10 rounded-md flex items-center justify-center shrink-0", j.status === "completed" ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#e8f1ff] text-[#1f7cf0]")}>{j.type === "install" ? <Home size={19} /> : <Wrench size={19} />}</span>
            <span className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-extrabold text-[#16213a] truncate">{j.customerName} · {j.productType.toUpperCase()} {j.productModel}</span>
              <span className="text-[11px] font-semibold text-[#6b7690] truncate">{j.serviceId} · {formatDate(j.createdAt)} · {payLabel[j.pay]} · {j.warranty ? "ওয়ারেন্টি আছে" : "ওয়ারেন্টি শেষ"}</span>
            </span>
            <span className={clsx("shrink-0 h-6 px-2 rounded-md border text-[10.5px] font-extrabold inline-flex items-center", statusTone(j.status))}>{serviceStatusBn[j.status] ?? j.status}</span>
          </summary>
          <div className="px-2.5 pb-2.5 flex flex-col gap-2 border-t border-[#eef1f6] pt-2">
            <span className="flex items-center justify-between text-[12px] text-[#3d4a63]">
              <span>{j.customerPhone}</span>
              {j.staffName && <span>টেকনিশিয়ান: <b className="text-[#16213a]">{j.staffName}</b>{j.staffPhone && <a href={`tel:${j.staffPhone}`} className="ml-1 inline-flex items-center text-[#1f7cf0]"><Phone size={12} /></a>}</span>}
            </span>
            <ol className="flex flex-col gap-1.5">
              {j.history.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]">
                  <span className={clsx("size-2.5 rounded-full shrink-0", i === j.history.length - 1 ? "bg-[#1f7cf0] animate-pulse" : "bg-[#9fc2f5]")} />
                  <span className="font-bold text-[#16213a] flex-1">{serviceStatusBn[h.status] ?? h.status}</span>
                  <span className="text-[#6b7690]">{new Date(h.createdAt).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ol>
            <Link href={`/service-track?trackingId=${j.serviceId}`} className="self-start h-8 px-3 rounded-md border border-[#bcd4fb] text-[#0b3d91] text-[12px] font-bold inline-flex items-center gap-1.5"><ExternalLink size={13} />বিস্তারিত ট্র্যাকিং</Link>
          </div>
        </details>
      ))}
    </div>
  );
}
