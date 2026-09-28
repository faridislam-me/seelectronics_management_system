import { verifyStaffSession } from "@/actions";
import { getStaffProfileStats } from "@/actions/staffActions";
import SMSSettingsForm from "@/components/features/staff/SMSSettingsForm";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { db } from "@/db/drizzle";
import { staffs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function StaffSettingsPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  const userId = session.userId as string;
  const staffData = await db.query.staffs.findFirst({
    where: eq(staffs.staffId, userId),
  });

  if (!staffData) redirect("/staff/login");

  const statsRes = await getStaffProfileStats(userId);
  const stats = statsRes.success ? statsRes.data : null;

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      <div className="px-2 pt-2 pb-2">
        <SMSSettingsForm
          initialData={{
            smsNotificationEnabled: staffData.smsNotificationEnabled,
            smsWorkingHoursOnly: staffData.smsWorkingHoursOnly,
            smsFrequency: staffData.smsFrequency as any,
            smsOptOut: staffData.smsOptOut,
          }}
        />
      </div>
    </StaffLayout>
  );
}
