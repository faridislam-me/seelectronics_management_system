"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Moon, MoonStar, Sun, Sunset, Sunrise, CloudSun, ChevronDown, UtensilsCrossed, LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  bdLocations,
  getSavedPrayerLocation,
  savePrayerLocation,
  SavedPrayerLocation,
} from "@/utils/prayerLocation";

interface PrayerTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
}

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

const prayerBangla: Record<PrayerName, string> = {
  Fajr: "ফজর",
  Dhuhr: "যোহর",
  Asr: "আসর",
  Maghrib: "মাগরিব",
  Isha: "এশা",
};

const prayerIcon: Record<PrayerName, LucideIcon> = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: MoonStar,
};

/** Sehri line icon: glass, rice bowl and crescent (matches lucide stroke style). */
function SehriIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9h5l-.8 11H3.8z" />
      <path d="M3.4 13h4.2" />
      <path d="M10 15h11a5.5 4 0 0 1-11 0z" />
      <path d="M12 15c0-1.4 1-2.2 2-1.8.5-1.1 2.1-1.1 2.6 0 1-.4 2 .4 2 1.8" />
      <path d="M13.5 20h4" />
      <path d="M19.5 3.2a2.6 2.6 0 1 0 1.8 4.4 2.1 2.1 0 1 1-1.8-4.4z" />
    </svg>
  );
}

/** Tinted chip + gradient badge colours per prayer. */
const prayerTone: Record<PrayerName, { chip: string; badge: string }> = {
  Fajr: { chip: "bg-[#fff1e0] text-[#e0801b]", badge: "bg-[linear-gradient(135deg,#ffb35c,#e0701b)]" },
  Dhuhr: { chip: "bg-[#fff8db] text-[#d9a100]", badge: "bg-[linear-gradient(135deg,#ffd84d,#f0a500)]" },
  Asr: { chip: "bg-[#e8f1ff] text-[#1f7cf0]", badge: "bg-[linear-gradient(135deg,#6fb1ff,#1f7cf0)]" },
  Maghrib: { chip: "bg-[#ffe9e4] text-[#e0522b]", badge: "bg-[linear-gradient(135deg,#ff9a6b,#d9441f)]" },
  Isha: { chip: "bg-[#ece8ff] text-[#5a3fd1]", badge: "bg-[linear-gradient(135deg,#7f6bff,#2c1a8e)]" },
};

const bnDigits = (v: string | number) => String(v).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const hijriMonthsBn = ["মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];
const formatHijriBn = (day: number, month: number, year: number) =>
  `${bnDigits(day)} ${hijriMonthsBn[month - 1] ?? ""} ${bnDigits(year)} হিজরি`;

// ─── Bangla (Bengali) Calendar ────────────────────────────────────────────────
function getBanglaDate(): string {
  const bnMonths = [
    "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
    "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র",
  ];

  const d = new Date();
  const gDay = d.getDate();
  const gMonth = d.getMonth() + 1; // 1-based
  const gYear = d.getFullYear();

  // Each Bangla month starts on these Gregorian day-of-month (approx)
  // [Gregorian month, start day of Bangla month]
  const monthMap: [number, number, number][] = [
    // [gregMonth, gregStartDay, bnMonthIndex]
    [4, 14, 0],  // বৈশাখ starts ~Apr 14
    [5, 15, 1],  // জ্যৈষ্ঠ
    [6, 15, 2],  // আষাঢ়
    [7, 16, 3],  // শ্রাবণ
    [8, 17, 4],  // ভাদ্র
    [9, 16, 5],  // আশ্বিন
    [10, 16, 6], // কার্তিক
    [11, 15, 7], // অগ্রহায়ণ
    [12, 15, 8], // পৌষ
    [1, 14, 9],  // মাঘ
    [2, 14, 10], // ফাল্গুন
    [3, 14, 11], // চৈত্র
  ];

  let bnMonthIdx = -1;
  let bnDay = 0;
  let bnYear = 0;

  for (let i = 0; i < monthMap.length; i++) {
    const [gm, gsd, bmi] = monthMap[i];
    const nextI = (i + 1) % monthMap.length;
    const [ngm, ngsd] = monthMap[nextI];

    const matchThisMonth = (gMonth === gm && gDay >= gsd);
    const matchNextMonth = (gMonth === ngm && gDay < ngsd);

    if (matchThisMonth || matchNextMonth) {
      bnMonthIdx = bmi;
      // Calculate day: if matchNextMonth, we need to know the days in gm
      if (matchThisMonth) {
        bnDay = gDay - gsd + 1;
      } else {
        // Approximate last month's length as 30 or 31
        // (Simplified for this component, better to use 30/31 check)
        const daysInLastMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gm];
        bnDay = (daysInLastMonth - gsd + 1) + gDay;
      }
      bnYear = gYear - (gMonth < 4 || (gMonth === 4 && gDay < 14) ? 594 : 593);
      break;
    }
  }

  // fallback: if no match found, approximate
  if (bnMonthIdx === -1) {
    bnMonthIdx = 0;
    bnDay = 1;
    bnYear = gYear - 594;
  }

  return `${bnDay} ${bnMonths[bnMonthIdx]}, ${bnYear} বঙ্গাব্দ`;
}

// ─── English Date ─────────────────────────────────────────────────────────────
function getEnglishDate(): string {
  const d = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

// ─── Hijri Date via API ───────────────────────────────────────────────────────
async function fetchHijriDate(): Promise<string> {
  const d = new Date();
  try {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
    const data = await res.json();
    if (data.code === 200) {
      const h = data.data.hijri;
      return formatHijriBn(Number(h.day), Number(h.month.number), Number(h.year));
    }
  } catch (_) {}
  // Fallback: compute locally (Umm al-Qura)
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value?.replace(/\D/g, "") || 0);
    return formatHijriBn(get("day"), get("month"), get("year"));
  } catch (_) {}
  return "";
}

// ─── Main Component ───────────────────────────────────────────────────────────
const PrayerTimes = () => {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [location, setLocation] = useState("লোড হচ্ছে...");
  const [currentPrayer, setCurrentPrayer] = useState<string>("Fajr");
  const [timeLeft, setTimeLeft] = useState("");
  const [coords, setCoords] = useState({ lat: 23.8103, lng: 90.4125 });
  const [division, setDivision] = useState("ঢাকা");
  const [district, setDistrict] = useState("ঢাকা");

  // Date states
  const [englishDate, setEnglishDate] = useState("");
  const [banglaDate, setBanglaDate] = useState("");
  const [hijriDate, setHijriDate] = useState("");

  // Init dates & client-side stored location
  useEffect(() => {
    setEnglishDate(getEnglishDate());
    setBanglaDate(getBanglaDate());
    fetchHijriDate().then((h) => setHijriDate(h));

    const saved = getSavedPrayerLocation();
    setDivision(saved.division);
    setDistrict(saved.district);
    setCoords({ lat: saved.lat, lng: saved.lng });
    setLocation(saved.locationName);
  }, []);

  // Fetch prayer timings
  const fetchData = async (lat: number, lng: number) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=1&timezonestring=Asia/Dhaka`
    );
    const data = await res.json();
    if (data.code === 200) setTimings(data.data.timings);
  };

  useEffect(() => {
    fetchData(coords.lat, coords.lng);
  }, [coords]);

  // Handle location changes & persist to localStorage
  const handleLocationChange = (newDivision: string, newDistrict: string) => {
    const updated = savePrayerLocation(newDivision, newDistrict);
    setDivision(updated.division);
    setDistrict(updated.district);
    setCoords({ lat: updated.lat, lng: updated.lng });
    setLocation(updated.locationName);
  };

  // Countdown & current prayer
  useEffect(() => {
    if (!timings) return;
    const interval = setInterval(() => {
      const now = new Date();
      const order: (PrayerName | "Sunrise")[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const prayerTimes = order.map((name) => {
        const [h, m] = timings[name].split(":");
        const d = new Date();
        d.setHours(Number(h), Number(m), 0);
        return { name, time: d };
      });

      let current: string = "Isha";
      let next: { name: string; time: Date } | null = null;

      for (let i = 0; i < prayerTimes.length; i++) {
        if (now < prayerTimes[i].time) {
          current = i === 0 ? "Isha" : prayerTimes[i - 1].name;
          next = prayerTimes[i];
          break;
        }
      }

      if (!next) {
        current = "Isha";
        next = { ...prayerTimes[0], time: new Date(prayerTimes[0].time.getTime() + 86400000) };
      }

      setCurrentPrayer(current);

      const diff = next.time.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timings]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    let hour = Number(h);
    const isPM = hour >= 12;
    hour = hour % 12 || 12;
    return `${hour}:${m} ${isPM ? "PM" : "AM"}`;
  };

  const prayers: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  const getEndTime = (prayer: PrayerName) => {
    if (!timings) return "";
    switch (prayer) {
      case "Fajr": return formatTime(timings.Sunrise);
      case "Dhuhr": return formatTime(timings.Asr);
      case "Asr": return formatTime(timings.Maghrib);
      case "Maghrib": return formatTime(timings.Isha);
      case "Isha": return formatTime(timings.Fajr);
    }
  };

  const [showLocationSelect, setShowLocationSelect] = useState(false);

  if (!timings) {
    return (
      <div className="max-w-sm mx-auto rounded-xl border overflow-hidden bg-white">
        <div className="p-4 text-gray-500 text-sm text-center">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* ── Header ── */}
      <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-gray-800 text-[15px] font-medium">নামাজ ও রোজা</p>
        <Link href="/prayer-time" className="text-brand text-[14px] font-medium hover:underline">
          বিস্তারিত
        </Link>
      </div>

      <div className="p-4">
        {/* ── Location & Date ── */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-1 text-brand font-medium text-[16px] cursor-pointer mb-1 w-max"
            onClick={() => setShowLocationSelect(!showLocationSelect)}
          >
            <MapPin size={18} />
            <span>{location}</span>
            <ChevronDown size={18} />
          </div>
          <div className="text-[13px] text-gray-600 leading-snug flex flex-wrap gap-x-1.5">
            <span className="whitespace-nowrap">{banglaDate}</span>
            {hijriDate && <><span aria-hidden>•</span><span className="whitespace-nowrap">{hijriDate}</span></>}
          </div>
        </div>

        {/* ── Division / District selects (Toggleable) ── */}
        {showLocationSelect && (
          <div className="flex gap-2 mb-4">
            <select
              value={division}
              onChange={(e) => {
                const newDiv = e.target.value;
                const newDist = bdLocations[newDiv]?.[0]?.name || "";
                handleLocationChange(newDiv, newDist);
              }}
              className="flex-1 text-xs border rounded-lg px-2 py-[6px] bg-white text-gray-800 outline-none"
            >
              {Object.keys(bdLocations).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={district}
              onChange={(e) => handleLocationChange(division, e.target.value)}
              className="flex-1 text-xs border rounded-lg px-2 py-[6px] bg-white text-gray-800 outline-none"
            >
              {bdLocations[division]?.map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── Suhoor / Iftar Info ── */}
        <div className="grid grid-cols-2 gap-2 mb-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-8 rounded-full bg-[#ece8ff] text-[#5a3fd1] flex items-center justify-center shrink-0"><MoonStar size={16} /></span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-gray-500 text-[12px]">পরবর্তী সাহরি</span>
              <span className="text-gray-800 font-semibold text-[14px]">{formatTime(timings.Fajr)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <span className="size-8 rounded-full bg-[#ffe9e4] text-[#d9441f] flex items-center justify-center shrink-0"><UtensilsCrossed size={15} /></span>
            <span className="flex flex-col leading-tight min-w-0">
              <span className="text-gray-500 text-[12px]">আজকের ইফতার</span>
              <span className="text-gray-800 font-semibold text-[14px]">{formatTime(timings.Maghrib)}</span>
            </span>
          </div>
        </div>

        {/* ── 2 Column Layout ── */}
        <div className="flex gap-2">
          {/* Left Column (Countdown) */}
          <div className="w-[36%] min-w-0 bg-[#eaf2ff] border border-[#d6e4fa] rounded-md p-2 flex flex-col items-center justify-center text-center">
            {(() => {
              // Blue line icon by time of day: sun (morning/day), sunset (evening), moon (night), sehri (1 AM until Fajr).
              const h = new Date().getHours();
              const cp = currentPrayer as string;
              const art =
                cp === "Isha" ? (h >= 1 && h < 12 ? "sehri" : "night")
                : cp === "Maghrib" ? "evening"
                : cp === "Fajr" || cp === "Dhuhr" || cp === "Asr" ? "day"
                : h >= 1 && h < 5 ? "sehri" : h < 17 ? "day" : h < 19 ? "evening" : "night";
              return (
                <span className="mb-2 size-16 rounded-full bg-[#dbeafe] ring-4 ring-white text-[#1f5fc9] flex items-center justify-center">
                  {art === "sehri" ? <SehriIcon /> : art === "night" ? <Moon size={32} strokeWidth={1.8} /> : art === "evening" ? <Sunset size={32} strokeWidth={1.8} /> : <Sun size={32} strokeWidth={1.8} />}
                </span>
              );
            })()}
            <p className="text-gray-800 text-[16px] font-medium mb-1">এখন : {prayerBangla[currentPrayer as PrayerName]}</p>
            <p className="text-gray-600 text-[13px] mb-2 font-medium">ওয়াক্ত বাকি</p>
            <div className="bg-white text-brand px-1.5 py-[6px] rounded-full text-[clamp(11px,3.4vw,14px)] font-semibold w-full whitespace-nowrap border border-gray-100">
              {timeLeft} মিনিট
            </div>
          </div>

          {/* Right Column (Prayers) */}
          <div className="w-[64%] min-w-0 flex flex-col gap-[6px]">
            {prayers.map((p) => {
              const isActive = currentPrayer === p;
              return (
                <div key={p} className={`flex flex-wrap justify-between items-center gap-x-1 rounded-md px-1.5 py-[5px] ${isActive ? "border border-brand bg-brand-50" : "border border-gray-100"}`}>
                  <span className="flex items-center gap-1.5 min-w-0">
                    {(() => { const Icon = prayerIcon[p]; return <span className={`size-6 rounded-full flex items-center justify-center shrink-0 ${prayerTone[p].chip}`}><Icon size={13} /></span>; })()}
                    <span className={`text-[clamp(12px,3.6vw,14px)] font-medium whitespace-nowrap ${isActive ? "text-brand" : "text-gray-800"}`}>{prayerBangla[p]}</span>
                  </span>
                  <span className={`text-[clamp(9.5px,2.9vw,11.5px)] whitespace-nowrap ml-auto ${isActive ? "text-brand font-medium" : "text-gray-600"}`}>{formatTime(timings[p])} - {getEndTime(p)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer: Sunrise / Sunset ── */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[13px] text-gray-700 font-medium">
            <span className="size-7 rounded-full bg-[#fff8db] text-[#d9a100] flex items-center justify-center"><Sunrise size={15} /></span>
            <span>সূর্যোদয় {formatTime(timings.Sunrise)}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-700 font-medium">
            <span className="size-7 rounded-full bg-[#ffe9e4] text-[#d9441f] flex items-center justify-center"><Sunset size={15} /></span>
            <span>সূর্যাস্ত {formatTime(timings.Maghrib)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimes;