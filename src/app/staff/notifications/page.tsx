import { verifyStaffSession } from "@/actions";
import { StaffLayout } from "@/components/layout";
import StaffNotificationList from "@/components/features/notifications/StaffNotificationList";

export default async function StaffNotificationsPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  return (
    <StaffLayout>
      <div className="max-w-2xl mx-auto">
        <StaffNotificationList />
      </div>
    </StaffLayout>
  );
}
