"use client";

import { sendGuarantorNotice } from "@/actions/guarantorNoticeActions";
import { Modal } from "@/components/ui";
import {
  GUARANTOR_NOTICE_LEVELS,
  GUARANTOR_NOTICE_LEVEL_META,
  GuarantorNoticeLevel,
  bnMoney,
  buildGuarantorNoticeBody,
  computeGuarantorDues,
  guarantorNoticePath,
  isGuarantorNoticeLevel,
} from "@/lib/guarantorNotice";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Copy, Download, ExternalLink, Loader2, RotateCcw, Scale, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type Notice = {
  id: string;
  token: string;
  noticeNo: string;
  level: string;
  dueAmount: number;
  dueCount: number;
  smsSent: boolean;
  smsError: string | null;
  guarantorCustomerId: string | null;
  guarantorPhone: string;
  createdAt: string | Date;
};

type ScheduleRow = { dueDate: string | Date; amount: number; status: string };

/** The stage the admin would normally send next, given what was already sent. */
const nextLevel = (notices: Notice[]): GuarantorNoticeLevel => {
  const sent = new Set(notices.map((n) => n.level));
  if (sent.has("legal") || sent.has("final")) return "final";
  if (sent.has("reminder")) return "legal";
  return "reminder";
};

/**
 * Admin block on the installment plan screen: send a notice to the plan's
 * guarantor (reminder → legal → final) and see the history of notices sent.
 */
export default function GuarantorNoticePanel({
  plan,
  schedule,
  notices,
}: {
  plan: any;
  schedule: ScheduleRow[];
  notices: Notice[];
}) {
  const router = useRouter();
  const dues = useMemo(() => computeGuarantorDues(schedule), [schedule]);
  const hasPhone = !!(plan.guarantorPhone || "").trim();

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<GuarantorNoticeLevel>("reminder");
  const [days, setDays] = useState("7");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const defaultBody = (lv: GuarantorNoticeLevel, d: string) =>
    buildGuarantorNoticeBody(lv, {
      customerName: plan.customerName,
      customerPhone: plan.customerPhone,
      productModel: plan.productModel,
      planCode: plan.planCode,
      dueCount: dues.dueCount,
      dueAmount: dues.dueAmount,
      remainingAmount: dues.remainingAmount,
      oldestDueDate: dues.oldestDueDate,
      deadlineDays: Math.max(0, Math.min(90, Number(d) || 0)),
    });

  const openModal = () => {
    const lv = nextLevel(notices);
    const d = String(GUARANTOR_NOTICE_LEVEL_META[lv].defaultDays);
    setLevel(lv);
    setDays(d);
    setBody(defaultBody(lv, d));
    setOpen(true);
  };

  // Changing the level or the deadline regenerates the default text; the admin
  // edits the text after choosing those two.
  const pickLevel = (lv: GuarantorNoticeLevel) => {
    const d = String(GUARANTOR_NOTICE_LEVEL_META[lv].defaultDays);
    setLevel(lv);
    setDays(d);
    setBody(defaultBody(lv, d));
  };
  const changeDays = (d: string) => {
    setDays(d);
    setBody(defaultBody(level, d));
  };

  const send = async () => {
    if (body.trim().length < 20) {
      toast.error("নোটিশের লেখা খুব ছোট");
      return;
    }
    if (dues.dueCount === 0 && !window.confirm("এই প্ল্যানে এখন কোনো খেলাপি (বকেয়া) কিস্তি নেই। তবুও জামিনদারকে নোটিশ পাঠাবেন?")) return;
    if (level !== "reminder" && !window.confirm(`জামিনদারকে "${GUARANTOR_NOTICE_LEVEL_META[level].label}" পাঠাবেন? এটি SMS-এ চলে যাবে।`)) return;

    setSending(true);
    const res = await sendGuarantorNotice({
      planCode: plan.planCode,
      level,
      body,
      deadlineDays: Math.max(0, Math.min(90, Number(days) || 0)),
    });
    setSending(false);
    if (res.success) {
      if ("data" in res && res.data && !res.data.smsSent) toast.warn(res.message);
      else toast.success(res.message);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.message || "নোটিশ পাঠানো যায়নি");
    }
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${guarantorNoticePath(token)}`);
      toast.success("লিংক কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  const latest = notices[0];
  const latestMeta = latest && isGuarantorNoticeLevel(latest.level) ? GUARANTOR_NOTICE_LEVEL_META[latest.level] : null;

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white">
            <Scale size={16} className="text-[#0b3d91]" /> জামিনদারকে নোটিশ
            {latestMeta && (
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", latestMeta.cls)}>
                বর্তমান ধাপ: {latestMeta.label}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {dues.dueCount > 0
              ? `খেলাপি কিস্তি ${dues.dueCount}টি · বকেয়া ${bnMoney(dues.dueAmount)}`
              : "এখন কোনো খেলাপি কিস্তি নেই"}
            {" · "}ধাপ: তাগাদা → আইনি নোটিশ → চূড়ান্ত নোটিশ
          </p>
        </div>
        <button
          onClick={openModal}
          disabled={!hasPhone}
          title={hasPhone ? undefined : "জামিনদারের মোবাইল নম্বর নেই"}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-[#0b3d91] text-white text-xs font-bold hover:bg-[#0a2f70] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} /> জামিনদারকে নোটিশ পাঠান
        </button>
      </div>

      {!hasPhone ? (
        <p className="px-4 py-3 text-sm text-gray-400">এই প্ল্যানে জামিনদারের মোবাইল নম্বর যোগ করা হয়নি, তাই নোটিশ পাঠানো যাবে না।</p>
      ) : notices.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400">এখনো জামিনদারকে কোনো নোটিশ পাঠানো হয়নি।</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {notices.map((n) => {
            const meta = isGuarantorNoticeLevel(n.level) ? GUARANTOR_NOTICE_LEVEL_META[n.level] : null;
            return (
              <li key={n.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", meta?.cls || "bg-gray-50 text-gray-600 border-gray-200")}>
                      {meta ? `ধাপ ${meta.step} · ${meta.label}` : n.level}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{n.noticeNo}</span>
                    <span
                      title={n.smsError || undefined}
                      className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded border", n.smsSent ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}
                    >
                      {n.smsSent ? "SMS গেছে" : "SMS যায়নি"}
                    </span>
                    {n.guarantorCustomerId && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">অ্যাকাউন্টে গেছে</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatDate(n.createdAt, true)} · {n.guarantorPhone} · বকেয়া {bnMoney(n.dueAmount)} ({n.dueCount}টি কিস্তি)
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={guarantorNoticePath(n.token)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 h-8 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ExternalLink size={13} /> দেখুন
                  </a>
                  <a
                    href={`/pdf/download?type=guarantor-notice&id=${n.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 h-8 rounded-md border border-[#0b3d91]/25 bg-[#0b3d91]/5 text-xs font-bold text-[#0b3d91] hover:bg-[#0b3d91]/10"
                  >
                    <Download size={13} /> PDF
                  </a>
                  <button
                    onClick={() => copyLink(n.token)}
                    title="লিংক কপি করুন"
                    className="inline-flex items-center justify-center size-8 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <Modal isVisible width="700" title="জামিনদারকে নোটিশ পাঠান" onClose={() => !sending && setOpen(false)}>
          <div className="space-y-3">
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2.5 text-xs text-gray-600 dark:text-gray-300">
              <p><span className="text-gray-400">জামিনদার:</span> <b>{plan.guarantorName || "—"}</b> · {plan.guarantorPhone}</p>
              <p><span className="text-gray-400">গ্রাহক:</span> <b>{plan.customerName}</b> · {plan.productModel} · <span className="font-mono">{plan.planCode}</span></p>
              <p className={dues.dueCount > 0 ? "text-red-600 font-bold" : "text-amber-600 font-bold"}>
                {dues.dueCount > 0
                  ? `খেলাপি কিস্তি ${dues.dueCount}টি · বকেয়া ${bnMoney(dues.dueAmount)} · মোট অপরিশোধিত ${bnMoney(dues.remainingAmount)}`
                  : "সতর্কতা: এখন কোনো খেলাপি কিস্তি নেই"}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">নোটিশের ধাপ</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {GUARANTOR_NOTICE_LEVELS.map((lv) => {
                  const m = GUARANTOR_NOTICE_LEVEL_META[lv];
                  const count = notices.filter((n) => n.level === lv).length;
                  return (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => pickLevel(lv)}
                      className={clsx(
                        "text-left rounded-md border px-3 py-2 text-xs font-bold transition-colors",
                        level === lv
                          ? "border-[#0b3d91] bg-[#0b3d91]/5 text-[#0b3d91] ring-1 ring-[#0b3d91]"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                      )}
                    >
                      <span className="block text-[10px] font-semibold opacity-70">ধাপ {m.step}{count ? ` · ${count} বার পাঠানো হয়েছে` : ""}</span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-[220px]">
              <label className="text-xs font-semibold text-gray-500">পরিশোধের সময়সীমা (দিন)</label>
              <input type="number" min="0" max="90" value={days} onChange={(e) => changeDays(e.target.value)} className="__input" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500">নোটিশের লেখা (প্রয়োজনে সম্পাদনা করুন)</label>
                <button type="button" onClick={() => setBody(defaultBody(level, days))} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b3d91] hover:underline">
                  <RotateCcw size={11} /> ডিফল্ট লেখা
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="__input !h-auto leading-relaxed"
                style={{ fontFamily: "'SolaimanLipi', sans-serif" }}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                সময়সীমা বা ধাপ পরিবর্তন করলে লেখা নতুন করে তৈরি হয়। এই লেখা নোটিশ পত্রে ছাপা হবে; জামিনদারের মোবাইলে একটি ছোট SMS ও নোটিশের লিংক যাবে, আর ঐ নম্বরে গ্রাহক অ্যাকাউন্ট থাকলে অ্যাকাউন্টেও নোটিফিকেশন যাবে।
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button disabled={sending} onClick={() => setOpen(false)} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">বাতিল</button>
              <button disabled={sending} onClick={send} className="__btn flex items-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={15} />}
                {sending ? "পাঠানো হচ্ছে..." : "নোটিশ পাঠান"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
