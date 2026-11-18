"use client";

import {
  deletePayment,
  sendInvoiceDownloadLink,
  updatePayment,
  updatePaymentStatus,
  completePayoutRequest,
} from "@/actions";
import { Modal, InputField } from "@/components/ui";
import { paymentInvoiceDownloadLinkMessagePreview } from "@/constants";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Id, toast } from "react-toastify";
import PaymentForm from "./PaymentForm";
import PaymentViewModal from "./PaymentViewModal";

export default function PaymentActionButtons({
  paymentData,
}: {
  paymentData: any; // Using any for new fields compatibility
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(paymentData.staff?.phone!);
  const [showSentLinkModal, setShowSentLinkModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const toastId = useRef<Id | null>(null);

  const sendDownloadLink = async () => {
    setIsSending(true);
    toastId.current = toast("Sending...", { autoClose: false });
    const res = await sendInvoiceDownloadLink(
      {
        name: paymentData.staff!.name,
        phoneNumber,
      },
      {
        invoiceNumber: paymentData.invoiceNumber,
        date: paymentData.date,
        totalPrice: paymentData.amount,
        invoiceType:
          paymentData.staff?.role === "technician"
            ? "staff-payment:repair"
            : "staff-payment:install",
      },
    );
    setShowSentLinkModal(!res.success);
    setIsSending(false);
    toast.update(toastId.current, {
      type: res.success ? "success" : "error",
      render: res.message,
      autoClose: 1500,
    });
  };

  const updatePaymentHandler = async (updates: FormData) => {
    setIsUpdating(true);
    const res = await updatePayment(
      paymentData.paymentId,
      Object.fromEntries(updates) as unknown as Parameters<
        typeof updatePayment
      >[1],
    );
    toast(res.message, {
      type: res.success ? "success" : "error",
    });
    setIsUpdating(!res.success);
    setShowEditModal(!res.success);
  };

  const handleStatusUpdate = async (
    newStatus:
      | "requested"
      | "pending"
      | "processing"
      | "approved"
      | "rejected"
      | "completed",
  ) => {
    const confirmed = window.confirm(`Change status to "${newStatus}"?`);
    if (!confirmed) return;
    setIsStatusUpdating(true);
    const res = await updatePaymentStatus(paymentData.paymentId, newStatus);
    toast(res.message, { type: res.success ? "success" : "error" });
    setIsStatusUpdating(false);
  };

  const deletePaymentInfo = async () => {
    const confirmed = window.confirm("Are you sure?");
    if (confirmed) {
      toastId.current = toast("Deleting...", { autoClose: false });
      const res = await deletePayment(paymentData.paymentId);
      toast.update(toastId.current, {
        type: res.success ? "success" : "error",
        render: res.message,
        autoClose: 1500,
      });
    }
  };

  // Determine next status in the flow
  const getNextStatus = () => {
    if (paymentData.status === "requested") return "approved";
    return null;
  };

  const nextStatus = getNextStatus();
  const statusLabels: Record<string, string> = {
    requested: "Requested",
    approved: "Approved",
  };

  return (
    <div className="flex gap-4">
      {/* Status flow button */}
      {nextStatus && (
        <button
          onClick={() => handleStatusUpdate(nextStatus as any)}
          disabled={isStatusUpdating}
          title="Approve Payment Request"
          className="text-gray-400 hover:text-green-600"
        >
          {isStatusUpdating ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <CheckCircle className="size-6" />
          )}
        </button>
      )}
      {/* Add Payment Button (only for uncompleted withdrawal requests) */}
      {["requested", "pending", "approved"].includes(paymentData.status) && (
        <button
          onClick={() => setShowAddPaymentModal(true)}
          title="Add Payment details to complete payout"
          className="text-blue-500 hover:text-blue-600"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      )}
      {paymentData.status === "completed" && (
        <span
          className="text-green-500 cursor-default"
          title="Payment Completed"
        >
          <CheckCircle className="size-6" />
        </span>
      )}
      {paymentData.status === "rejected" && (
        <span className="text-red-500 cursor-default" title="Payment Rejected">
          <X className="size-6" />
        </span>
      )}
      {/* Reject button for requested status */}
      {paymentData.status === "requested" && (
        <button
          onClick={() => handleStatusUpdate("rejected")}
          disabled={isStatusUpdating}
          title="Reject Payment Request"
          className="text-gray-400 hover:text-red-600"
        >
          <X className="size-6" />
        </button>
      )}
      {showPaymentInfoModal && (
        <PaymentViewModal
          paymentData={paymentData}
          onClose={() => setShowPaymentInfoModal(false)}
        />
      )}
      {showEditModal && (
        <PaymentForm
          mode="update"
          paymentInfo={paymentData}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showAddPaymentModal && (
        <AddPaymentModal
          paymentData={paymentData}
          onClose={() => setShowAddPaymentModal(false)}
        />
      )}
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
                  {paymentInvoiceDownloadLinkMessagePreview}
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
      <button title="View" onClick={() => setShowPaymentInfoModal(true)}>
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
      </button>
      <button title="Edit" onClick={() => setShowEditModal(true)}>
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
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      </button>
      <a
        target="_blank"
        href={`/pdf/download?type=payment&id=${paymentData.invoiceNumber}`}
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

const AddPaymentModal = ({
  paymentData,
  onClose,
}: {
  paymentData: any;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState<number>(paymentData.amount || 0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [transactionId, setTransactionId] = useState<string>("");
  const [senderWalletNumber, setSenderWalletNumber] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethod = paymentData.paymentMethod || paymentData.staff?.paymentPreference || "bkash";
  const receiverWallet = paymentData.receiverWalletNumber || paymentData.staff?.walletNumber || "";
  const receiverBank = paymentData.receiverBankInfo || paymentData.staff?.bankInfo || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await completePayoutRequest(paymentData.paymentId, {
      amount,
      date: new Date(paymentDate),
      transactionId: paymentMethod !== "cash" && paymentMethod !== "bank" ? transactionId : undefined,
      senderWalletNumber: paymentMethod !== "cash" && paymentMethod !== "bank" ? senderWalletNumber : undefined,
      description: description || `Payout completed for withdrawal request`,
    });

    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal isVisible title="Complete Payment (Payout)" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {/* Staff Details */}
        <div className="bg-gray-50 p-3 rounded-md border text-sm space-y-1">
          <div className="font-semibold text-gray-700">Staff Details:</div>
          <div>Name: <span className="font-medium">{paymentData.staff?.name || "N/A"}</span></div>
          <div>Phone: <span className="font-medium">{paymentData.staff?.phone || "N/A"}</span></div>
        </div>

        {/* Pre-populated fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Payment Method"
            disabled
            value={paymentMethod.toUpperCase()}
          />
          {paymentMethod === "bank" ? (
            <InputField
              label="Receiver Bank Name"
              disabled
              value={receiverBank?.bankName || "N/A"}
            />
          ) : (
            paymentMethod !== "cash" && (
              <InputField
                label="Receiver Wallet Number"
                disabled
                value={receiverWallet}
              />
            )
          )}
        </div>

        {paymentMethod === "bank" && receiverBank && (
          <div className="bg-gray-50 p-3 rounded-md border text-sm space-y-1">
            <div className="font-semibold text-gray-700">Bank Details:</div>
            <div>Account Holder: {receiverBank.accountHolderName}</div>
            <div>Account Number: {receiverBank.accountNumber}</div>
            <div>Branch: {receiverBank.branchName}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Amount (৳)"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <InputField
            label="Payment Date"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Wallet payment specifics */}
        {paymentMethod !== "cash" && paymentMethod !== "bank" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Sender Wallet Number"
              type="tel"
              required
              value={senderWalletNumber}
              onChange={(e) => setSenderWalletNumber(e.target.value)}
            />
            <InputField
              label="Transaction ID"
              type="text"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Task Description / Note</label>
          <textarea
            className="__input p-2 h-20"
            placeholder="Enter payment or task details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="__btn w-full disabled:bg-opacity-50"
        >
          {isSubmitting ? "Completing Payment..." : "Complete Payment"}
        </button>
      </form>
    </Modal>
  );
};
