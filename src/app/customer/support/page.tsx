"use client";

import { CustomerLayout } from "@/components";
import SupportScreen from "@/components/features/shared/SupportScreen";

export default function SupportPage() {
  return (
    <CustomerLayout>
      <SupportScreen ticketHref="/customer/complain" />
    </CustomerLayout>
  );
}
