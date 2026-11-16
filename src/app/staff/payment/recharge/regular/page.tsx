import { verifyStaffSession } from "@/actions";
import { getStaffBalance } from "@/actions/paymentRequestActions";
import StaffRegularPackFlow from "../StaffRegularPackFlow";
import { StaffLayout } from "@/components/layout/StaffLayout";

export const dynamic = "force-dynamic";

export default async function StaffRegularPackPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const balanceRes = await getStaffBalance(session.userId as string);
  const balance = balanceRes.success ? balanceRes.balance : 0;

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2">
        <StaffRegularPackFlow initialBalance={balance} />
      </div>
    </StaffLayout>
  );
}
