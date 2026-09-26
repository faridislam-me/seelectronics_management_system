"use client";

import SupportScreen from "@/components/features/shared/SupportScreen";
import { StaffLayout } from "@/components/layout/StaffLayout";

export default function SupportPage() {
  return (
    <StaffLayout balance={0}>
      <SupportScreen ticketHref="/staff/complaints" />
    </StaffLayout>
  );
}
