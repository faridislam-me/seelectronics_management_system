"use client";

import clsx from "clsx";
import "leaflet/dist/leaflet.css";
import { Clock, LocateFixed, MapPin, Navigation, Phone, Route } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Pos = { lat: number; lng: number; at?: string | null };
type Data = {
  active: boolean;
  staff: { name: string; phone: string; role?: string | null; photoUrl: string | null } | null;
  staffPos: Pos | null;
  customerPos: { lat: number; lng: number } | null;
};

const POLL_MS = 8000;

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** Live technician position on an OpenStreetMap map with route + ETA (OSRM). */
export default function LiveTrackingMap({ serviceId, dark = false }: { serviceId: string; dark?: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [eta, setEta] = useState<{ minutes: number; km: number } | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layers = useRef<{ staff?: any; dest?: any; origin?: any; route?: any; fitted?: boolean }>({});
  const originPos = useRef<{ lat: number; lng: number } | null>(null);
  const lastRouteKey = useRef("");

  // Poll the public tracking endpoint.
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/tracking/${serviceId}`, { cache: "no-store" });
        const json = await res.json();
        if (!stop && json.success) setData(json.data);
      } catch {
        /* keep last known position */
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [serviceId]);

  // Draw / update the map.
  useEffect(() => {
    if (!data?.active || !mapEl.current) return;
    const start = data.staffPos;
    const dest = data.customerPos;
    if (!start && !dest) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      if (!mapRef.current) {
        const c = start ?? dest!;
        mapRef.current = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([c.lat, c.lng], 15);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapRef.current);
        L.control.zoom({ position: "topright" }).addTo(mapRef.current);
      }
      const map = mapRef.current;

      const GREEN = "#16a34a";
      const pinSvg = (fill: string) => `<svg width="34" height="42" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))"><path d="M12 0C5.9 0 1 4.9 1 11c0 8.2 11 19 11 19s11-10.8 11-19C23 4.9 18.1 0 12 0z" fill="${fill}" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="11" r="4.2" fill="#fff"/></svg>`;
      const staffIcon = L.divIcon({
        className: "",
        html: `<div style="width:46px;height:46px;border-radius:9999px;background:#fff;border:3px solid ${GREEN};box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${GREEN}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-3l-3 6 3 3h5"/><circle cx="15" cy="5" r="1"/></svg></div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      const destIcon = L.divIcon({ className: "", html: pinSvg("#e0243f"), iconSize: [34, 42], iconAnchor: [17, 41] });
      const originIcon = L.divIcon({ className: "", html: pinSvg(GREEN), iconSize: [34, 42], iconAnchor: [17, 41] });

      if (start) {
        if (layers.current.staff) layers.current.staff.setLatLng([start.lat, start.lng]);
        else layers.current.staff = L.marker([start.lat, start.lng], { icon: staffIcon }).addTo(map);
      }
      if (dest && !layers.current.dest) layers.current.dest = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);
      if (start && !originPos.current) originPos.current = { lat: start.lat, lng: start.lng };
      if (originPos.current && !layers.current.origin) layers.current.origin = L.marker([originPos.current.lat, originPos.current.lng], { icon: originIcon }).addTo(map);

      if (start && dest) {
        // Re-route only when the technician moved ~50m or more.
        const key = `${start.lat.toFixed(3)},${start.lng.toFixed(3)}`;
        if (key !== lastRouteKey.current) {
          lastRouteKey.current = key;
          const straightKm = haversineKm(start, dest);
          try {
            const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
            const j = await r.json();
            const route = j?.routes?.[0];
            if (!route) throw new Error("no route");
            if (cancelled) return;
            const coords = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
            if (layers.current.route) layers.current.route.setLatLngs(coords);
            else layers.current.route = L.polyline(coords, { color: "#16a34a", weight: 6, opacity: 0.95 }).addTo(map);
            setEta({ minutes: Math.max(1, Math.round(route.duration / 60)), km: route.distance / 1000 });
          } catch {
            setEta({ minutes: Math.max(1, Math.round((straightKm / 20) * 60)), km: straightKm });
          }
        }
        if (!layers.current.fitted && layers.current.staff && layers.current.dest) {
          map.fitBounds(L.latLngBounds([start.lat, start.lng], [dest.lat, dest.lng]), { padding: [40, 40] });
          layers.current.fitted = true;
        }
      } else if (start) {
        map.setView([start.lat, start.lng], map.getZoom());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  const recenter = async () => {
    const map = mapRef.current;
    if (!map || !data) return;
    const L = (await import("leaflet")).default;
    const pts = [data.staffPos, data.customerPos].filter(Boolean) as { lat: number; lng: number }[];
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40] });
    else if (pts.length === 1) map.setView([pts[0].lat, pts[0].lng], 16);
  };

  // Tear the map down when the component unmounts.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layers.current = {};
    };
  }, []);

  if (!data?.active) return null;

  const base = dark ? "border-[#1d3d7a] bg-[linear-gradient(135deg,#0c2254_0%,#0a1a40_100%)] text-white" : "border-[#dfe6f2] bg-white text-[#16213a]";
  const sub = dark ? "text-white/70" : "text-[#5b6784]";
  const updatedAgo = data.staffPos?.at ? Math.max(0, Math.round((Date.now() - new Date(data.staffPos.at).getTime()) / 60000)) : null;

  return (
    <section className={clsx("rounded-md border overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.2)]", base)}>
      <div className="flex items-center gap-2.5 p-2.5">
        <span className="size-10 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0"><Navigation size={20} /></span>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[15px] font-bold">লাইভ ট্র্যাকিং</span>
          <span className={clsx("text-[12px]", sub)}>{data.staff?.role === "electrician" ? "ইলেকট্রিশিয়ান" : "টেকনিশিয়ান"} আপনার ঠিকানার দিকে আসছেন</span>
        </span>
        <span className={clsx("shrink-0 rounded-md px-2.5 py-1 text-center leading-tight", dark ? "bg-white/10 border border-white/15" : "bg-[#e8f1ff]")}>
          <span className={clsx("block text-[10px] font-semibold", sub)}>আনুমানিক সময়</span>
          <span className="block text-[15px] font-extrabold text-[#16a34a]">{eta ? `${bn(eta.minutes)} মিনিট` : "—"}</span>
        </span>
      </div>

      {data.staffPos || data.customerPos ? (
        <div className="relative">
          <div ref={mapEl} className="h-[280px] w-full bg-[#dbe6f5] z-0" />
          {eta && (
            <span className="absolute left-2.5 bottom-6 z-[1000] rounded-md bg-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] px-2.5 py-1.5 flex items-center gap-2 text-[#16213a] pointer-events-none">
              <MapPin size={16} className="text-[#16a34a]" />
              <span className="flex flex-col leading-tight"><span className="text-[10.5px] font-semibold text-[#5b6784]">আনুমানিক পৌঁছাবেন</span><span className="text-[14px] font-extrabold">{bn(eta.minutes)} মিনিট</span></span>
            </span>
          )}
          <button type="button" onClick={recenter} aria-label="মাঝখানে আনুন" className="absolute right-2.5 bottom-6 z-[1000] size-10 rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] flex items-center justify-center text-[#16213a]"><LocateFixed size={20} /></button>
        </div>
      ) : (
        <div className={clsx("h-[120px] flex flex-col items-center justify-center gap-1 text-[13px]", sub)}>
          <LocateFixed size={22} />
          টেকনিশিয়ানের লোকেশন এখনো পাওয়া যায়নি
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2.5 py-2 text-[12px]">
        {eta && <span className={clsx("inline-flex items-center gap-1", sub)}><Route size={13} />প্রায় {bn(eta.km.toFixed(1))} কিমি দূরে</span>}
        {updatedAgo != null && <span className={clsx("inline-flex items-center gap-1", sub)}><Clock size={13} />{updatedAgo === 0 ? "এইমাত্র আপডেট" : `${bn(updatedAgo)} মিনিট আগে আপডেট`}</span>}
        {!data.customerPos && <span className={clsx("inline-flex items-center gap-1", sub)}><MapPin size={13} />আপনার লোকেশন পিন দেওয়া নেই, তাই সময় দেখানো যাচ্ছে না</span>}
      </div>

      {data.staff && (
        <div className={clsx("flex items-center gap-2.5 border-t p-2.5", dark ? "border-white/10" : "border-[#eef1f6]")}>
          {data.staff.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.staff.photoUrl} alt="" className="size-11 rounded-full object-cover object-top border-2 border-[#1f7cf0]" />
          ) : (
            <span className="size-11 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center font-extrabold">{data.staff.name.slice(0, 1)}</span>
          )}
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[14px] font-bold truncate">{data.staff.name}</span>
            <span className={clsx("text-[12px]", sub)}>{data.staff.phone}</span>
          </span>
          <a href={`tel:${data.staff.phone}`} className="h-9 px-3 rounded-md bg-[#16a34a] text-white text-[13px] font-bold inline-flex items-center gap-1.5"><Phone size={14} />কল</a>
        </div>
      )}
    </section>
  );
}
