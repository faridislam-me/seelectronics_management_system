"use client";

import { createSellerPurchase, updateSellerPurchase } from "@/actions";
import { InputField, Modal } from "@/components/ui";
import { productTypes } from "@/constants";
import { SellerPurchaseType } from "@/types";
import { useState } from "react";
import { toast } from "react-toastify";

export default function SellerPurchaseForm({ sellerId, purchase, onClose, onSaved }: { sellerId: string; purchase?: SellerPurchaseType; onClose: () => void; onSaved?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(purchase?.quantity ?? 1);
  const [unitPrice, setUnitPrice] = useState(purchase?.unitPrice ?? 0);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    const res = purchase ? await updateSellerPurchase(purchase.purchaseId, formData) : await createSellerPurchase(sellerId, formData);
    setLoading(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { onSaved?.(); onClose(); }
  };

  return (
    <Modal title={purchase ? "Edit purchase" : "Add purchase"} isVisible onClose={onClose} width="600">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex-1 text-start">
            <label className="text-sm">Product Type <span className="text-red-500 text-lg">*</span>
              <select name="productType" defaultValue={purchase?.productType ?? "ips"} className="w-full bg-white border rounded-md outline-none h-10 px-2 mt-1">
                {productTypes.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </label>
          </div>
          <InputField label="Product Model" name="productModel" defaultValue={purchase?.productModel || ""} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="Quantity" name="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} />
          <InputField label="Unit Price" name="unitPrice" type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} />
          <InputField label="Paid Amount" name="paidAmount" type="number" min={0} defaultValue={purchase?.paidAmount ?? 0} required={false} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Date" name="date" type="date" defaultValue={new Date(purchase?.date ?? Date.now()).toISOString().split("T")[0]} />
          <div className="flex-1 text-start">
            <span className="text-sm">Total</span>
            <div className="__input mt-1 flex items-center bg-gray-100 font-semibold">{(quantity * unitPrice).toLocaleString()} TK</div>
          </div>
        </div>
        <label className="text-sm"><span>Note</span>
          <textarea name="note" defaultValue={purchase?.note ?? ""} className="__input h-24 mt-1"></textarea>
        </label>
        <button disabled={loading} className="__btn">{loading ? "Saving..." : purchase ? "Update" : "Add"}</button>
      </form>
    </Modal>
  );
}
