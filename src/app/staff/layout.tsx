import { StaffBlockedAppView } from "@/components/features/staff/StaffBlockedScreen";
import { decrypt } from "@/lib/session-core";
import { getStaffAuthRow } from "@/lib/session";
import { cookies } from "next/headers";

/**
 * Shared layout for every /staff/* route. When the logged-in staff account has
 * been blocked (staffs.isActiveStaff = false) every page shows the "Account
 * Blocked" screen instead of its content. The blocked screen's button logs the
 * staff out, so the login page is reachable again afterwards.
 */
export default async function StaffRouteLayout({ children }: { children: React.ReactNode }) {
  const session = await decrypt((await cookies()).get("session")?.value);

  if (session?.userId && session.role === "staff") {
    try {
      // Shared with verifyStaffSession() in the page: one staff lookup per render.
      const staff = await getStaffAuthRow(session.userId as string);

      if (staff && !staff.isActiveStaff) {
        return <StaffBlockedAppView name={staff.name} staffId={staff.staffId} />;
      }
    } catch (error) {
      console.error("staff layout block check failed:", error);
    }
  }

  return <>{children}</>;
}
