import { verifyStaffSession } from "@/actions";
import { getStaffPaymentHistory } from "@/actions/paymentRequestActions";
import { PaymentHistoryList } from "@/components/features/payments/StaffPaymentCards";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { PaymentDataType } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PaymentHistoryPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const paymentsRes = await getStaffPaymentHistory(userId);
  const paymentsList = (paymentsRes.success ? (paymentsRes.data ?? []) : []) as PaymentDataType[];

  return (
    <StaffLayout balance={0}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-24 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <Link href="/staff/payment" aria-label="Back" className="size-11 rounded-full bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={20} /></Link>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold">All Payment History</span>
            <span className="text-[12px] font-semibold text-[#5b6784]">Your all payment requests and transaction details</span>
          </span>
        </div>
        <PaymentHistoryList payments={paymentsList} />
      </div>
    </StaffLayout>
  );
}
