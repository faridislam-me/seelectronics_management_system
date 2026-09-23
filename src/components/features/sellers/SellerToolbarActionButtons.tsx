"use client";

import { sendSellerRegistrationLink } from "@/actions";
import { Modal } from "@/components/ui";
import { sellerRegistrationLinkMessagePreview } from "@/constants";
import { Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import SellerRegistrationForm from "./SellerRegistrationForm";

export default function SellerToolbarActionButtons() {
  const [showSendLink, setShowSendLink] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendLink = async () => {
    setIsSending(true);
    const res = await sendSellerRegistrationLink(phoneNumber);
    setIsSending(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { setShowSendLink(false); setPhoneNumber(""); }
  };

  return (
    <div className="flex gap-x-3">
      {showSendLink && (
        <Modal title="Send seller application link" isVisible onClose={() => setShowSendLink(false)}>
          <div className="flex flex-col gap-4">
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} autoFocus type="tel" className="__input" placeholder="Phone number" />
            <div className="mb-4">
              <label className="mb-2 block">Message preview:</label>
              <div className="max-w-96 text-gray-600"><p className="whitespace-pre-wrap text-sm">{sellerRegistrationLinkMessagePreview}</p></div>
            </div>
            <button disabled={!phoneNumber.trim() || isSending} onClick={sendLink} className="__btn">{isSending ? "Sending..." : "Send"}</button>
          </div>
        </Modal>
      )}
      {showAdd && (
        <Modal title="Add Seller / Dealer" isVisible width="900" onClose={() => setShowAdd(false)}>
          <SellerRegistrationForm mode="create" onComplete={() => { setShowAdd(false); toast.success("Seller added"); }} />
        </Modal>
      )}
      <button className="__btn" onClick={() => setShowSendLink(true)}><Send size={18} /><span className="hidden lg:block">Send application link</span></button>
      <button className="__btn" onClick={() => setShowAdd(true)}><Plus size={20} /><span className="hidden lg:block">Add Seller</span></button>
    </div>
  );
}
