import { StaffBlockedAppView } from "@/components/features/staff/StaffBlockedScreen";
import { db } from "@/db/drizzle";
import { staffs } from "@/db/schema";
import { decrypt } from "@/lib/session-core";
import { eq } from "drizzle-orm";
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
      const [staff] = await db
        .select({ staffId: staffs.staffId, name: staffs.name, isActiveStaff: staffs.isActiveStaff })
        .from(staffs)
        .where(eq(staffs.staffId, session.userId as string))
        .limit(1);

      if (staff && !staff.isActiveStaff) {
        return <StaffBlockedAppView name={staff.name} staffId={staff.staffId} />;
      }
    } catch (error) {
      console.error("staff layout block check failed:", error);
    }
  }

  return <>{children}</>;
}
