export const dynamic = "force-dynamic";

import { DashboardLayout } from "@/components/layout";
import { verifySession } from "@/lib";
import { getSMSBalance } from "@/lib/sms";

export default async function Layout({ children }: { children: React.ReactNode }) {
  // The SMS gateway balance is an external HTTP call; start it alongside the
  // session check instead of after it. It never throws (returns null on error)
  // and middleware already keeps non-admins off these routes.
  const [session, smsBalance] = await Promise.all([
    verifySession(true, "admin"),
    getSMSBalance(),
  ]);

  return (
    <DashboardLayout
      username={(session?.username as string) || "Admin"}
      smsBalance={smsBalance}
    >
      {children}
    </DashboardLayout>
  );
}
