"use client";

import { getSavedPrayerLocation } from "@/utils/prayerLocation";
import { useEffect } from "react";

// Keep in sync with the prayer-time page.
const REMINDER_KEY = "se-prayer-reminders-v1";
const SYNC_AT_KEY = "se-prayer-sync-at";
const SLOTS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

async function fetchTimings(d: Date, lat: number, lng: number) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=1&madhab=1&timezonestring=Asia/Dhaka`,
  );
  const json = await res.json();
  if (json.code !== 200) return null;
  const t = json.data.timings;
  const clean = (s: string) => String(s).slice(0, 5);
  return {
    Fajr: clean(t.Fajr),
    Dhuhr: clean(t.Dhuhr),
    Asr: clean(t.Asr),
    Maghrib: clean(t.Maghrib),
    Isha: clean(t.Isha),
  };
}

/**
 * Keeps the SE app's prayer notifications alive. The native app only fires
 * notifications for the prayer times the web hands it, and previously the web
 * handed them over only when a reminder toggle was tapped — so the rolling
 * schedule lapsed and reminders stopped. This component re-pushes the enabled
 * reminders (next 7 days) on app open, from any page, throttled to once per 6h,
 * so the schedule stays fresh without the user re-toggling or opening the
 * prayer page. It no-ops outside the app (no SEApp bridge) and when no reminder
 * is enabled.
 */
export default function PrayerReminderSync() {
  useEffect(() => {
    (async () => {
      try {
        const bridge = (window as unknown as { SEApp?: { postMessage: (m: string) => void } }).SEApp;
        if (!bridge?.postMessage) return; // only inside the SE app WebView
        let enabled: Record<string, boolean> = {};
        try {
          enabled = JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}");
        } catch {
          return;
        }
        if (!SLOTS.some((s) => enabled[s])) return; // no reminders enabled

        // Throttle: at most once per 6 hours.
        const last = Number(localStorage.getItem(SYNC_AT_KEY) || 0);
        if (Number.isFinite(last) && Date.now() - last < 6 * 60 * 60 * 1000) return;

        const { lat, lng } = getSavedPrayerLocation();
        const days: { date: string; times: Record<string, string> }[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const t = await fetchTimings(d, lat, lng);
          if (t)
            days.push({
              date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
              times: t,
            });
        }
        if (!days.length) return;
        bridge.postMessage(JSON.stringify({ type: "prayerReminders", enabled, days }));
        try {
          localStorage.setItem(SYNC_AT_KEY, String(Date.now()));
        } catch {}
      } catch {
        // never let a reminder refresh break the app
      }
    })();
  }, []);

  return null;
}
