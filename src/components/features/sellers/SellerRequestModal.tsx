"use client";

import { sellerRequestService, type SellerSoldProduct } from "@/actions/sellerActions";
import { Modal } from "@/components/ui";
import { productImage } from "@/lib/serviceStatusStyle";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Home, Send, Wrench } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

/**
 * One simple form a seller fills to request a service or an installation for a
 * unit they sold: the product and customer are already known, the seller only
 * picks the kind, optionally writes the issue, and sends.
 */
export default function SellerRequestModal({ product, kind: initialKind, onClose }: { product: SellerSoldProduct; kind: "repair" | "install"; onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<"repair" | "install">(initialKind);
  const [issue, setIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const open = product.services.find((s) => s.type === kind && !["completed", "canceled"].includes(s.status));

  const submit = async () => {
    setBusy(true);
    const res = await sellerRequestService({ customerId: product.customerId, productId: product.id, productType: product.type, productModel: product.model, reportedIssue: issue, type: kind });
    setBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) {
      onClose();
      router.refresh();
    }
  };

  return (
    <Modal isVisible title={kind === "install" ? "ইন্সটল আবেদন" : "সার্ভিস রিকোয়েস্ট"} width="500" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-md bg-[#f5f7fb] p-2.5">
          <span className="relative size-14 rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
            <Image src={productImage(product.type)} alt={product.type} fill sizes="56px" className="object-contain p-1" />
          </span>
          <span className="flex flex-col min-w-0 leading-tight">
            <span className="text-[14px] font-extrabold text-[#16213a] break-words">{product.type.toUpperCase()} {product.model}</span>
            <span className="text-[12px] font-semibold text-[#6b7690]">{product.customerName} · {product.customerPhone}</span>
            <span className="text-[11px] font-semibold text-[#6b7690]">ইনভয়েস #{product.invoiceNumber} · {formatDate(product.invoiceDate)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["repair", "install"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={clsx("h-11 rounded-md border-2 text-[13px] font-extrabold inline-flex items-center justify-center gap-2", kind === k ? (k === "install" ? "border-[#1f5fc9] bg-[#e8f1ff] text-[#1f5fc9]" : "border-[#178a42] bg-[#e9f9ef] text-[#178a42]") : "border-[#dfe6f2] bg-white text-[#5b6784]")}
            >
              {k === "install" ? <Home size={16} /> : <Wrench size={16} />}
              {k === "install" ? "ইন্সটল" : "সার্ভিস (মেরামত)"}
            </button>
          ))}
        </div>

        {open && (
          <p className="rounded-md border border-[#f5dfa0] bg-[#fff8ea] px-3 py-2 text-[12.5px] font-semibold text-[#8a4a05]">
            এই পণ্যের একটি {kind === "install" ? "ইন্সটল" : "সার্ভিস"} ({open.serviceId}) ইতিমধ্যে চলমান আছে — নতুন করে পাঠানো যাবে না।
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-gray-700">{kind === "install" ? "নোট (ঐচ্ছিক)" : "কী সমস্যা? (ঐচ্ছিক)"}</span>
          <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={3} placeholder={kind === "install" ? "কবে/কোথায় ইন্সটল করতে হবে লিখুন" : "কাস্টমার কী সমস্যার কথা বলেছে লিখুন"} className="w-full rounded-md px-3 py-2 border border-gray-200 bg-gray-50 text-sm outline-none focus:border-brand" />
        </label>
        <p className="text-xs text-[#6b7690]">পাঠালে সরাসরি SE Electronics এর {kind === "install" ? "ইন্সটলেশন" : "সার্ভিস"} লিস্টে যাবে। কাস্টমারের ফোনে ট্র্যাকিং SMS যাবে, অফিস অনুমোদন করলে আপনার মোবাইলে SMS আসবে।</p>
        <button onClick={submit} disabled={busy || !!open} className="h-12 rounded-md bg-[#1a9c4b] text-white font-extrabold text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-50">
          <Send size={16} />
          {busy ? "পাঠানো হচ্ছে..." : "রিকোয়েস্ট পাঠান"}
        </button>
      </div>
    </Modal>
  );
}
