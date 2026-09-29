"use client";

import {
  getAllContactMessages,
  replyToCustomerThread,
} from "@/actions/contactActions";
import clsx from "clsx";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type Msg = {
  messageId: string;
  customerId: string;
  subject: string;
  message: string;
  isRead: boolean;
  adminReply: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: { name?: string | null; phone?: string | null } | null;
};

type Thread = {
  customerId: string;
  name: string;
  phone: string;
  messages: Msg[]; // oldest first
  lastAt: number;
  lastPreview: string;
  unread: number;
  pending: boolean;
};

const fmt = (d: string | Date | number) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** One row per customer; opening a row shows all of that customer's messages. */
export default function MessagesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [sendSms, setSendSms] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages(showSpinner = false) {
    if (showSpinner) setLoading(true);
    const res = await getAllContactMessages();
    if (res.success) setMessages((res.data as Msg[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages(true);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadMessages();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, Thread>();
    for (const m of messages) {
      let t = map.get(m.customerId);
      if (!t) {
        t = { customerId: m.customerId, name: m.customer?.name || m.customerId, phone: m.customer?.phone || "", messages: [], lastAt: 0, lastPreview: "", unread: 0, pending: false };
        map.set(m.customerId, t);
      }
      t.messages.push(m);
      if (!m.isRead) t.unread += 1;
    }
    for (const t of map.values()) {
      t.messages.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      const last = t.messages[t.messages.length - 1];
      t.lastAt = Math.max(...t.messages.map((m) => +new Date(m.adminReply ? m.updatedAt : m.createdAt)));
      t.lastPreview = last.adminReply ? `You: ${last.adminReply}` : last.message;
      t.pending = t.unread > 0;
    }
    return [...map.values()].sort((a, b) => b.lastAt - a.lastAt);
  }, [messages]);

  const q = searchQuery.trim().toLowerCase();
  const filtered = threads.filter((t) => {
    const okStatus = filter === "all" || (filter === "pending" ? t.pending : !t.pending);
    const okSearch = !q || t.name.toLowerCase().includes(q) || t.customerId.toLowerCase().includes(q) || t.phone.includes(q);
    return okStatus && okSearch;
  });

  const selected = threads.find((t) => t.customerId === selectedId) || null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [selectedId, selected?.messages.length]);

  async function handleReply() {
    if (!selected || !adminReply.trim()) {
      toast.error("Please provide a reply");
      return;
    }
    setIsReplying(true);
    const res = await replyToCustomerThread(selected.customerId, adminReply, { sendSms });
    if (res.success) {
      toast.success(res.message);
      setAdminReply("");
      await loadMessages();
    } else {
      toast.error(res.message);
    }
    setIsReplying(false);
  }

  const counts = { all: threads.length, pending: threads.filter((t) => t.pending).length, replied: threads.filter((t) => !t.pending).length };

  return (
    <div className="flex flex-col gap-3 p-3 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            Customer Messages
          </h1>
          <p className="text-gray-500 text-sm">Respond to customer inquiries and feedback — one conversation per customer</p>
        </div>
        <div className="flex bg-white p-1 rounded-md border border-gray-100 shadow-sm">
          {([
            ["all", "All", "bg-black"],
            ["pending", "Unread", "bg-blue-500"],
            ["replied", "Replied", "bg-green-500"],
          ] as const).map(([key, label, active]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx("px-3 py-1.5 rounded-md text-sm font-bold transition-all", filter === key ? `${active} text-white` : "text-gray-500 hover:bg-gray-50")}
            >
              {label} <span className="opacity-70">({counts[key]})</span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3 min-h-[70vh]">
        {/* Customer list */}
        <section className={clsx("flex flex-col gap-2", selected && "hidden lg:flex")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, ID or phone..."
              className="w-full h-10 pl-10 pr-3 bg-white rounded-md border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-md p-10 text-center border border-dashed border-gray-200">
              <Mail className="mx-auto text-gray-200 mb-3" size={48} />
              <p className="text-gray-500 font-bold text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((t) => (
                <button
                  key={t.customerId}
                  onClick={() => setSelectedId(t.customerId)}
                  className={clsx(
                    "text-left rounded-md border p-2.5 flex items-start gap-2.5 transition-colors",
                    selectedId === t.customerId ? "bg-blue-50 border-blue-300" : "bg-white border-gray-100 hover:bg-gray-50",
                  )}
                >
                  <span className="size-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0">{t.name.charAt(0).toUpperCase()}</span>
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 truncate text-sm">{t.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{fmt(t.lastAt)}</span>
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono truncate">{t.customerId}{t.phone ? ` · ${t.phone}` : ""}</span>
                    <span className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={clsx("text-xs truncate", t.pending ? "text-gray-900 font-semibold" : "text-gray-500")}>{t.lastPreview}</span>
                      {t.unread > 0 ? (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">{t.unread}</span>
                      ) : (
                        <CheckCircle size={14} className="shrink-0 text-green-500" />
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Thread */}
        <section className={clsx("rounded-md border border-gray-100 bg-white flex flex-col min-h-[60vh]", !selected && "hidden lg:flex")}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 p-10">
              <MessageSquare size={48} className="text-gray-200" />
              <p className="font-bold text-sm">Select a customer to see the conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 p-2.5 border-b border-gray-100">
                <button onClick={() => setSelectedId(null)} className="lg:hidden size-9 rounded-md bg-gray-100 flex items-center justify-center" aria-label="Back"><ArrowLeft size={18} /></button>
                <span className="size-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center shrink-0">{selected.name.charAt(0).toUpperCase()}</span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-gray-900 truncate">{selected.name}</span>
                  <span className="text-xs text-gray-500 font-mono truncate">{selected.customerId}</span>
                </span>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-gray-200 text-sm font-bold text-blue-600"><Phone size={15} />{selected.phone}</a>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50 max-h-[60vh]">
                {selected.messages.map((m) => (
                  <div key={m.messageId} className="flex flex-col gap-1.5">
                    {/* Admin-initiated rows have no customer text: show only the SE Support bubble */}
                    {m.message && (
                      <div className="self-start max-w-[85%] rounded-md rounded-tl-none bg-white border border-gray-200 px-3 py-2 shadow-sm">
                        {m.subject && m.subject !== "Chat Support" && <p className="text-[11px] font-bold text-gray-500 mb-0.5">{m.subject}</p>}
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.message}</p>
                        <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1">{fmt(m.createdAt)}{!m.isRead && <span className="text-blue-600 font-bold">· new</span>}</p>
                      </div>
                    )}
                    {m.adminReply && (
                      <div className="self-end max-w-[85%] rounded-md rounded-tr-none bg-blue-600 text-white px-3 py-2 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-100 mb-0.5">SE Support</p>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.adminReply}</p>
                        <p className="mt-1 text-[10px] text-blue-100">{fmt(m.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="border-t border-gray-100 p-2.5 flex flex-col gap-2">
                {!selected.pending && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock size={13} />All messages are answered. You can still send a new message to this customer.</p>
                )}
                    <div className="flex items-end gap-2">
                      <textarea
                        rows={2}
                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        placeholder={selected.pending ? "Type your reply..." : "Write a message to this customer..."}
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                      />
                      <button
                        onClick={handleReply}
                        disabled={isReplying || !adminReply.trim()}
                        className="h-11 px-4 bg-blue-600 text-white rounded-md text-sm font-bold inline-flex items-center gap-1.5 disabled:bg-gray-300"
                      >
                        <Send size={16} />{isReplying ? "Sending..." : "Send"}
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} className="size-4 accent-blue-600" />
                      Also send as SMS to customer
                      <span className="text-xs font-medium text-gray-400">({selected.phone || "customer phone"})</span>
                    </label>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
