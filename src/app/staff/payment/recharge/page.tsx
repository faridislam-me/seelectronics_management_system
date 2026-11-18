import { verifyStaffSession } from "@/actions";
import { getStaffAvailableBalance } from "@/actions/staffActions";
import StaffRechargeFlow from "./StaffRechargeFlow";
import { StaffLayout } from "@/components/layout/StaffLayout";

export const dynamic = "force-dynamic";

export default async function StaffRechargePage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  // Recharges are paid from the staff's main available balance (same source as
  // the rest of the staff app), matching the recharge action's own check.
  const balanceRes = await getStaffAvailableBalance(session.userId as string);
  const balance = balanceRes.success ? balanceRes.balance : 0;

  return (
    <StaffLayout balance={balance}>
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] px-2 pt-2 pb-2">
        <StaffRechargeFlow initialBalance={balance} />
      </div>
    </StaffLayout>
  );
}
