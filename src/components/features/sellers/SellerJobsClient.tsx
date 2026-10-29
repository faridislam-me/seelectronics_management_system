"use client";

import { type ServiceChargeInfo, serviceChargeDue, serviceChargeReasonLabel } from "@/constants/serviceCharges";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ExternalLink, Phone, Search } from "lucide-react";
import { DataTable, EmptyRow, Td, Th } from "@/components/ui/DataTable";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterChips, FilterSelects, PayKind, SellerTabs, inWarranty, payKind, payLabel, serviceStatusBn, statusTone } from "./sellerShared";
import SellerPayButton from "./SellerPayButton";

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
  charge: ServiceChargeInfo | null;
  history: { status: string; createdAt: Date }[];
};

/** Read-only list of the seller's customer jobs (repairs or installs) with filters and a status timeline. */
export default function SellerJobsClient({ kind, jobs, counts }: { kind: "repair" | "install"; jobs: SellerJob[]; counts: { sales: number; services: number; installs: number } }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "completed" | "canceled">("all");
  const [pay, setPay] = useState<"all" | PayKind>("all");
  const [war, setWar] = useState<"all" | "yes" | "no">("all");
  const [viewJob, setViewJob] = useState<SellerJob | null>(null);

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
  const totalDue = jobs.reduce((t, j) => t + serviceChargeDue(j.charge), 0);

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
      <FilterChips value={status} onChange={setStatus} options={[{ key: "all", label: `সব (${jobs.length})` }, { key: "active", label: `চলমান (${jobs.filter((j) => !["completed", "canceled"].includes(j.status)).length})` }, { key: "completed", label: `সম্পন্ন (${jobs.filter((j) => j.status === "completed").length})` }, { key: "canceled", label: `বাতিল (${jobs.filter((j) => j.status === "canceled").length})` }]} />
      <FilterSelects pay={pay} onPay={setPay} war={war} onWar={setWar} />
      {totalDue > 0 && (
        <div className="rounded-md border border-[#f5dfa0] bg-[#fff8ea] px-3 py-2 text-[12.5px] font-bold text-[#8a4a05]">
          সার্ভিস চার্জ বাকি মোট ৳{Math.round(totalDue).toLocaleString()} ({jobs.filter((j) => serviceChargeDue(j.charge) > 0).length} টি কাজ) — ওয়ারেন্টির বাইরে / শহরের বাইরের সার্ভিসের চার্জ কাস্টমারের কাছ থেকে আদায় করে অফিসে জমা দিন।
        </div>
      )}

      <DataTable>
        <thead>
          <tr><Th>তারিখ</Th><Th>সার্ভিস আইডি</Th><Th>কাস্টমার</Th><Th>ফোন</Th><Th>পণ্য</Th><Th>পেমেন্ট</Th><Th>ওয়ারেন্টি</Th><Th>চার্জ</Th><Th>টেকনিশিয়ান</Th><Th>স্ট্যাটাস</Th><Th>ট্র্যাক</Th></tr>
        </thead>
        <tbody>
          {list.length === 0 && <EmptyRow cols={11} text="কিছু পাওয়া যায়নি" />}
          {list.map((j, i) => (
            <tr key={j.serviceId} className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
              <Td>{formatDate(j.createdAt)}</Td>
              <Td strong>{j.serviceId}</Td>
              <Td nowrap={false} className="min-w-[110px]">{j.customerName}<span className="block text-[11px] text-[#6b7690]">{j.customerId}</span></Td>
              <Td>{j.customerPhone}</Td>
              <Td nowrap={false} className="min-w-[130px] max-w-[220px]">
                <span className="font-semibold">{j.productType.toUpperCase()} {j.productModel}</span>
                {j.reportedIssue ? (
                  <>
                    <span className="block text-[11px] text-[#6b7690] overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{j.reportedIssue}</span>
                    <button type="button" onClick={() => setViewJob(j)} className="mt-0.5 text-[11px] font-bold text-[#1f6fd0] hover:underline">দেখুন</button>
                  </>
                ) : null}
              </Td>
              <Td>{payLabel[j.pay]}</Td>
              <Td className={j.warranty ? "text-[#178a42] font-bold" : "text-[#c81f38] font-bold"}>{j.warranty ? "আছে" : "শেষ"}</Td>
              <Td nowrap={false} className="min-w-[110px]">{j.charge ? <><b className={serviceChargeDue(j.charge) > 0 ? "text-[#b8620b]" : "text-[#178a42]"}>৳{Math.round(j.charge.amount).toLocaleString()} · {j.charge.status === "waived" ? "মওকুফ" : serviceChargeDue(j.charge) > 0 ? `বাকি ৳${Math.round(serviceChargeDue(j.charge)).toLocaleString()}` : "পরিশোধিত"}</b><span className="block text-[11px] text-[#6b7690]">{serviceChargeReasonLabel(j.charge.reason)}</span>{serviceChargeDue(j.charge) > 0 && <span className="block mt-1"><SellerPayButton targetType="service_charge" targetRef={j.serviceId} label={`${j.productType.toUpperCase()} ${j.productModel} · সার্ভিস #${j.serviceId}`} due={serviceChargeDue(j.charge)} /></span>}</> : "—"}</Td>
              <Td>{j.staffName ? <>{j.staffName}{j.staffPhone && <a href={`tel:${j.staffPhone}`} className="ml-1 inline-flex align-middle text-[#1f7cf0]"><Phone size={12} /></a>}</> : "—"}</Td>
              <Td><span className={clsx("h-6 px-2 rounded-md border text-[10.5px] font-extrabold inline-flex items-center whitespace-nowrap", statusTone(j.status))}>{serviceStatusBn[j.status] ?? j.status}</span></Td>
              <Td><Link href={`/service-track?trackingId=${j.serviceId}`} className="inline-flex items-center gap-1 font-bold text-[#1f5fc9]"><ExternalLink size={13} />দেখুন</Link></Td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      {viewJob && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-2" onClick={() => setViewJob(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[460px] rounded-md bg-white p-3.5 flex flex-col gap-2 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-[#16213a]">{viewJob.productType.toUpperCase()} {viewJob.productModel}</span>
              <button type="button" onClick={() => setViewJob(null)} className="text-[#9aa4b8] text-xl leading-none px-1">×</button>
            </div>
            <div className="text-[12px] font-semibold text-[#5b6784]">{viewJob.customerName} · {viewJob.customerPhone} · {viewJob.serviceId}</div>
            <div className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] p-2.5 text-[13px] text-[#2b3445] whitespace-pre-wrap break-words max-h-[55vh] overflow-auto">
              {viewJob.reportedIssue || "—"}
            </div>
            <Link href={`/service-track?trackingId=${viewJob.serviceId}`} className="mt-1 h-10 rounded-md bg-[#1f7cf0] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5"><ExternalLink size={15} />স্ট্যাটাস ট্র্যাক করুন</Link>
          </div>
        </div>
      )}
    </div>
  );
}
