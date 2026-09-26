"use client";

import { Modal } from "@/components/ui";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Bell, Calendar, CheckCircle2, ChevronRight, CreditCard, ExternalLink, Inbox, LucideIcon, Settings, User, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type FeedItem = {
  id: string;
  isRead: boolean;
  createdAt: Date | string;
  title: string;
  message: string;
  link?: string | null;
  /** used for filtering and colouring */
  kind: "payment" | "approval" | "system" | "notice";
  priority?: string | null;
  onOpen?: () => Promise<void> | void;
};

const kindMeta: Record<FeedItem["kind"], { icon: LucideIcon; tile: string; stripe: string; tag: string; tagCls: string }> = {
  payment: { icon: Wallet, tile: "bg-[#1f7cf0]", stripe: "border-l-[#1f7cf0]", tag: "Success", tagCls: "bg-[#e9f9ef] text-[#178a42]" },
  approval: { icon: Settings, tile: "bg-[#1a9c4b]", stripe: "border-l-[#1a9c4b]", tag: "Approved", tagCls: "bg-[#e9f9ef] text-[#178a42]" },
  system: { icon: User, tile: "bg-[#2f3b52]", stripe: "border-l-[#2f3b52]", tag: "Info", tagCls: "bg-[#e8f1ff] text-[#1b6fd6]" },
  notice: { icon: Bell, tile: "bg-[#e0243f]", stripe: "border-l-[#e0243f]", tag: "Important", tagCls: "bg-[#ffe9ec] text-[#c81f38]" },
};

/** Tabbed notification feed used by customer and staff. */
export default function NotificationFeed({ items, isLoading, heroImage }: { items: FeedItem[]; isLoading: boolean; heroImage?: string }) {
  const [filter, setFilter] = useState<"all" | FeedItem["kind"]>("all");
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const unread = items.filter((i) => !i.isRead).length;
  const list = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const tabs: { key: "all" | FeedItem["kind"]; label: string; icon: LucideIcon }[] = [
    { key: "all", label: "All", icon: Bell }, { key: "payment", label: "Payment", icon: CreditCard }, { key: "approval", label: "Approval", icon: CheckCircle2 }, { key: "system", label: "System", icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#071f4d_0%,#0b3d91_55%,#1f7cf0_100%)] text-white p-3.5 min-h-[112px] flex items-center shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="absolute inset-y-0 right-0 w-[48%] object-cover opacity-90 [mask-image:linear-gradient(90deg,transparent,black_35%)]" />
        )}
        <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="size-14 rounded-md bg-[#1f7cf0] flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(0,40,120,0.4)]"><Bell size={28} /></span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[clamp(22px,6.4vw,28px)] font-extrabold leading-none">Notifications</span>
            <span className="text-[12.5px] font-semibold text-white/90">Stay updated with the latest news &amp; activities</span>
            <span className="mt-1 h-1 w-8 rounded-full bg-[#7fb4ff]" />
          </span>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setFilter(t.key)} className={clsx("shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-bold border transition-all", filter === t.key ? "bg-[#1f7cf0] text-white border-[#1f7cf0] shadow-[0_6px_14px_rgba(31,124,240,0.35)]" : "bg-white text-[#16213a] border-[#dfe6f2]")}>
            <t.icon size={15} />{t.label}
            {t.key === "all" && unread > 0 && <span className="ml-0.5 min-w-5 h-5 px-1 rounded-full bg-[#e5484d] text-white text-[10px] font-extrabold inline-flex items-center justify-center">{unread}</span>}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-md bg-white border border-[#dfe6f2] animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="rounded-md bg-white border border-[#dfe6f2] p-8 text-center flex flex-col items-center gap-2">
          <span className="size-12 rounded-full bg-[#eef3fb] text-[#9aa4b8] flex items-center justify-center"><Inbox size={24} /></span>
          <span className="text-[15px] font-extrabold">All Caught Up!</span>
          <span className="text-[11px] font-bold text-[#9aa4b8] uppercase tracking-wider">No notifications</span>
        </div>
      ) : (
        list.map((item) => {
          const m = kindMeta[item.kind];
          const tag = item.kind === "notice" ? (item.priority === "urgent" || item.priority === "high" ? "Important" : "Notice") : m.tag;
          return (
            <button key={item.id} type="button" onClick={async () => { if (!item.isRead && item.onOpen) await item.onOpen(); setSelected({ ...item, isRead: true }); }}
              className={clsx("text-left rounded-md bg-white border border-[#dfe6f2] border-l-4 p-2.5 flex items-start gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-all", m.stripe, item.isRead && "opacity-80")}>
              <span className={clsx("size-12 rounded-md text-white flex items-center justify-center shrink-0", m.tile)}>{item.kind === "notice" && item.priority === "urgent" ? <Zap size={22} /> : <m.icon size={22} />}</span>
              <span className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="flex items-center gap-1.5"><span className="text-[14px] font-extrabold leading-tight truncate">{item.title}</span>{!item.isRead && <span className="size-2 rounded-full bg-[#1f7cf0] shrink-0" />}</span>
                <span className="text-[12px] font-medium text-[#3d4a63] leading-snug line-clamp-3 break-words">{item.message}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5b6784] uppercase"><Calendar size={12} />{formatDate(item.createdAt as Date, true)}</span>
              </span>
              <span className="flex flex-col items-end gap-2 shrink-0 self-stretch justify-between">
                <span className={clsx("px-2 h-6 rounded-md text-[10.5px] font-extrabold inline-flex items-center", item.kind === "notice" ? (tag === "Important" ? "bg-[#ffe9ec] text-[#c81f38]" : "bg-[#e8f1ff] text-[#1b6fd6]") : m.tagCls)}>{tag}</span>
                <ChevronRight size={16} className="text-[#9aa4b8]" />
              </span>
            </button>
          );
        })
      )}

      {selected && (
        <Modal isVisible onClose={() => setSelected(null)} title={selected.kind === "notice" ? "Notice Details" : "Notification Details"} width="500">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={clsx("size-11 rounded-md text-white flex items-center justify-center shrink-0", kindMeta[selected.kind].tile)}>{(() => { const I = kindMeta[selected.kind].icon; return <I size={22} />; })()}</span>
              <span className="text-[16px] font-extrabold leading-snug">{selected.title}</span>
            </div>
            <p className="rounded-md bg-[#f5f7fb] border border-[#e6ebf4] p-3 text-[14px] text-[#3d4a63] whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            <span className="text-[11px] font-semibold text-[#5b6784] uppercase">{formatDate(selected.createdAt as Date, true)}</span>
            {selected.link && selected.link !== "#" && (
              <Link href={selected.link} className="h-11 rounded-md bg-[#1f7cf0] text-white font-bold text-sm inline-flex items-center justify-center gap-2"><ExternalLink size={16} />বিস্তারিত দেখুন</Link>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
