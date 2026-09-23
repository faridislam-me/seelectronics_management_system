"use client";

import { deleteApplication, updateApplicationStatus } from "@/actions";
import { CustomerViewModal } from "@/components/features/customers";
import { ServiceViewModal } from "@/components/features/services";
import { StaffProfileModal } from "@/components/features/staff";
import { SellerProfileModal } from "@/components/features/sellers";
import { SubscriberViewModal } from "@/components/features/subscriptions";
import { Modal, StatusBadge } from "@/components/ui";
import { useRef, useState } from "react";
import { Id, toast } from "react-toastify";

export default function ApplicationActionButtons({
  applicationData,
}: {
  applicationData: {
    status: any;
    applicantId: string;
    applicationId: string;
    type:
      | "service_application"
      | "staff_application"
      | "subscription_application"
      | "vip_card_application"
      | "seller_application";
    rejectReason: string | null;
  };
}) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(
    applicationData.status,
  );
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    applicationData.rejectReason || "",
  );
  const [editRejectReason, setEditRejectReason] = useState(false);
  const toastId = useRef<Id | null>(null);

  const updateApplicationStatusHandler = async () => {
    toastId.current = toast("Updating...", { autoClose: false });
    const res = await updateApplicationStatus(applicationData.applicationId, {
      ...(applicationStatus !== applicationData.status && {
        status: applicationStatus,
      }),
      rejectReason,
    });
    if (res.success)
      (setShowDropdown(false),
        setShowRejectReasonModal(false),
        setEditRejectReason(false));
    toast.update(toastId.current, {
      type: res.success ? "success" : "error",
      render: res.message,
      autoClose: 1500,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setApplicationStatus(e.target.value);
    if (e.target.value === "rejected") {
      setShowRejectReasonModal(true);
      setEditRejectReason(true);
    }
  };

  const deleteApplicationHandler = async () => {
    const confirmed = window.confirm("Delete application?");
    if (confirmed) {
      toastId.current = toast("Deleting...", { autoClose: false });
      const res = await deleteApplication(applicationData.applicationId);
      toast.update(toastId.current, {
        type: res.success ? "success" : "error",
        render: res.message,
        autoClose: 1500,
      });
    }
  };
  return (
    <>
      {showRejectReasonModal && (
        <Modal
          title="Rejection Reson"
          isVisible
          onClose={() => (
            setShowRejectReasonModal(false),
            setEditRejectReason(false)
          )}
        >
          <div className="flex flex-col gap-4">
            {applicationData.status === "rejected" && (
              <button
                onClick={() => setEditRejectReason(!editRejectReason)}
                className="text-blue-500 hover:underline cursor-pointer self-baseline"
              >
                {editRejectReason ? "Cancel" : "Edit"}
              </button>
            )}
            {editRejectReason ? (
              <>
                <textarea
                  autoFocus
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="__input h-32"
                ></textarea>
                <button
                  onClick={() => updateApplicationStatusHandler()}
                  className="__btn"
                >
                  Update Status
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600">Reason: {rejectReason}</p>
              </>
            )}
          </div>
        </Modal>
      )}
      <td className="text-left py-3 px-2">
        <div className="flex items-center justify-center gap-x-2">
          {showDropdown ? (
            <select
              value={applicationStatus}
              onChange={handleStatusChange}
              name="paymentPreference"
              className="border rounded-md outline-none py-0.5 px-2"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          ) : (
            <StatusBadge status={applicationData.status} />
          )}
        </div>
      </td>
      <td className="text-left py-3 px-2">
        <div className="flex gap-4 ml-2">
          {showViewModal &&
            (applicationData.type === "staff_application" ? (
              <StaffProfileModal
                staffId={applicationData.applicantId}
                onClose={() => setShowViewModal(false)}
              />
            ) : applicationData.type === "service_application" ? (
              <ServiceViewModal
                serviceId={applicationData.applicantId}
                onClose={() => setShowViewModal(false)}
              />
            ) : applicationData.type === "subscription_application" ? (
              <SubscriberViewModal
                subscriberId={applicationData.applicantId}
                onClose={() => setShowViewModal(false)}
              />
            ) : applicationData.type === "seller_application" ? (
              <SellerProfileModal
                sellerId={applicationData.applicantId}
                onClose={() => setShowViewModal(false)}
              />
            ) : (
              applicationData.type === "vip_card_application" && (
                <CustomerViewModal
                  customerId={applicationData.applicantId}
                  onClose={() => setShowViewModal(false)}
                />
              )
            ))}
          {showDropdown && (
            <button onClick={updateApplicationStatusHandler} title="Update">
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
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </button>
          )}
          <button
            title={showDropdown ? "Close" : "Update status"}
            onClick={() => {
              !showDropdown && setApplicationStatus(applicationData.status);
              setShowDropdown(!showDropdown);
            }}
          >
            {showDropdown ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
            )}
          </button>
          {applicationData.status === "rejected" && (
            <button
              title="View rejection reason"
              onClick={() => setShowRejectReasonModal(true)}
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </button>
          )}
          <button
            title="View"
            className="disabled:opacity-40"
            onClick={() => setShowViewModal(true)}
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
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
          <button
            title="Delete"
            onClick={deleteApplicationHandler}
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
      </td>
    </>
  );
}
