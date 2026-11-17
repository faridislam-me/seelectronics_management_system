"use client";

import {
  drawLotteryWinners,
  generateLotteryCards,
  getCampaigns,
  getLotteryCards,
  getLotteryEntries,
  getLotteryWinners,
  startNewCampaign,
} from "@/actions/lotteryActions";
import {
  Copy,
  Gift,
  Loader2,
  Plus,
  Printer,
  Ticket,
  Trophy,
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
  rank: number | null;
  drawnAt: string | Date | null;
  createdAt: string | Date;
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
  const [tab, setTab] = useState<"cards" | "entries" | "draw">("cards");
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
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
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
                  <th className="py-3 px-4 font-bold text-gray-700">নাম</th>
                  <th className="py-3 px-4 font-bold text-gray-700">মোবাইল</th>
                  <th className="py-3 px-4 font-bold text-gray-700">কার্ড</th>
                  <th className="py-3 px-4 font-bold text-gray-700">ঠিকানা</th>
                  <th className="py-3 px-4 font-bold text-gray-700">সময়</th>
                  <th className="py-3 px-4 font-bold text-gray-700">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-semibold">{e.name}</td>
                    <td className="py-2.5 px-4 font-mono">{e.phone}</td>
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
                    <td colSpan={6} className="py-8 text-center text-gray-500">
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
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 font-bold text-gray-700">
      <Icon size={15} className="text-[#0b3d91]" /> {value} <span className="font-medium text-gray-400">{label}</span>
    </span>
  );
}
