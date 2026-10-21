"use client";

import { SellerCertificateItem, getSellerCertificatesAdmin, issueSellerCertificate, revokeSellerCertificate } from "@/actions/sellerCertificateActions";
import { Modal } from "@/components/ui";
import { SELLER_CERTIFICATE_TYPES, SellerCertificateType } from "@/constants/sellerCertificates";
import { SellersType } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Award, Download, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

const TYPES = Object.entries(SELLER_CERTIFICATE_TYPES) as [SellerCertificateType, (typeof SELLER_CERTIFICATE_TYPES)[SellerCertificateType]][];

export default function SellerCertificateModal({ seller, onClose }: { seller: SellersType; onClose: () => void }) {
  const [certType, setCertType] = useState<SellerCertificateType>("honor");
  const [period, setPeriod] = useState(String(new Date().getFullYear()));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<SellerCertificateItem[] | null>(null);

  const load = useCallback(() => {
    getSellerCertificatesAdmin(seller.sellerId).then((r) => setIssued(r.data));
  }, [seller.sellerId]);
  useEffect(load, [load]);

  const issue = async () => {
    setBusy(true);
    const res = await issueSellerCertificate({ sellerId: seller.sellerId, certType, period, note });
    setBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { setNote(""); load(); }
  };

  const revoke = async (c: SellerCertificateItem) => {
    if (!window.confirm(`Remove "${SELLER_CERTIFICATE_TYPES[c.certType].title}" (${c.certNo}) from ${seller.shopName}?`)) return;
    const res = await revokeSellerCertificate(c.token);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) load();
  };

  return (
    <Modal isVisible title={`Certificate · ${seller.shopName}`} width="700" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TYPES.map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCertType(key)}
              className={clsx("flex flex-col items-start gap-1 p-2.5 rounded-md border text-left transition-colors", certType === key ? "border-transparent text-white" : "border-gray-200 bg-white hover:bg-gray-50")}
              style={certType === key ? { background: t.accent } : undefined}
            >
              <Award size={20} />
              <span className="text-[13px] font-extrabold leading-tight">{t.title}</span>
              <span className={clsx("text-[10.5px] font-semibold", certType === key ? "text-white/80" : "text-gray-500")}>{t.english}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 border border-gray-100 rounded-md p-2">{SELLER_CERTIFICATE_TYPES[certType].body}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
            Period / year (optional)
            <input value={period} onChange={(e) => setPeriod(e.target.value)} className="__input" placeholder="e.g. 2026 or অক্টোবর ২০২৬" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
            Extra line (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} className="__input" placeholder="e.g. সিলেট জেলায় সর্বোচ্চ বিক্রয়" />
          </label>
        </div>
        <p className="text-xs text-gray-500">Shop, owner, seller ID and district come from the seller profile. {seller.ownerName} gets an app notification and SMS at {seller.phone}.</p>
        <button disabled={busy} onClick={issue} className="__btn flex items-center justify-center gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Award size={18} />}
          {busy ? "Issuing..." : "Issue certificate & notify seller"}
        </button>

        <div className="border-t pt-3 flex flex-col gap-1.5">
          <span className="text-sm font-bold text-gray-800">Issued certificates</span>
          {issued === null && <span className="text-xs text-gray-400">Loading...</span>}
          {issued?.length === 0 && <span className="text-xs text-gray-400">None yet</span>}
          {issued?.map((c) => (
            <div key={c.token} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 border border-gray-100">
              <span className="size-8 rounded-md text-white flex items-center justify-center shrink-0" style={{ background: SELLER_CERTIFICATE_TYPES[c.certType].accent }}><Award size={16} /></span>
              <span className="flex flex-col flex-1 min-w-0 leading-tight">
                <span className="text-[13px] font-bold truncate">{SELLER_CERTIFICATE_TYPES[c.certType].title}{c.period ? ` · ${c.period}` : ""}</span>
                <span className="text-[11px] text-gray-500 truncate">{formatDate(c.issuedAt)} · {c.certNo}</span>
              </span>
              <a href={`/pdf/download?token=${c.token}`} target="_blank" className="size-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center" title="Download PDF"><Download size={16} /></a>
              <button onClick={() => revoke(c)} className="size-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center" title="Remove"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
