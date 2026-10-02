"use client";

import { getMyContactMessages, sendMyChatMessage } from "@/actions/contactActions";
import { contactDetails } from "@/constants";
import clsx from "clsx";
import { Headset, Loader2, MessageSquare, Phone, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Msg = { messageId: string; message: string; adminReply: string | null; createdAt: Date | string; updatedAt: Date | string };

const time = (d: Date | string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

export default function ChatSupportClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef(-1);

  const load = useCallback(async () => {
    const res = await getMyContactMessages();
    if (res.success) setMessages((res.data || []) as Msg[]);
    setLoading(false);
  }, []);

  // Initial load + poll every 15s while the tab is visible.
  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  // Scroll to the newest bubble whenever the thread grows.
  useEffect(() => {
    const n = messages.reduce((a, m) => a + 1 + (m.adminReply ? 1 : 0), 0);
    if (n !== countRef.current) {
      countRef.current = n;
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await sendMyChatMessage(body);
    setSending(false);
    if (!res.success) return toast.error(res.message);
    setText("");
    load();
  };

  return (
    <div className="flex flex-col gap-2 px-2 pt-2 pb-0 min-h-[calc(100dvh-190px)] text-[#16213a]">
      {/* Header card */}
      <section className="rounded-md bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_100%)] text-white p-2.5 flex items-center gap-2.5">
        <span className="size-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><MessageSquare size={22} /></span>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[17px] font-extrabold">Chat Support</span>
          <span className="text-[12px] font-semibold text-white/85">সাপোর্ট টিমের সাথে সরাসরি কথা বলুন</span>
        </span>
        <a href={`tel:${contactDetails.customerCare}`} className="shrink-0 inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md bg-white text-[#0b3d91] text-[12px] font-extrabold"><Phone size={14} />কল</a>
      </section>

      {/* Thread */}
      <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2 flex-1 min-h-[30vh]">
        {/* Greeting */}
        <Bubble side="left" label="SE Support">
          আসসালামু আলাইকুম! SE Electronics সাপোর্টে আপনাকে স্বাগতম। আপনার প্রশ্ন বা সমস্যা লিখুন, আমাদের টিম দ্রুত উত্তর দেবে।
        </Bubble>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[12px] font-semibold text-[#5b6784]"><Loader2 size={16} className="animate-spin" />লোডিং হচ্ছে...</div>
        ) : (
          messages.map((m, i) => (
            <div key={m.messageId} className="flex flex-col gap-2">
              {/* Admin-initiated messages have no customer text */}
              {m.message ? <Bubble side="right" time={time(m.createdAt)}>{m.message}</Bubble> : null}
              {m.adminReply ? (
                <Bubble side="left" label="SE Support" time={time(m.updatedAt)}>{m.adminReply}</Bubble>
              ) : i === messages.length - 1 ? (
                // Admin answers a burst of messages with one reply on the latest one,
                // so only the newest unanswered message shows the waiting hint.
                <span className="self-end text-[10.5px] font-semibold text-[#9aa4b8]">উত্তরের অপেক্ষায়...</span>
              ) : null}
            </div>
          ))
        )}
        <div ref={endRef} />
      </section>

      {/* Composer (sticks above the bottom nav) */}
      <div className="sticky bottom-[64px] z-20 rounded-md bg-white border border-[#cfe0fb] p-1.5 flex items-end gap-1.5 shadow-[0_-4px_16px_rgba(11,61,145,0.10)]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="আপনার বার্তা লিখুন..."
          className="flex-1 min-w-0 max-h-[52px] resize-none rounded-md border border-[#dfe6f2] bg-[#f8fafd] px-2.5 py-2 text-[14px] leading-snug outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]"
        />
        <button type="button" onClick={send} disabled={sending || !text.trim()} aria-label="Send" className="shrink-0 size-10 rounded-md bg-[#1f7cf0] text-white flex items-center justify-center disabled:opacity-50">
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="-mt-0.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5b6784]"><Headset size={13} />জরুরি প্রয়োজনে কল করুন <a href={`tel:${contactDetails.customerCare}`} className="font-bold text-[#1f5fc9]">{contactDetails.customerCare}</a></p>
    </div>
  );
}

function Bubble({ side, label, time, children }: { side: "left" | "right"; label?: string; time?: string; children: React.ReactNode }) {
  const right = side === "right";
  return (
    <div className={clsx("flex flex-col max-w-[82%] gap-0.5", right ? "self-end items-end" : "self-start items-start")}>
      {label && <span className="text-[10.5px] font-extrabold text-[#1f5fc9] px-1">{label}</span>}
      <div className={clsx("rounded-md px-2.5 py-2 text-[13.5px] leading-snug whitespace-pre-wrap break-words", right ? "bg-[#1f7cf0] text-white rounded-br-[2px]" : "bg-[#eef4fd] border border-[#dfe8f7] text-[#16213a] rounded-bl-[2px]")}>
        {children}
      </div>
      {time && <span className="text-[10px] font-semibold text-[#9aa4b8] px-1">{time}</span>}
    </div>
  );
}
