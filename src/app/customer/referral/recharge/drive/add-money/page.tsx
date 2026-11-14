"use client";

import { getMyAddMoneyRequests, getMyDriveInfo, submitAddMoneyRequest } from "@/actions/driveBalanceActions";
import { paymentDetails } from "@/constants";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, Copy, Loader2, ShieldCheck, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type MethodKey = "bkash" | "nagad" | "rocket";

const METHODS: { key: MethodKey; label: string; color: string; logo: string; number: string }[] = [
  { key: "bkash", label: "bKash", color: "#d1137b", logo: "/payment-methods/bkash.jpg", number: paymentDetails.bkash.number },
  { key: "nagad", label: "Nagad", color: "#ec1c24", logo: "/payment-methods/nagad.jpg", number: paymentDetails.nagad.number },
  { key: "rocket", label: "Rocket", color: "#8a2be2", logo: "/payment-methods/rocket.jpg", number: paymentDetails.rocket.number },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "যাচাই চলছে", cls: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]" },
  approved: { label: "অনুমোদিত", cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]" },
};

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function AddMoneyPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [drive, setDrive] = useState<{ driveBalance: number; kycStatus: string } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const [method, setMethod] = useState<MethodKey>("bkash");
  const [amount, setAmount] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [txId, setTxId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState("");

  const selected = METHODS.find((m) => m.key === method)!;

  const load = async () => {
    const [d, r] = await Promise.all([getMyDriveInfo(), getMyAddMoneyRequests()]);
    if (d.success && "data" in d && d.data) setDrive(d.data as any);
    if (r.success && "data" in r && r.data) setRequests(r.data as any[]);
    setChecking(false);
  };

  useEffect(() => {
    load();
  }, []);

  const copyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(num);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 10) return toast.error("সঠিক পরিমাণ দিন (ন্যূনতম ৳১০)");
    if (!senderNumber.trim()) return toast.error("যে নম্বর থেকে পাঠিয়েছেন দিন");
    if (!txId.trim()) return toast.error("ট্রানজেকশন আইডি দিন");

    setLoading(true);
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("method", method);
    fd.set("senderNumber", senderNumber.trim());
    fd.set("transactionId", txId.trim());
    if (note.trim()) fd.set("note", note.trim());

    const res = await submitAddMoneyRequest(fd);
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
      setAmount("");
      setSenderNumber("");
      setTxId("");
      setNote("");
      load();
    } else {
      toast.error(res.message || "জমা দেওয়া যায়নি");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[#0b3d91]" />
      </div>
    );
  }

  // Add money is for the KYC-approved drive wallet.
  if (drive && drive.kycStatus !== "approved") {
    return (
      <>
        <Header />
        <div className="rounded-md bg-white border border-[#dfe6f2] p-5 flex flex-col items-center text-center gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="size-12 rounded-full bg-[#e8f1ff] border border-[#0b3d91]/15 flex items-center justify-center"><ShieldCheck size={24} className="text-[#0b3d91]" /></span>
          <p className="text-[14px] font-extrabold text-[#0f1729]">আগে ড্রাইভ KYC করুন</p>
          <p className="text-[11.5px] font-semibold text-[#5b6784]">অ্যাড মানি করতে আপনার ড্রাইভ KYC অনুমোদিত হতে হবে।</p>
          <Link href="/customer/referral/recharge/drive/kyc" className="mt-1 h-10 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2">
            <ShieldCheck size={16} /> ড্রাইভ KYC করুন
          </Link>
        </div>
      </>
    );
  }

  const pending = requests.find((r) => r.status === "pending");

  return (
    <>
      <Header />

      {/* Drive balance */}
      <div className="rounded-xl bg-[linear-gradient(105deg,#00695c,#00b894)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(0,105,92,0.25)]">
        <span className="size-11 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wallet size={22} /></span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/85">ড্রাইভ ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">{bdt(Number(drive?.driveBalance ?? 0))}</span>
        </span>
      </div>

      {/* How-to */}
      <div className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-3 text-[12px] text-[#8a5a12] font-semibold leading-snug">
        নিচের যেকোনো একটি নম্বরে <b>Send Money</b> করুন, তারপর ফর্মটি পূরণ করে জমা দিন। অ্যাডমিন পেমেন্ট যাচাই করে আপনার ড্রাইভ ব্যালেন্সে টাকা যোগ করে দেবেন।
      </div>

      {/* Pending notice */}
      {pending && (
        <div className="rounded-md bg-white border border-[#f5dfa0] p-3 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <Clock size={18} className="text-[#b8620b] shrink-0" />
          <span className="text-[12px] font-semibold text-[#8a5a12] flex-1">
            আপনার <b>{bdt(Number(pending.amount))}</b> অ্যাড মানি অনুরোধ যাচাই এর অপেক্ষায় আছে।
          </span>
        </div>
      )}

      {/* Method picker */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="text-[11px] font-bold text-[#5b6784] mb-2">পেমেন্ট মাধ্যম *</p>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const active = m.key === method;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={clsx("flex flex-col items-center gap-1 py-2 rounded-md border transition-all", active ? "border-transparent" : "border-[#dfe6f2] bg-white")}
                style={active ? { backgroundColor: `${m.color}12`, borderColor: m.color } : undefined}
              >
                <span className="size-9 rounded-md bg-white border border-[#dfe6f2] overflow-hidden flex items-center justify-center p-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.logo} alt={m.label} className="w-full h-full object-contain" />
                </span>
                <span className="text-[11px] font-extrabold" style={{ color: active ? m.color : "#5b6784" }}>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected method number (send money here) */}
        <div className="mt-2.5 rounded-md border border-dashed border-[#c3d0e8] bg-[#f6f9ff] p-2.5 flex items-center justify-between">
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold text-[#5b6784]">{selected.label} — Send Money নম্বর</span>
            <span className="text-[15px] font-extrabold font-mono text-[#16213a]">{selected.number}</span>
          </span>
          <button type="button" onClick={() => copyNumber(selected.number)} className="shrink-0 h-8 px-2.5 rounded-md bg-white border border-[#dfe6f2] text-[11px] font-extrabold text-[#0b3d91] inline-flex items-center gap-1">
            <Copy size={13} className={copied === selected.number ? "text-[#178a42]" : ""} />
            {copied === selected.number ? "কপি হয়েছে" : "কপি"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">পরিমাণ (৳) *</label>
          <input
            type="number"
            min="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="যত টাকা পাঠিয়েছেন"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">যে নম্বর থেকে পাঠিয়েছেন *</label>
          <input
            type="tel"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">ট্রানজেকশন আইডি (TrxID) *</label>
          <input
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="যেমন: 9F3K7ABCD2"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">নোট (ঐচ্ছিক)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="অতিরিক্ত তথ্য থাকলে লিখুন"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !!pending}
          className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
          {loading ? "জমা হচ্ছে..." : pending ? "একটি অনুরোধ অপেক্ষমাণ" : "অ্যাড মানি অনুরোধ জমা দিন"}
        </button>
      </div>

      {/* History */}
      {requests.length > 0 && (
        <div className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <p className="px-3 py-2.5 text-[13px] font-extrabold border-b border-[#eef1f6]">অ্যাড মানি অনুরোধ</p>
          <div className="divide-y divide-[#eef1f6]">
            {requests.map((r) => {
              const st = STATUS_META[r.status] || STATUS_META.pending;
              return (
                <div key={r.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className="size-8 rounded-full bg-[#f5f7fb] flex items-center justify-center shrink-0 text-[#0b3d91]">
                    {r.status === "approved" ? <CheckCircle2 size={16} className="text-[#178a42]" /> : r.status === "rejected" ? <XCircle size={16} className="text-[#c81f38]" /> : <Clock size={16} className="text-[#b8620b]" />}
                  </span>
                  <span className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-[13px] font-extrabold">{bdt(Number(r.amount))} <span className="text-[11px] font-bold text-[#5b6784] uppercase">· {r.method}</span></span>
                    <span className="text-[10.5px] font-semibold text-[#5b6784]">
                      {new Date(r.createdAt).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}
                      {r.status === "rejected" && r.rejectReason ? ` · ${r.rejectReason}` : ""}
                    </span>
                  </span>
                  <span className={clsx("shrink-0 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border", st.cls)}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submission notice popup */}
      {submitted && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5" onClick={() => setSubmitted(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="size-16 rounded-full bg-[#e9f9ef] flex items-center justify-center">
              <CheckCircle2 size={36} className="text-[#178a42]" />
            </span>
            <p className="text-[17px] font-extrabold text-[#0f1729]">অনুরোধ জমা হয়েছে</p>
            <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">
              অ্যাডমিন আপনার পেমেন্ট যাচাই করে ড্রাইভ ব্যালেন্সে টাকা যোগ করে দেবেন। যাচাই সম্পন্ন হলে আপনি জানতে পারবেন।
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center mt-1"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2.5">
      <Link href="/customer/referral/recharge/drive" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
        <ArrowLeft size={18} />
      </Link>
      <span className="flex flex-col leading-tight flex-1">
        <span className="text-[16px] font-extrabold">অ্যাড মানি</span>
        <span className="text-[11px] font-semibold text-[#5b6784]">ড্রাইভ ব্যালেন্সে টাকা যোগ করুন</span>
      </span>
    </div>
  );
}
