"use client";

import { deleteSellerPurchase, getSellerById, getSellerMediaUrls } from "@/actions";
import { ImageWithLightbox, Modal, Spinner, StatusBadge } from "@/components/ui";
import { sellerBusinessTypes } from "@/constants";
import { SellerPurchaseType, SellersType } from "@/types";
import { formatDate } from "@/utils";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SellerActionButtons from "./SellerActionButtons";
import SellerPurchaseForm from "./SellerPurchaseForm";
import { ProfileLinkButton } from "@/components/features/staff";

type SellerDetail = SellersType & {
  purchases: SellerPurchaseType[];
  customers: { customerId: string; name: string; phone: string; address: string; createdAt: Date; invoiceNumber: string }[];
};

const paymentLabels: Record<string, string> = { bank: "ব্যাংক", bkash: "বিকাশ", nagad: "নগদ", rocket: "রকেট", cash: "ক্যাশ" };

export default function SellerProfileModal({ sellerId, onClose }: { sellerId: string; onClose: () => void }) {
  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [docs, setDocs] = useState<string[] | null>(null);
  const [editPurchase, setEditPurchase] = useState<SellerPurchaseType | null>(null);

  const load = async () => {
    const res = await getSellerById(sellerId);
    if (res.success) setSeller(res.data as unknown as SellerDetail);
    else { toast.error(res.message); onClose(); }
  };
  useEffect(() => { load(); }, []);

  const loadDocs = async (e: React.ToggleEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || docs || !seller) return;
    const res = await getSellerMediaUrls([seller.tradeLicensePhotoKey, seller.shopFrontPhotoKey, seller.shopInsidePhotoKey || "", seller.nidFrontPhotoKey, seller.nidBackPhotoKey].filter(Boolean));
    if (res.success) setDocs(res.data!); else toast.error(res.message);
  };

  const removePurchase = async (p: SellerPurchaseType) => {
    if (!window.confirm(`Delete purchase ${p.invoiceNumber}?`)) return;
    const res = await deleteSellerPurchase(p.purchaseId);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) load();
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex border-b py-1"><span className="w-32 flex-shrink-0">{label}</span><span className="mr-4 flex-shrink-0">:</span><span className="font-semibold">{value}</span></div>
  );

  const due = seller ? seller.purchases.reduce((t, p) => t + p.totalAmount - p.paidAmount, 0) : 0;
  const units = seller ? seller.purchases.reduce((t, p) => t + p.quantity, 0) : 0;

  return (
    <Modal onClose={onClose} isVisible title="Seller Profile" width="900">
      {editPurchase && seller && <SellerPurchaseForm sellerId={seller.sellerId} purchase={editPurchase} onClose={() => setEditPurchase(null)} onSaved={load} />}
      {!seller ? (
        <div className="__center h-32"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="size-32 rounded-full overflow-hidden __center shrink-0"><ImageWithLightbox src={seller.ownerPhotoUrl || undefined} /></div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-black">{seller.shopName}</h3>
              <p className="text-gray-600">{seller.ownerName} · {seller.phone}</p>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                <span className="text-sm">ID: <b>{seller.sellerId}</b></span>
                <StatusBadge status={seller.isVerified ? "approved" : "pending"} />
                {!seller.isActiveSeller && <StatusBadge status="rejected" />}
              </div>
            </div>
            <div className="sm:ml-auto grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-gray-50 rounded-md px-3 py-2"><div className="font-black">{units}</div><div className="text-[10px] text-gray-500 uppercase">Units</div></div>
              <div className="bg-gray-50 rounded-md px-3 py-2"><div className="font-black">{seller.customers.length}</div><div className="text-[10px] text-gray-500 uppercase">Customers</div></div>
              <div className="bg-gray-50 rounded-md px-3 py-2"><div className={`font-black ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}>৳{due.toLocaleString()}</div><div className="text-[10px] text-gray-500 uppercase">Due</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <div className="font-semibold mb-2 p-1 bg-blue-100">Shop Info</div>
              <Row label="ব্যবসার ধরন" value={sellerBusinessTypes.find((b) => b.value === seller.businessType)?.label ?? seller.businessType} />
              <Row label="ট্রেড লাইসেন্স" value={seller.tradeLicenseNumber} />
              <Row label="ব্যবসার বয়স" value={`${seller.businessYears ?? 0} বছর`} />
              <Row label="ঠিকানা" value={`${seller.shopStreetAddress}, ${seller.shopPoliceStation || ""} ${seller.shopDistrict}`} />
              <Row label="পোস্ট অফিস" value={seller.shopPostOffice || "N/A"} />
              <Row label="NID" value={seller.nidNumber} />
              <Row label="Joined" value={formatDate(seller.createdAt)} />
              <Row label="Source" value={seller.createdFrom} />
            </div>
            <div>
              <div className="font-semibold mb-2 p-1 bg-blue-100">Payment preferences</div>
              <Row label="মাধ্যম" value={paymentLabels[seller.paymentPreference]} />
              {seller.paymentPreference === "bank" ? (
                <>
                  <Row label="ব্যাংক নাম" value={seller.bankInfo?.bankName} />
                  <Row label="একাউন্ট নাম" value={seller.bankInfo?.accountHolderName} />
                  <Row label="একাউন্ট নাম্বার" value={seller.bankInfo?.accountNumber} />
                  <Row label="শাখা" value={seller.bankInfo?.branchName} />
                </>
              ) : (
                <Row label="ওয়ালেট নাম্বার" value={seller.walletNumber || "N/A"} />
              )}
              <Row label="Login" value={seller.username ? `@${seller.username}` : "Not set"} />
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2 p-1 bg-brand/10 text-brand rounded-md px-3">Quick Actions</div>
            <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
              <SellerActionButtons sellerData={seller} onChanged={load} />
            </div>
          </div>

          <details open>
            <summary className="font-semibold cursor-pointer">Purchases from company ({seller.purchases.length})</summary>
            <div className="overflow-auto max-h-80 mt-2">
              {seller.purchases.length === 0 ? <div className="text-gray-400 text-sm p-2">No purchase yet</div> : (
                <table className="w-full text-sm border">
                  <thead><tr className="bg-gray-100"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Product</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Total</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Due</th><th className="p-2"></th></tr></thead>
                  <tbody>
                    {seller.purchases.map((p) => (
                      <tr key={p.purchaseId} className="border-t">
                        <td className="p-2 whitespace-nowrap">{formatDate(p.date)}</td>
                        <td className="p-2">{p.invoiceNumber}</td>
                        <td className="p-2">{p.productType.toUpperCase()} {p.productModel}</td>
                        <td className="p-2 text-right">{p.quantity}</td>
                        <td className="p-2 text-right whitespace-nowrap">৳{p.totalAmount.toLocaleString()}</td>
                        <td className="p-2 text-right whitespace-nowrap">৳{p.paidAmount.toLocaleString()}</td>
                        <td className={`p-2 text-right whitespace-nowrap ${p.totalAmount - p.paidAmount > 0 ? "text-rose-600 font-semibold" : "text-emerald-600"}`}>৳{Math.max(p.totalAmount - p.paidAmount, 0).toLocaleString()}</td>
                        <td className="p-2 whitespace-nowrap text-center">
                          <button className="text-blue-500 hover:underline mr-2" onClick={() => setEditPurchase(p)}>Edit</button>
                          <button className="text-red-500 hover:underline" onClick={() => removePurchase(p)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>

          <details open>
            <summary className="font-semibold cursor-pointer">Customers ({seller.customers.length})</summary>
            <div className="overflow-auto max-h-80 mt-2">
              {seller.customers.length === 0 ? <div className="text-gray-400 text-sm p-2">No customer linked yet. Link a customer from the Customers page (Purchased from field).</div> : (
                <table className="w-full text-sm border">
                  <thead><tr className="bg-gray-100"><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Phone</th><th className="p-2 text-left">Address</th><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Date</th></tr></thead>
                  <tbody>
                    {seller.customers.map((c) => (
                      <tr key={c.customerId} className="border-t">
                        <td className="p-2"><ProfileLinkButton text={c.name} customerId={c.customerId} /></td>
                        <td className="p-2">{c.phone}</td>
                        <td className="p-2">{c.address}</td>
                        <td className="p-2">{c.invoiceNumber}</td>
                        <td className="p-2 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>

          <details onToggle={loadDocs} className="select-none">
            <summary className="font-semibold cursor-pointer">Documents (Trade license, Shop, NID)</summary>
            {docs ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {docs.map((url, i) => <div key={i}><ImageWithLightbox src={url} /></div>)}
              </div>
            ) : <div className="h-40 __center"><Spinner /></div>}
          </details>
        </div>
      )}
    </Modal>
  );
}
