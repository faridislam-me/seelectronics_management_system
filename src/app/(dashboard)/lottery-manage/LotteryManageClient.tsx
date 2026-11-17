"use client";

import {
  drawLotteryWinners,
  generateLotteryCards,
  getCampaignMedia,
  getCampaigns,
  getLotteryCards,
  getLotteryEntries,
  getLotteryWinners,
  removeCampaignBanner,
  startNewCampaign,
  updateCampaignMeta,
  uploadCampaignBanner,
} from "@/actions/lotteryActions";
import {
  CalendarDays,
  Copy,
  Gift,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Printer,
  Save,
  Settings,
  Ticket,
  Trash2,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type Campaign = {
  id: string;
  name: string;
  status: string; // 'active' | 'ended'
  createdAt: string | Date;
  endedAt: string | Date | null;
  entries: number;
  winners: number;
};
type Card = { id: string; code: string; batchLabel: string; used: boolean; createdAt: string | Date };
type Entry = {
  id: string;
  cardCode: string;
  name: string;
  phone: string;
  address: string;
  customerId: string | null;
  photoUrl: string | null;
  rank: number | null;
  drawnAt: string | Date | null;
  createdAt: string | Date;
};
type CampaignMedia = {
  id: string;
  name: string;
  drawDate: string | Date | null;
  shopAddress: string | null;
  shopMobile: string | null;
  prizeFirst: string | null;
  prizeSecond: string | null;
  prizeThird: string | null;
  topBannerUrl: string | null;
  banners: { key: string; url: string | null }[];
};

const fmt = (d: string | Date | null) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function LotteryManageClient({
  initialCampaigns,
  initialCards,
  initialEntries,
  initialWinners,
}: {
  initialCampaigns: Campaign[];
  initialCards: Card[];
  initialEntries: Entry[];
  initialWinners: Entry[];
}) {
  const [tab, setTab] = useState<"cards" | "entries" | "draw" | "media">("cards");
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedId, setSelectedId] = useState<string>(
    () => initialCampaigns.find((c) => c.status === "active")?.id || initialCampaigns[0]?.id || "",
  );
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [winners, setWinners] = useState<Entry[]>(initialWinners);
  const [switching, setSwitching] = useState(false);

  const [count, setCount] = useState("");
  const [batch, setBatch] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [startingNew, setStartingNew] = useState(false);

  const [drawCount, setDrawCount] = useState("");
  const [drawLoading, setDrawLoading] = useState(false);

  const [media, setMedia] = useState<CampaignMedia | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  const loadMedia = async (id: string) => {
    if (!id) return;
    setMediaLoading(true);
    const r = await getCampaignMedia(id);
    setMediaLoading(false);
    if (r.success) setMedia(r.data as CampaignMedia);
    else toast.error(r.message || "লোড করা যায়নি");
  };

  const openMediaTab = () => {
    setTab("media");
    if (!media || media.id !== selectedId) loadMedia(selectedId);
  };

  const usedCount = cards.filter((c) => c.used).length;
  const selected = campaigns.find((c) => c.id === selectedId);
  const isViewingActive = selected?.status === "active";

  const campLabel = (c: Campaign) =>
    `${c.name || "ক্যাম্পেইন"} ${c.status === "active" ? "• চলমান" : "• শেষ"} — এন্ট্রি ${c.entries}, বিজয়ী ${c.winners}`;

  const refreshCards = async () => {
    const r = await getLotteryCards();
    if (r.success) setCards(r.data as Card[]);
  };
  const refreshSelected = async () => {
    const [e, w, c] = await Promise.all([
      getLotteryEntries(selectedId),
      getLotteryWinners(selectedId),
      getCampaigns(),
    ]);
    if (e.success) setEntries(e.data as Entry[]);
    if (w.success) setWinners(w.data as Entry[]);
    if (c.success) setCampaigns(c.data as Campaign[]);
  };

  const switchCampaign = async (id: string) => {
    setSelectedId(id);
    setSwitching(true);
    const [e, w] = await Promise.all([getLotteryEntries(id), getLotteryWinners(id)]);
    setSwitching(false);
    if (e.success) setEntries(e.data as Entry[]);
    if (w.success) setWinners(w.data as Entry[]);
    setMedia(null);
    if (tab === "media") loadMedia(id);
  };

  const doNewCampaign = async () => {
    if (
      !confirm(
        "বর্তমান ক্যাম্পেইনটি শেষ হবে এবং নতুন একটি ক্যাম্পেইন শুরু হবে। অব্যবহৃত কার্ডগুলো (একই QR) নতুন ক্যাম্পেইনে ব্যবহার করা যাবে এবং এটি আলাদাভাবে ড্র হবে। নিশ্চিত?",
      )
    )
      return;
    setStartingNew(true);
    const res = await startNewCampaign(newName);
    setStartingNew(false);
    if (!res.success) return toast.error(res.message || "শুরু করা যায়নি");
    setNewName("");
    toast.success("নতুন ক্যাম্পেইন শুরু হয়েছে");
    const c = await getCampaigns();
    if (c.success) setCampaigns(c.data as Campaign[]);
    await switchCampaign(res.campaign.id);
  };

  const doGenerate = async () => {
    const n = Math.floor(Number(count) || 0);
    if (n < 1) return toast.error("কতটি কার্ড তৈরি করবেন লিখুন");
    if (n > 5000) return toast.error("একবারে সর্বোচ্চ ৫০০০টি");
    setGenLoading(true);
    const res = await generateLotteryCards(n, batch);
    setGenLoading(false);
    if (res.success) {
      setGenerated(res.codes);
      setCount("");
      toast.success(`${res.count}টি কার্ড তৈরি হয়েছে`);
      refreshCards();
    } else toast.error(res.message || "তৈরি করা যায়নি");
  };

  const doDraw = async () => {
    const n = Math.floor(Number(drawCount) || 0);
    if (n < 1) return toast.error("কতজন বিজয়ী করবেন লিখুন");
    if (!confirm(`${n} জন বিজয়ী এলোমেলোভাবে নির্বাচন করা হবে এবং তাদের SMS পাঠানো হবে। নিশ্চিত?`)) return;
    setDrawLoading(true);
    const res = await drawLotteryWinners(n, selectedId);
    setDrawLoading(false);
    if (res.success) {
      setDrawCount("");
      toast.success(res.message);
      refreshSelected();
    } else toast.error(res.message || "ড্র করা যায়নি");
  };

  const copyCodes = (codes: string[]) => {
    navigator.clipboard?.writeText(codes.join("\n")).then(
      () => toast.success("কোড কপি হয়েছে"),
      () => toast.error("কপি করা যায়নি"),
    );
  };

  const printCodes = (codes: string[]) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>Lottery Cards</title><style>body{font-family:sans-serif;padding:16px}.g{display:flex;flex-wrap:wrap;gap:8px}.c{border:1px dashed #0b3d91;border-radius:8px;padding:10px 14px;font-weight:800;font-size:16px;letter-spacing:2px}</style></head><body><h3>SE Electronics — Lottery Cards (${codes.length})</h3><div class="g">${codes
        .map((c) => `<div class="c">${c}</div>`)
        .join("")}</div></body></html>`,
    );
    w.document.close();
    w.print();
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <h2 className="text-xl font-bold inline-flex items-center gap-2">
          <Gift size={22} className="text-[#0b3d91]" /> লটারি ম্যানেজমেন্ট
        </h2>
        <div className="flex gap-3 text-sm">
          <Stat icon={Ticket} label="মোট কার্ড" value={cards.length} />
          <Stat icon={Users} label="এন্ট্রি" value={entries.length} />
          <Stat icon={Trophy} label="বিজয়ী" value={winners.length} />
        </div>
      </div>

      {/* Campaign bar */}
      <div className="bg-[#eef3fb] border border-[#dfe6f2] rounded-lg p-3 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-[#3d4f72] whitespace-nowrap">ক্যাম্পেইন:</span>
          <select
            value={selectedId}
            onChange={(e) => switchCampaign(e.target.value)}
            disabled={switching}
            className="flex-1 min-w-0 h-10 rounded-md border border-[#cdd8ec] bg-white px-2 text-sm font-semibold text-[#16213a] focus:border-[#0b3d91] focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {campLabel(c)}
              </option>
            ))}
          </select>
          {switching && <Loader2 className="size-4 animate-spin text-[#0b3d91]" />}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="নতুন ক্যাম্পেইনের নাম (ঐচ্ছিক)"
            className="h-10 rounded-md border border-[#cdd8ec] bg-white px-3 text-sm font-semibold focus:border-[#0b3d91] focus:outline-none"
          />
          <button
            type="button"
            onClick={doNewCampaign}
            disabled={startingNew}
            className="h-10 px-4 rounded-md bg-emerald-600 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60"
          >
            {startingNew ? <Loader2 className="size-4 animate-spin" /> : <Plus size={16} />} নতুন ক্যাম্পেইন
          </button>
        </div>
      </div>

      {!isViewingActive && selected && (
        <div className="-mt-2 text-[12.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ⚠️ আপনি একটি <b>শেষ হওয়া</b> ক্যাম্পেইন দেখছেন (শুধু পড়ার জন্য)। নতুন এন্ট্রি ও ড্র চলমান ক্যাম্পেইনে হবে।
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          ["cards", "কার্ড তৈরি"],
          ["entries", `এন্ট্রি (${entries.length})`],
          ["draw", "ড্র ও বিজয়ী"],
          ["media", "ক্যাম্পেইন সেটিংস"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => (k === "media" ? openMediaTab() : setTab(k))}
            className={`px-4 py-2 rounded-md text-sm font-bold border transition-colors ${
              tab === k ? "bg-[#0b3d91] text-white border-[#0b3d91]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* --- Generate cards --- */}
        {tab === "cards" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-3 shadow-sm max-w-xl">
              <p className="text-sm font-bold text-gray-700">নতুন কার্ড তৈরি করুন</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="কতটি কার্ড (যেমন 100)"
                  className="flex-1 h-12 rounded-md border border-gray-300 px-3.5 text-sm font-semibold leading-normal focus:border-[#0b3d91] focus:outline-none"
                />
                <input
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="ব্যাচের নাম (ঐচ্ছিক)"
                  className="flex-1 h-12 rounded-md border border-gray-300 px-3.5 text-sm font-semibold leading-normal focus:border-[#0b3d91] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={doGenerate}
                  disabled={genLoading}
                  className="h-11 px-5 rounded-md bg-[#0b3d91] text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {genLoading ? <Loader2 className="size-4 animate-spin" /> : <Ticket size={16} />} তৈরি করুন
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                তৈরি হওয়া নম্বরগুলো কার্ডে ছাপিয়ে, সাথে এই QR লিংক দিন:{" "}
                <span className="font-mono font-bold text-[#0b3d91]">/lottery</span>। একই কার্ড/QR সব
                ক্যাম্পেইনে চলে — অব্যবহৃত কার্ড পরের ক্যাম্পেইনেও কাজ করবে।
              </p>
            </div>

            {generated.length > 0 && (
              <div className="bg-white rounded-md border border-emerald-200 p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-emerald-700">
                    এইমাত্র তৈরি {generated.length}টি কোড
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => copyCodes(generated)} className="text-xs font-bold text-[#0b3d91] inline-flex items-center gap-1 px-2 py-1 rounded border border-[#0b3d91]/30 hover:bg-[#eef3fb]">
                      <Copy size={13} /> কপি
                    </button>
                    <button onClick={() => printCodes(generated)} className="text-xs font-bold text-[#0b3d91] inline-flex items-center gap-1 px-2 py-1 rounded border border-[#0b3d91]/30 hover:bg-[#eef3fb]">
                      <Printer size={13} /> প্রিন্ট
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {generated.map((c) => (
                    <span key={c} className="px-2 py-1 rounded bg-[#eef3fb] border border-[#dfe6f2] text-[13px] font-extrabold tracking-wider font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-700 mb-2">
                সব কার্ড: {cards.length} (ব্যবহৃত {usedCount}, বাকি {cards.length - usedCount})
              </p>
              <p className="text-[11px] text-gray-500 mb-2">
                বাকি (অব্যবহৃত) কার্ডগুলো পরের নতুন ক্যাম্পেইনেও ব্যবহার করা যাবে।
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
                {cards.slice(0, 600).map((c) => (
                  <span
                    key={c.id}
                    className={`px-2 py-1 rounded text-[12.5px] font-bold tracking-wide font-mono border ${
                      c.used ? "bg-gray-100 text-gray-400 border-gray-200 line-through" : "bg-[#eef3fb] text-[#0b3d91] border-[#dfe6f2]"
                    }`}
                    title={c.used ? "ব্যবহৃত" : "বাকি"}
                  >
                    {c.code}
                  </span>
                ))}
                {cards.length === 0 && <p className="text-sm text-gray-500">এখনো কোনো কার্ড তৈরি হয়নি।</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- Entries --- */}
        {tab === "entries" && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 font-bold text-gray-700">ছবি</th>
                  <th className="py-3 px-4 font-bold text-gray-700">নাম</th>
                  <th className="py-3 px-4 font-bold text-gray-700">মোবাইল</th>
                  <th className="py-3 px-4 font-bold text-gray-700">কাস্টমার আইডি</th>
                  <th className="py-3 px-4 font-bold text-gray-700">লটারি নাম্বার</th>
                  <th className="py-3 px-4 font-bold text-gray-700">ঠিকানা</th>
                  <th className="py-3 px-4 font-bold text-gray-700">সময়</th>
                  <th className="py-3 px-4 font-bold text-gray-700">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-2.5 px-4">
                      {e.photoUrl ? (
                        <a href={e.photoUrl} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={e.photoUrl}
                            alt={e.name}
                            className="size-11 rounded-md object-cover border border-gray-200"
                          />
                        </a>
                      ) : (
                        <span className="size-11 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300">
                          <Users size={16} />
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">{e.name}</td>
                    <td className="py-2.5 px-4 font-mono">{e.phone}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-600">{e.customerId || "—"}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#0b3d91]">{e.cardCode}</td>
                    <td className="py-2.5 px-4 text-gray-600 max-w-[220px] truncate">{e.address}</td>
                    <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">{fmt(e.createdAt)}</td>
                    <td className="py-2.5 px-4">
                      {e.rank ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                          <Trophy size={12} /> বিজয়ী #{e.rank}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      এই ক্যাম্পেইনে এখনো কোনো এন্ট্রি জমা হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Draw --- */}
        {tab === "draw" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-3 shadow-sm max-w-xl">
              <p className="text-sm font-bold text-gray-700">
                বিজয়ী ড্র করুন {selected && <span className="text-[#0b3d91]">— {selected.name}</span>}
              </p>
              {isViewingActive ? (
                <>
                  <p className="text-[12.5px] text-gray-500">
                    এই ক্যাম্পেইনে এখনো ড্র হয়নি এমন এন্ট্রি: <b>{entries.length - winners.length}</b> জন। কতজন
                    বিজয়ী করতে চান লিখুন — এলোমেলোভাবে নির্বাচন হবে ও তাদের SMS যাবে।
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      min={1}
                      value={drawCount}
                      onChange={(e) => setDrawCount(e.target.value)}
                      placeholder="কতজন বিজয়ী (যেমন 3)"
                      className="flex-1 h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold focus:border-[#0b3d91] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={doDraw}
                      disabled={drawLoading}
                      className="h-11 px-5 rounded-md bg-amber-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {drawLoading ? <Loader2 className="size-4 animate-spin" /> : <Trophy size={16} />} ড্র করুন
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[12.5px] text-amber-700 font-semibold">
                  এই ক্যাম্পেইনটি শেষ হয়েছে — নিচে এর বিজয়ী তালিকা দেখা যাচ্ছে। নতুন ড্র করতে চলমান ক্যাম্পেইন সিলেক্ট করুন।
                </p>
              )}
            </div>

            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-x-auto">
              <p className="text-sm font-bold text-gray-700 p-4 pb-2">বিজয়ী তালিকা ({winners.length})</p>
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 font-bold text-gray-700">অবস্থান</th>
                    <th className="py-3 px-4 font-bold text-gray-700">নাম</th>
                    <th className="py-3 px-4 font-bold text-gray-700">মোবাইল</th>
                    <th className="py-3 px-4 font-bold text-gray-700">কার্ড</th>
                    <th className="py-3 px-4 font-bold text-gray-700">সময়</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w) => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold">
                          <Trophy size={12} /> #{w.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold">{w.name}</td>
                      <td className="py-2.5 px-4 font-mono">{w.phone}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0b3d91]">{w.cardCode}</td>
                      <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">{fmt(w.drawnAt)}</td>
                    </tr>
                  ))}
                  {winners.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        এই ক্যাম্পেইনে এখনো কোনো বিজয়ী ড্র করা হয়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- Campaign settings (media / meta) --- */}
        {tab === "media" && (
          <CampaignSettings
            campaignId={selectedId}
            media={media}
            loading={mediaLoading}
            onReload={() => loadMedia(selectedId)}
          />
        )}
      </div>
    </div>
  );
}

function CampaignSettings({
  campaignId,
  media,
  loading,
  onReload,
}: {
  campaignId: string;
  media: CampaignMedia | null;
  loading: boolean;
  onReload: () => void;
}) {
  const [name, setName] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopMobile, setShopMobile] = useState("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [uploadingTop, setUploadingTop] = useState(false);
  const [uploadingSlider, setUploadingSlider] = useState(false);

  // Hydrate local fields once per loaded campaign.
  if (media && media.id === campaignId && hydratedFor !== media.id) {
    const toLocal = (d: string | Date | null) => {
      if (!d) return "";
      const dt = new Date(d);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };
    setName(media.name || "");
    setDrawDate(toLocal(media.drawDate));
    setShopAddress(media.shopAddress || "");
    setShopMobile(media.shopMobile || "");
    setPrizeFirst(media.prizeFirst || "");
    setPrizeSecond(media.prizeSecond || "");
    setPrizeThird(media.prizeThird || "");
    setHydratedFor(media.id);
  }

  const save = async () => {
    setSaving(true);
    const res = await updateCampaignMeta(campaignId, {
      name,
      drawDate: drawDate || null,
      shopAddress,
      shopMobile,
      prizeFirst,
      prizeSecond,
      prizeThird,
    });
    setSaving(false);
    if (res.success) {
      toast.success("সংরক্ষণ হয়েছে");
      onReload();
    } else toast.error(res.message || "সংরক্ষণ করা যায়নি");
  };

  const uploadBanner = async (file: File, kind: "top" | "slider") => {
    const fd = new FormData();
    fd.append("campaignId", campaignId);
    fd.append("kind", kind);
    fd.append("file", file);
    if (kind === "top") setUploadingTop(true);
    else setUploadingSlider(true);
    const res = await uploadCampaignBanner(fd);
    if (kind === "top") setUploadingTop(false);
    else setUploadingSlider(false);
    if (res.success) {
      toast.success("ব্যানার আপলোড হয়েছে");
      setHydratedFor(null);
      onReload();
    } else toast.error(res.message || "আপলোড করা যায়নি");
  };

  const removeBanner = async (kind: "top" | "slider", key?: string) => {
    if (!confirm("এই ব্যানারটি মুছে ফেলবেন?")) return;
    const res = await removeCampaignBanner(campaignId, kind, key);
    if (res.success) {
      toast.success("মুছে ফেলা হয়েছে");
      setHydratedFor(null);
      onReload();
    } else toast.error(res.message || "মুছে ফেলা যায়নি");
  };

  if (loading && !media) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
        <Loader2 className="size-5 animate-spin" /> লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Meta fields */}
      <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-3 shadow-sm">
        <p className="text-sm font-bold text-gray-700 inline-flex items-center gap-2">
          <Settings size={16} className="text-[#0b3d91]" /> ক্যাম্পেইনের তথ্য
        </p>
        <LabeledInput label="ক্যাম্পেইনের নাম" value={name} onChange={setName} placeholder="যেমন ঈদ ধামাকা অফার" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledInput
            label="ড্র-র তারিখ"
            icon={CalendarDays}
            type="datetime-local"
            value={drawDate}
            onChange={setDrawDate}
          />
          <LabeledInput label="দোকানের মোবাইল" icon={Phone} value={shopMobile} onChange={setShopMobile} placeholder="01XXXXXXXXX" />
        </div>
        <LabeledInput label="দোকানের ঠিকানা" icon={MapPin} value={shopAddress} onChange={setShopAddress} placeholder="দোকানের সম্পূর্ণ ঠিকানা" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LabeledInput label="১ম পুরুষ্কার" value={prizeFirst} onChange={setPrizeFirst} placeholder="যেমন ফ্রিজ" />
          <LabeledInput label="২য় পুরুষ্কার" value={prizeSecond} onChange={setPrizeSecond} placeholder="যেমন টিভি" />
          <LabeledInput label="৩য় পুরুষ্কার" value={prizeThird} onChange={setPrizeThird} placeholder="যেমন আইপিএস" />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !campaignId}
          className="self-start h-11 px-5 rounded-md bg-[#0b3d91] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save size={16} />} সংরক্ষণ করুন
        </button>
      </div>

      {/* Top banner */}
      <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-3 shadow-sm">
        <p className="text-sm font-bold text-gray-700 inline-flex items-center gap-2">
          <ImageIcon size={16} className="text-[#0b3d91]" /> টপ ব্যানার (একটি)
        </p>
        {media?.topBannerUrl ? (
          <div className="relative w-full max-w-md aspect-[16/7] rounded-lg overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.topBannerUrl} alt="top banner" className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeBanner("top")}
              className="absolute top-2 right-2 size-8 rounded-full bg-black/55 text-white flex items-center justify-center"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-gray-500">এখনো কোনো টপ ব্যানার নেই।</p>
        )}
        <UploadButton
          loading={uploadingTop}
          label={media?.topBannerUrl ? "টপ ব্যানার পরিবর্তন করুন" : "টপ ব্যানার আপলোড করুন"}
          onFile={(f) => uploadBanner(f, "top")}
        />
      </div>

      {/* Slider banners */}
      <div className="bg-white rounded-md border border-gray-200 p-4 flex flex-col gap-3 shadow-sm">
        <p className="text-sm font-bold text-gray-700 inline-flex items-center gap-2">
          <ImageIcon size={16} className="text-[#0b3d91]" /> ব্যানার স্লাইডার ({media?.banners.length ?? 0})
        </p>
        {media && media.banners.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.banners.map((b) => (
              <div key={b.key} className="relative aspect-[16/9] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {b.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.url} alt="slide" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeBanner("slider", b.key)}
                  className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/55 text-white flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-gray-500">এখনো কোনো স্লাইডার ব্যানার নেই।</p>
        )}
        <UploadButton
          loading={uploadingSlider}
          label="স্লাইডারে ছবি যোগ করুন"
          onFile={(f) => uploadBanner(f, "slider")}
        />
      </div>
    </div>
  );
}

function UploadButton({
  loading,
  label,
  onFile,
}: {
  loading: boolean;
  label: string;
  onFile: (f: File) => void;
}) {
  return (
    <label className="self-start h-10 px-4 rounded-md bg-[#eef3fb] border border-[#cdd8ec] text-[#0b3d91] text-sm font-bold inline-flex items-center gap-2 cursor-pointer hover:bg-[#e3ecfa]">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload size={15} />}
      {loading ? "আপলোড হচ্ছে..." : label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: typeof MapPin;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-bold text-[#3d4f72] inline-flex items-center gap-1">
        {Icon && <Icon size={13} className="text-[#0b3d91]" />}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
      />
    </label>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 font-bold text-gray-700">
      <Icon size={15} className="text-[#0b3d91]" /> {value} <span className="font-medium text-gray-400">{label}</span>
    </span>
  );
}
