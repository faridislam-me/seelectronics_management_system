"use client";

import {
  ArrowLeft,
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Compass,
  Settings,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  MapPin,
  CalendarDays,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getSavedPrayerLocation } from "@/utils/prayerLocation";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type Slot = PrayerName | "Sunrise";
type Timings = Record<Slot, string>;

const SLOTS: Slot[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYERS: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const BN: Record<Slot, string> = { Fajr: "ফজর", Sunrise: "সূর্যোদয়", Dhuhr: "জোহর", Asr: "আসর", Maghrib: "মাগরিব", Isha: "এশা" };
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bn = (v: string | number) => String(v).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// Soft colour per slot (tile background, icon colour)
const TONE: Record<Slot, { bg: string; fg: string; ring: string }> = {
  Fajr: { bg: "#e6f0ff", fg: "#2563eb", ring: "#bcd4fb" },
  Sunrise: { bg: "#fff1e0", fg: "#ea580c", ring: "#fbd9b5" },
  Dhuhr: { bg: "#e3f6ec", fg: "#16a34a", ring: "#b6e3c8" },
  Asr: { bg: "#e4f2ff", fg: "#0284c7", ring: "#bde0f7" },
  Maghrib: { bg: "#efe9ff", fg: "#7c3aed", ring: "#d3c6f7" },
  Isha: { bg: "#e9edff", fg: "#4338ca", ring: "#c7cef7" },
};

const SlotIcon = ({ slot, size = 22 }: { slot: Slot; size?: number }) => {
  const c = TONE[slot].fg;
  switch (slot) {
    case "Fajr":
      return <Sunrise size={size} color={c} />;
    case "Sunrise":
      return <Sun size={size} color={c} />;
    case "Dhuhr":
      return <Sun size={size} color={c} fill={c} fillOpacity={0.15} />;
    case "Asr":
      return <Sunset size={size} color={c} />;
    case "Maghrib":
      return <Sunset size={size} color={c} fill={c} fillOpacity={0.2} />;
    default:
      return <Moon size={size} color={c} fill={c} fillOpacity={0.2} />;
  }
};

const fmt = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  let hour = Number(h);
  const pm = hour >= 12;
  hour = hour % 12 || 12;
  return `${bn(hour)}:${bn(m)} ${pm ? "PM" : "AM"}`;
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const left = (ms: number) => {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${bn(m)} মিনিট`;
  return m === 0 ? `${bn(h)} ঘণ্টা` : `${bn(h)} ঘণ্টা ${bn(m)} মিনিট`;
};

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const REMINDER_KEY = "se-prayer-reminders-v1";

async function fetchTimings(d: Date, lat: number, lng: number): Promise<Timings | null> {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const res = await fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=1&timezonestring=Asia/Dhaka`);
  const json = await res.json();
  if (json.code !== 200) return null;
  const t = json.data.timings;
  const clean = (s: string) => String(s).slice(0, 5);
  return { Fajr: clean(t.Fajr), Sunrise: clean(t.Sunrise), Dhuhr: clean(t.Dhuhr), Asr: clean(t.Asr), Maghrib: clean(t.Maghrib), Isha: clean(t.Isha) };
}

async function fetchHijri(d: Date): Promise<string> {
  try {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const json = await (await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${d.getFullYear()}`)).json();
    if (json.code === 200) {
      const h = json.data.hijri;
      return `${bn(h.day)} ${h.month.ar}, ${bn(h.year)} হিজরি`;
    }
  } catch {}
  return "";
}

export default function PrayerTimePage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date());
  const [timings, setTimings] = useState<Timings | null>(null);
  const [location, setLocation] = useState("লোড হচ্ছে...");
  const [coords, setCoords] = useState({ lat: 24.8949, lng: 91.8687 });
  const [hijri, setHijri] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = getSavedPrayerLocation();
    setCoords({ lat: saved.lat, lng: saved.lng });
    setLocation(saved.locationName);
    try {
      setReminders(JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}"));
    } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let off = false;
    fetchTimings(date, coords.lat, coords.lng).then((t) => !off && t && setTimings(t));
    fetchHijri(date).then((h) => !off && setHijri(h));
    return () => {
      off = true;
    };
  }, [date, coords]);

  // Reminders: the app schedules real phone notifications from these times (SEApp channel). In a plain browser they are only saved.
  const syncToApp = useCallback(
    async (next: Record<string, boolean>) => {
      try {
        localStorage.setItem(REMINDER_KEY, JSON.stringify(next));
      } catch {}
      const bridge = (window as unknown as { SEApp?: { postMessage: (m: string) => void } }).SEApp;
      if (!bridge) return;
      try {
        const days: { date: string; times: Timings }[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const t = await fetchTimings(d, coords.lat, coords.lng);
          if (t) days.push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, times: t });
        }
        bridge.postMessage(JSON.stringify({ type: "prayerReminders", enabled: next, days }));
      } catch {}
    },
    [coords],
  );

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const toggle = (p: PrayerName) => {
    const next = { ...reminders, [p]: !reminders[p] };
    setReminders(next);
    syncToApp(next);
    flash(next[p] ? `${BN[p]}-এর রিমাইন্ডার চালু হয়েছে` : `${BN[p]}-এর রিমাইন্ডার বন্ধ হয়েছে`);
  };
  const allOn = PRAYERS.every((p) => reminders[p]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    PRAYERS.forEach((p) => (next[p] = !allOn));
    setReminders(next);
    syncToApp(next);
    flash(!allOn ? "সব নামাজের রিমাইন্ডার চালু হয়েছে" : "সব রিমাইন্ডার বন্ধ হয়েছে");
  };

  const isToday = date.toDateString() === now.toDateString();

  // Status of every slot for today
  const model = useMemo(() => {
    if (!timings) return null;
    const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const at = (slot: Slot) => new Date(base.getTime() + toMin(timings[slot]) * 60000);
    const endOf = (slot: Slot): Date => {
      const order: Slot[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const i = order.indexOf(slot);
      if (slot === "Isha") return new Date(at("Fajr").getTime() + 86400000);
      return at(order[i + 1]);
    };
    const t = now.getTime();
    let currentSlot: Slot | null = null;
    for (const s of SLOTS) if (isToday && t >= at(s).getTime() && t < endOf(s).getTime()) currentSlot = s;
    if (isToday && !currentSlot && t < at("Fajr").getTime()) currentSlot = "Isha"; // after midnight, still last night's Isha
    let nextSlot: Slot = "Fajr";
    let nextAt = new Date(at("Fajr").getTime() + 86400000);
    for (const s of SLOTS) {
      if (at(s).getTime() > t) {
        nextSlot = s;
        nextAt = at(s);
        break;
      }
    }
    return { at, endOf, currentSlot, nextSlot, nextAt };
  }, [timings, date, now, isToday]);

  const status = (slot: Slot) => {
    if (!model || !isToday) return { text: "", kind: "" };
    if (model.currentSlot === slot) return { text: slot === "Sunrise" ? "সূর্যোদয় হয়েছে" : "সময় চলছে", kind: "now" };
    const diff = model.at(slot).getTime() - now.getTime();
    if (diff > 0) return { text: diff < 3600000 * 2 ? `বাকি ${left(diff)}` : `বাকি ${bn(Math.floor(diff / 3600000))} ঘণ্টা`, kind: "soon" };
    return { text: "শেষ", kind: "done" };
  };

  const heroDate = `${bn(date.getDate())} ${MONTHS[date.getMonth()]} ${bn(date.getFullYear())}`;
  const clock = now.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true });

  if (!timings || !model) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#eef3fb]">
        <p className="text-slate-500 font-semibold">লোড হচ্ছে...</p>
      </div>
    );
  }

  const nextIsPrayer = model.nextSlot;

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-2 h-14 flex items-center gap-2">
        <button onClick={() => router.back()} aria-label="Back" className="size-10 rounded-md bg-white/15 border border-white/20 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[17px] font-bold">নামাযের সময়সূচি</h1>
        <Link href="/prayer-time/settings" aria-label="সেটিংস" className="ml-auto size-10 rounded-md bg-white/15 border border-white/20 flex items-center justify-center">
          <Settings size={19} />
        </Link>
      </div>

      <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-xl mx-auto">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-md text-white bg-[linear-gradient(160deg,#0b2a66_0%,#16348f_55%,#3b2a8f_100%)] p-3.5 pb-4">
          <svg viewBox="0 0 400 140" className="absolute right-0 bottom-0 w-[78%] h-auto opacity-90" aria-hidden="true">
            <circle cx="320" cy="26" r="13" fill="#f5e7a8" />
            <circle cx="326" cy="22" r="12" fill="#16348f" />
            {[[210, 14], [260, 40], [360, 70], [150, 30], [300, 6]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.8" />
            ))}
            <g fill="#0a1d4d">
              <rect x="150" y="70" width="12" height="70" />
              <polygon points="150,70 156,52 162,70" />
              <rect x="338" y="62" width="12" height="78" />
              <polygon points="338,62 344,42 350,62" />
              <rect x="196" y="92" width="120" height="48" />
              <path d="M206 92 Q256 30 306 92 Z" />
              <rect x="252" y="40" width="8" height="12" />
              <path d="M256 40 Q262 34 256 28 Q250 34 256 40" />
            </g>
            <rect x="0" y="136" width="400" height="4" fill="#0a1d4d" />
          </svg>
          <p className="relative text-[11px] font-bold tracking-wide text-[#f5e7a8]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <h2 className="relative mt-1 text-[22px] font-extrabold leading-tight">নামাযের সময়সূচি</h2>
          <p className="relative mt-0.5 text-[12.5px] font-semibold text-white/85">আল্লাহর স্মরণে জীবন হোক শান্তিময়</p>
          <div className="relative mt-3 flex flex-col gap-2 max-w-[62%]">
            <Link href="/prayer-time/settings" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white/15 border border-white/25 text-[13px] font-bold w-fit">
              <MapPin size={15} className="text-[#f5c542]" />
              <span className="truncate max-w-[140px]">{location}</span>
            </Link>
            <div className="rounded-md bg-white/12 border border-white/20 px-2.5 py-1.5 text-[12px] font-semibold leading-snug w-fit">
              <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-[#f5c542]" />{isToday ? "আজ, " : ""}{heroDate}</div>
              <div className="text-white/80 pl-5">{DAYS[date.getDay()]}{hijri ? ` · ${hijri}` : ""}</div>
            </div>
          </div>
        </section>

        {/* Date navigator */}
        <div className="flex items-center justify-between rounded-md bg-white border border-[#cfe3fb] px-2 h-11">
          <button onClick={() => setDate(new Date(date.getTime() - 86400000))} aria-label="আগের দিন" className="size-8 rounded-md bg-[#e4f2ff] text-[#1f7cf0] flex items-center justify-center"><ChevronLeft size={18} /></button>
          <button onClick={() => setDate(new Date())} className="text-[13.5px] font-extrabold">{isToday ? "আজ" : `${heroDate}`} <span className="text-slate-400 font-semibold">{!isToday && "(আজকে ফিরুন)"}</span></button>
          <button onClick={() => setDate(new Date(date.getTime() + 86400000))} aria-label="পরের দিন" className="size-8 rounded-md bg-[#e4f2ff] text-[#1f7cf0] flex items-center justify-center"><ChevronRight size={18} /></button>
        </div>

        {/* Now / next */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white border border-[#cfe3fb] p-2.5 flex items-center gap-2.5">
            <span className="size-11 rounded-md bg-[#e4f2ff] flex items-center justify-center shrink-0"><Clock3 size={22} color="#1f7cf0" /></span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-bold text-slate-500">বর্তমান সময়</span>
              <span className="block text-[18px] font-extrabold leading-tight text-[#0b3d91]">{clock}</span>
              <span className="block text-[10px] font-semibold text-slate-400">বাংলাদেশ স্ট্যান্ডার্ড টাইম</span>
            </span>
          </div>
          <div className="rounded-md bg-white border border-[#b6e3c8] p-2.5 flex items-center gap-2.5">
            <span className="size-11 rounded-md flex items-center justify-center shrink-0" style={{ background: TONE[nextIsPrayer].bg }}><SlotIcon slot={nextIsPrayer} /></span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-bold text-slate-500">পরবর্তী: {BN[nextIsPrayer]}</span>
              <span className="block text-[18px] font-extrabold leading-tight" style={{ color: TONE[nextIsPrayer].fg }}>{fmt(timings[nextIsPrayer])}</span>
              <span className="block text-[10.5px] font-bold text-emerald-700">বাকি: {left(model.nextAt.getTime() - now.getTime())}</span>
            </span>
          </div>
        </div>

        {/* Six tiles */}
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map((s) => {
            const st = status(s);
            const active = st.kind === "now";
            return (
              <div key={s} className="rounded-md bg-white p-2 flex flex-col items-center text-center border" style={{ borderColor: active ? TONE[s].fg : TONE[s].ring, background: active ? TONE[s].bg : "#fff" }}>
                <span className="size-10 rounded-md flex items-center justify-center" style={{ background: TONE[s].bg }}><SlotIcon slot={s} size={21} /></span>
                <span className="mt-1 text-[13px] font-extrabold">{BN[s]}</span>
                <span className="text-[13px] font-extrabold" style={{ color: TONE[s].fg }}>{fmt(timings[s])}</span>
                {st.text && (
                  <span className="mt-1 px-1.5 h-5 rounded-md text-[10.5px] font-bold inline-flex items-center whitespace-nowrap" style={{ background: active ? TONE[s].fg : TONE[s].bg, color: active ? "#fff" : TONE[s].fg }}>{st.text}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail list with reminders */}
        <section className="rounded-md bg-white border border-[#cfe3fb] p-2.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-[15px] font-extrabold"><span className="size-8 rounded-md bg-[#e4f2ff] flex items-center justify-center"><Clock3 size={17} color="#1f7cf0" /></span>নামাযের বিস্তারিত সময়সূচি</h3>
          </div>

          <div className="flex items-center justify-between rounded-md bg-[#f4f8ff] border border-[#e1ecfb] px-3 h-11 mb-1.5">
            <span className="text-[13.5px] font-bold text-slate-700">সকল নামাজের রিমাইন্ডার</span>
            <button onClick={toggleAll} aria-label="সব রিমাইন্ডার" className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${allOn ? "bg-[#1f7cf0]" : "bg-slate-300"}`}>
              <span className={`size-4 bg-white rounded-full shadow transition-transform ${allOn ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {SLOTS.map((s) => {
            const st = status(s);
            const isPrayer = s !== "Sunrise";
            const on = !!reminders[s];
            return (
              <div key={s} className="flex items-center gap-2.5 py-2 border-b border-[#eef3fb] last:border-b-0">
                <span className="size-10 rounded-md flex items-center justify-center shrink-0" style={{ background: TONE[s].bg }}><SlotIcon slot={s} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14.5px] font-extrabold">{BN[s]}</span>
                  <span className="block text-[12px] font-semibold text-slate-500">{fmt(timings[s])} - {fmt(timings[model.endOf(s).getTime() === model.at("Fajr").getTime() + 86400000 ? "Fajr" : (SLOTS[SLOTS.indexOf(s) + 1] as Slot)])}</span>
                </span>
                {st.text && <span className="px-2 h-6 rounded-md text-[11px] font-bold inline-flex items-center whitespace-nowrap" style={{ background: st.kind === "now" ? TONE[s].fg : TONE[s].bg, color: st.kind === "now" ? "#fff" : TONE[s].fg }}>{st.text}</span>}
                {isPrayer ? (
                  <button onClick={() => toggle(s as PrayerName)} aria-label={`${BN[s]} রিমাইন্ডার`} className={`size-9 rounded-md border flex items-center justify-center transition-colors ${on ? "bg-[#1f7cf0] border-[#1f7cf0] text-white" : "bg-white border-[#cfe3fb] text-slate-400"}`}>
                    {on ? <BellRing size={17} /> : <Bell size={17} />}
                  </button>
                ) : (
                  <span className="size-9" />
                )}
              </div>
            );
          })}
          <p className="mt-2 text-[11px] font-semibold text-slate-400 leading-snug">রিমাইন্ডার চালু থাকলে SE অ্যাপ নামাজের ওয়াক্ত শুরুর সময় মোবাইলে নোটিফিকেশন দেবে।</p>
        </section>

        {/* Dua */}
        <section className="rounded-md bg-[linear-gradient(105deg,#e4f2ff,#eef3fb)] border border-[#cfe3fb] py-3 px-3 text-center">
          <p className="text-[20px] font-bold text-[#0b3d91]" dir="rtl">اللَّهُمَّ تَقَبَّلْ مِنَّا</p>
          <p className="text-[12.5px] font-semibold text-slate-600 mt-0.5">“হে আল্লাহ! আমাদের নেক আমল কবুল করুন”</p>
        </section>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          <a href="https://qiblafinder.withgoogle.com/" target="_blank" rel="noreferrer" className="h-12 rounded-md bg-white border border-[#cfe3fb] flex items-center justify-center gap-2 text-[14px] font-extrabold text-[#0b3d91]"><Compass size={20} color="#1f7cf0" />কিবলামুখ</a>
          <Link href="/prayer-time/settings" className="h-12 rounded-md bg-white border border-[#cfe3fb] flex items-center justify-center gap-2 text-[14px] font-extrabold text-[#0b3d91]"><Settings size={20} color="#1f7cf0" />সেটিংস</Link>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-md bg-[#0b3d91] text-white text-[13px] font-bold shadow-lg">{toast}</div>
      )}
    </div>
  );
}
