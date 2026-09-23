"use client";

import { deleteSeller, setSellerCredentials, toggleSellerStatus } from "@/actions";
import { Modal } from "@/components/ui";
import { SellersType } from "@/types";
import clsx from "clsx";
import { KeyRound, Package, Pencil, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Id, toast } from "react-toastify";
import SellerPurchaseForm from "./SellerPurchaseForm";
import SellerRegistrationForm from "./SellerRegistrationForm";

export default function SellerActionButtons({ sellerData, onChanged }: { sellerData: SellersType; onChanged?: () => void }) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [credentials, setCredentials] = useState({ username: sellerData.username || "", password: "" });
  const [busy, setBusy] = useState(false);
  const toastId = useRef<Id | null>(null);

  const run = async (label: string, fn: () => Promise<{ success: boolean; message: string }>) => {
    setBusy(true);
    toastId.current = toast(label, { autoClose: false });
    const res = await fn();
    setBusy(false);
    toast.update(toastId.current, { type: res.success ? "success" : "error", render: res.message, autoClose: 1500 });
    if (res.success) onChanged?.();
    return res;
  };

  const saveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) return toast.error("Username and password required");
    const res = await run("Setting credentials...", () => setSellerCredentials(sellerData.sellerId, credentials.username, credentials.password));
    if (res.success) setShowCredentials(false);
  };

  const btn = (color: string) => clsx("flex flex-col items-center justify-center gap-2 p-4 rounded-md transition-colors border", color);

  return (
    <>
      {showUpdate && (
        <Modal isVisible title="Update Seller" width="900" onClose={() => setShowUpdate(false)}>
          <SellerRegistrationForm mode="update" sellerData={sellerData} onComplete={() => { setShowUpdate(false); onChanged?.(); }} />
        </Modal>
      )}
      {showPurchase && <SellerPurchaseForm sellerId={sellerData.sellerId} onClose={() => setShowPurchase(false)} onSaved={onChanged} />}
      {showCredentials && (
        <Modal isVisible title="Set Seller Login Credentials" onClose={() => setShowCredentials(false)}>
          <form onSubmit={saveCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} className="w-full border rounded p-2" required />
              <p className="text-sm text-gray-500 mt-1">Current: {sellerData.username || "Not set"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} className="w-full border rounded p-2" required />
            </div>
            <p className="text-xs text-gray-500">Seller ID, username and password will be sent by SMS to {sellerData.phone}.</p>
            <button type="submit" disabled={busy} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300">{busy ? "Saving..." : "Save & Send SMS"}</button>
          </form>
        </Modal>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button onClick={() => setShowPurchase(true)} className={btn("bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100")}>
          <Package size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Add Purchase</span>
        </button>
        <button onClick={() => setShowUpdate(true)} className={btn("bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100")}>
          <Pencil size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Edit Info</span>
        </button>
        <button onClick={() => setShowCredentials(true)} className={btn("bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100")}>
          <KeyRound size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Login Access</span>
        </button>
        <button
          onClick={() => { if (window.confirm(`${sellerData.isActiveSeller ? "Block" : "Activate"} seller ${sellerData.shopName}?`)) run(sellerData.isActiveSeller ? "Blocking..." : "Activating...", () => toggleSellerStatus(sellerData.sellerId, !sellerData.isActiveSeller)); }}
          className={btn(sellerData.isActiveSeller ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100")}
        >
          {sellerData.isActiveSeller ? <ShieldOff size={24} /> : <ShieldCheck size={24} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{sellerData.isActiveSeller ? "Block" : "Activate"}</span>
        </button>
        <button
          onClick={() => { if (window.confirm(`Delete seller ${sellerData.shopName}? Linked customers are kept.`)) run("Deleting...", () => deleteSeller(sellerData.sellerId)); }}
          className={btn("bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100")}
        >
          <Trash2 size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Delete</span>
        </button>
      </div>
    </>
  );
}
