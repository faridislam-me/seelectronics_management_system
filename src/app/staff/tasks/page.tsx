import { verifyStaffSession } from "@/actions";
import { StaffLayout } from "@/components/layout/StaffLayout";
import StaffTaskList from "@/components/features/tasks/StaffTaskList";

export default async function StaffTasksPage() {
  const session = await verifyStaffSession();
  if (!session.isAuth) return null;

  return (
    <StaffLayout>
      <div>
        <StaffTaskList />
      </div>
    </StaffLayout>
  );
}
