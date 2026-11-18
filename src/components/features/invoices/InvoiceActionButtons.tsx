"use client";

import { deleteInvoice, sendInvoiceDownloadLink } from "@/actions";
import { getProducts } from "@/actions/productActions";
import { Modal } from "@/components/ui";
import { invoiceDownloadLinkMessagePreview } from "@/constants";
import { InvoicesType, Product } from "@/types";
import { useRef, useState } from "react";
import { Id, toast } from "react-toastify";
import InvoicePreviewButton from "./InvoicePreviewButton";

export default function InvoiceActionButtons({
  invoiceData,
}: {
  invoiceData: InvoicesType;
}) {
  const [showInvoiceViewModal, setShowInvoiceViewModal] = useState(false);
  const [showSentLinkModal, setShowSentLinkModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(invoiceData.customerPhone);
  const [isSending, setIsSending] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const toastId = useRef<Id | null>(null);

  const fetchProducts = async () => {
    const res = await getProducts(invoiceData.id);
    if (res.success) {
      setProducts(res.data!);
    } else {
      alert(res.message);
    }
  };

  const invoicePreviewHandler = async () => {
    setShowInvoiceViewModal(true);
    await fetchProducts();
  };

  const sendDownloadLink = async () => {
    setIsSending(true);
    const res = await sendInvoiceDownloadLink(
      {
        name: invoiceData.customerName,
        phoneNumber,
      },
      {
        invoiceNumber: invoiceData.invoiceNumber,
        customerId: invoiceData.customerId,
        date: invoiceData.date,
        totalPrice: invoiceData.total,
        invoiceType: "customer-invoice",
      },
    );
    setShowSentLinkModal(!res.success);
    setIsSending(false);
    toast(res.message, { type: res.success ? "success" : "error" });
  };

  const deletePaymentInfo = async () => {
    const confirmed = window.confirm("Are you sure?");
    if (confirmed) {
      toastId.current = toast("Deleting...", { autoClose: false });
      const res = await deleteInvoice(invoiceData.invoiceNumber);
      toast.update(toastId.current, {
        type: res.success ? "success" : "error",
        render: res.message,
        autoClose: 1500,
      });
    }
  };

  return (
    <div className="flex gap-4">
      {showSentLinkModal && (
        <Modal
          title="Send download link"
          isVisible={true}
          onClose={() => setShowSentLinkModal(false)}
        >
          <div className="flex flex-col gap-4">
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoFocus
              type="tel"
              className="__input"
              placeholder="Phone number"
            />
            <div className="mb-6">
              <label className="mb-2 block">Message preview:</label>
              <div className="max-w-96 text-gray-600">
                <p className="whitespace-pre-wrap text-sm">
                  {invoiceDownloadLinkMessagePreview}
                </p>
              </div>
            </div>
            <button
              disabled={!phoneNumber.trim() || isSending}
              onClick={sendDownloadLink}
              className="__btn"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </Modal>
      )}
      <InvoicePreviewButton title="Preview" invoiceData={invoiceData}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </InvoicePreviewButton>
      <a
        target="_blank"
        href={`/pdf/download?type=invoice&id=${invoiceData.invoiceNumber}`}
        title="Download Invoice"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      </a>
      <button
        title="Send invoice download link"
        onClick={() => setShowSentLinkModal(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6 -rotate-45"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
          />
        </svg>
      </button>
      <button
        onClick={deletePaymentInfo}
        title="Delete"
        className="text-red-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
}
