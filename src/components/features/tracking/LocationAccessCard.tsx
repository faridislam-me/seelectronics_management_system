"use client";

import { saveCustomerLocation } from "@/actions/trackingActions";
import clsx from "clsx";
import { CheckCircle2, MapPin, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  role: "customer" | "staff";
  /** customer only: the service to attach the location to */
  serviceId?: string;
  /** dark = tracking page (navy), otherwise light card */
  dark?: boolean;
  /** called after the location was given / saved */
  onDone?: () => void;
};

/** The Flutter apps expose this channel so a button can jump straight to the phone's app settings. */
export function openAppSettings(): boolean {
  const ch = (window as unknown as { SEApp?: { postMessage: (m: string) => void } }).SEApp;
  if (!ch) return false;
  ch.postMessage("openSettings");
  return true;
}

const COPY = {
  customer: {
    title: "টেকনিশিয়ান কোথায় আছে দেখতে চান?",
    body: "আপনার ঠিকানা ম্যাপে বসাতে এবং টেকনিশিয়ান কতক্ষণে পৌঁছাবেন তা হিসাব করতে আপনার লোকেশন দরকার। নিচের বাটনে চাপ দিয়ে ফোন যা জিজ্ঞেস করবে তাতে \"Allow\" দিন। আপনার লোকেশন শুধু এই সার্ভিসের জন্য ব্যবহার হবে, অন্য কোথাও দেখানো হবে না।",
    button: "লোকেশন দিন",
    done: "আপনার লোকেশন নেওয়া হয়েছে। টেকনিশিয়ান রওনা দিলে এখানে ম্যাপ দেখতে পাবেন।",
  },
  staff: {
    title: "গ্রাহককে আপনার লোকেশন দেখাতে লোকেশন চালু করুন",
    body: "রওনা দেওয়ার আগে নিচের বাটনে চাপ দিন এবং Allow দিন। না দিলে গ্রাহক আপনাকে ম্যাপে দেখতে পাবে না।",
    button: "লোকেশন চালু করুন",
    done: "লোকেশন চালু আছে। এখন \"আমি রওনা দিয়েছি\" চাপতে পারেন।",
  },
} as const;

/** One big, plain-language "give location access" box (customer tracking page and technician report page). */
export default function LocationAccessCard({ role, serviceId, dark = false, onDone }: Props) {
  const router = useRouter();
  const t = COPY[role];
  const [state, setState] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const [error, setError] = useState("");

  // If the permission is already granted, show the green state straight away.
  useEffect(() => {
    let cancelled = false;
    try {
      navigator.permissions?.query({ name: "geolocation" as PermissionName }).then((r) => {
        if (cancelled) return;
        if (r.state === "granted") setState("granted");
        else if (r.state === "denied") setState("denied");
      });
    } catch {
      /* permissions API not available: stay idle */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const ask = () => {
    if (!("geolocation" in navigator)) {
      setState("denied");
      setError("এই ফোনে লোকেশন সাপোর্ট নেই।");
      return;
    }
    setState("asking");
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (role === "customer" && serviceId) {
          const res = await saveCustomerLocation(serviceId, pos.coords.latitude, pos.coords.longitude);
          if (!res.success) {
            setError(res.message || "লোকেশন সেভ করা যায়নি");
            setState("idle");
            return;
          }
          setState("granted");
          router.refresh();
          onDone?.();
        } else {
          setState("granted");
          onDone?.();
        }
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? "denied" : "idle");
        if (err.code !== err.PERMISSION_DENIED) setError("লোকেশন পাওয়া যায়নি। GPS চালু আছে কিনা দেখে আবার চাপুন।");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const granted = state === "granted";
  const denied = state === "denied";

  const box = dark
    ? granted
      ? "border-[#1d5a3a] bg-[#0f2f22] text-white"
      : denied
        ? "border-[#7a2a36] bg-[#2a1118] text-white"
        : "border-[#1d3d7a] bg-[linear-gradient(135deg,#0c2254_0%,#0a1a40_100%)] text-white"
    : granted
      ? "border-[#bfe8cd] bg-[#e9f9ef] text-[#16213a]"
      : denied
        ? "border-[#f7c3ca] bg-[#fff4f5] text-[#16213a]"
        : "border-[#cfe0fb] bg-[#eef4fd] text-[#16213a]";
  const sub = dark ? "text-white/75" : "text-[#3d4a63]";

  return (
    <section className={clsx("rounded-md border p-3 flex flex-col gap-2.5", box)}>
      <div className="flex items-start gap-2.5">
        <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 text-white", granted ? "bg-[#16a34a]" : denied ? "bg-[#e0243f]" : "bg-[#1f7cf0]")}>
          {granted ? <CheckCircle2 size={22} /> : denied ? <TriangleAlert size={20} /> : <MapPin size={22} />}
        </span>
        <span className="flex flex-col gap-1 leading-snug">
          <span className="text-[15px] font-extrabold">{granted ? "লোকেশন চালু আছে ✓" : t.title}</span>
          <span className={clsx("text-[12.5px] font-medium", sub)}>{granted ? t.done : t.body}</span>
        </span>
      </div>

      {denied && (
        <div className={clsx("rounded-md px-2.5 py-2 text-[12px] leading-relaxed font-semibold flex flex-col gap-2", dark ? "bg-white/10 text-white/90" : "bg-white text-[#c81f38] border border-[#f7c3ca]")}>
          <span>লোকেশন বন্ধ করা আছে। ফোনের সেটিংসে গিয়ে <b>Permissions → Location → Allow</b> করুন, তারপর ফিরে এসে নিচের বাটনে আবার চাপ দিন।</span>
          <button type="button" onClick={() => { if (!openAppSettings()) setError("Chrome এ: ঠিকানার পাশের তালা (🔒) আইকনে চাপ দিয়ে Permissions → Location → Allow করুন।"); }} className="h-10 rounded-md bg-[#e0243f] text-white text-[13px] font-extrabold">ফোনের সেটিংস খুলুন</button>
        </div>
      )}
      {error && <span className="text-[12px] font-semibold text-[#e0243f]">{error}</span>}

      {!granted && (
        <button type="button" onClick={ask} disabled={state === "asking"} className="h-12 rounded-md bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform">
          <MapPin size={18} />
          {state === "asking" ? "অপেক্ষা করুন..." : denied ? "আবার চেষ্টা করুন" : t.button}
        </button>
      )}
    </section>
  );
}
