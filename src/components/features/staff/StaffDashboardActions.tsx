"use client";

import { useState } from "react";
import PaymentRequestModal from "./PaymentRequestModal";

interface StaffDashboardActionsProps {
  staffId: string;
  serviceId: string;
  className?: string;
  children?: React.ReactNode;
}

export default function StaffDashboardActions({
  staffId,
  serviceId,
  className,
  children,
}: StaffDashboardActionsProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPaymentModal(true)}
        className={className ?? "text-green-600 hover:text-green-800 text-sm font-bold underline underline-offset-2"}
      >
        {children ?? "Request Payment"}
      </button>

      {showPaymentModal && (
        <PaymentRequestModal
          staffId={staffId}
          serviceId={serviceId}
          onClose={() => setShowPaymentModal(false)}
        />
        
      )}
    </>
  );
}
