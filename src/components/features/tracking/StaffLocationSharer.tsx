"use client";

import { updateStaffLocation } from "@/actions/trackingActions";
import clsx from "clsx";
import { openAppSettings } from "./LocationAccessCard";
import { LocateFixed, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SEND_EVERY_MS = 12000;

/**
 * While the technician is "on the way" this keeps posting the phone's GPS
 * position. It works only while this page stays open (a browser limitation).
 */
export default function StaffLocationSharer({ serviceId }: { serviceId: string }) {
  const [state, setState] = useState<"starting" | "sharing" | "denied" | "unsupported" | "stopped">("starting");
  const lastSent = useRef(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState("unsupported");
      return;
    }
    let stopped = false;
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        if (stopped) return;
        const now = Date.now();
        if (now - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = now;
        const res = await updateStaffLocation(serviceId, pos.coords.latitude, pos.coords.longitude);
        if (res.stop) {
          stopped = true;
          navigator.geolocation.clearWatch(id);
          setState("stopped");
        } else if (res.success) setState("sharing");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setState("denied");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(id);
    };
  }, [serviceId, attempt]);

  if (state === "stopped") return null;
  const bad = state === "denied" || state === "unsupported";
  return (
    <div className={clsx("flex items-start gap-2.5 rounded-md border p-2.5 text-[12.5px]", bad ? "bg-[#fff0f0] border-[#f7c3ca] text-[#c81f38]" : "bg-[#e9f9ef] border-[#bfe8cd] text-[#178a42]")}>
      {bad ? <TriangleAlert size={18} className="shrink-0 mt-0.5" /> : <LocateFixed size={18} className={clsx("shrink-0 mt-0.5", state === "sharing" && "animate-pulse")} />}
      <span className="leading-snug font-semibold">
        {state === "denied"
          ? "লোকেশন বন্ধ আছে, তাই গ্রাহক আপনাকে ম্যাপে দেখতে পাবে না। ফোনের Settings → Apps → এই অ্যাপ (বা Chrome) → Permissions → Location → Allow করুন, তারপর নিচের বাটনে চাপ দিন।"
          : state === "unsupported"
            ? "এই ফোনে লোকেশন সাপোর্ট নেই।"
            : state === "starting"
              ? "লোকেশন চালু করা হচ্ছে... (পারমিশন চাইলে Allow দিন)"
              : "লাইভ লোকেশন শেয়ার চলছে। কাস্টমার আপনাকে ম্যাপে দেখছে। এই পেজ খোলা রাখুন।"}
      </span>
      {state === "denied" && (
        <span className="shrink-0 self-center flex flex-col gap-1.5">
          <button type="button" onClick={() => { if (!openAppSettings()) window.alert("Chrome এ: ঠিকানার পাশের তালা আইকনে চাপ দিয়ে Permissions → Location → Allow করুন।"); }} className="h-9 px-3 rounded-md bg-[#c81f38] text-white text-[12px] font-extrabold">সেটিংস খুলুন</button>
          <button type="button" onClick={() => { setState("starting"); setAttempt((n) => n + 1); }} className="h-9 px-3 rounded-md border border-[#c81f38] text-[#c81f38] text-[12px] font-extrabold">আবার চেষ্টা</button>
        </span>
      )}
    </div>
  );
}
