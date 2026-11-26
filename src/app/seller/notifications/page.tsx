import { getSellerNotifications, verifySellerSession } from "@/actions/sellerActions";
import { redirect } from "next/navigation";
import SellerNotificationsClient from "./SellerNotificationsClient";

// Reads the session cookie, so it must never be prerendered.
export const dynamic = "force-dynamic";

/**
 * The list is fetched on the server and streamed with the page. Before, the
 * browser requested it after hydration as a server action, queued behind the
 * header's unread-count request, so the feed sat on its skeleton for several
 * sequential round-trips. A blocked / logged-out seller is now sent to the
 * blocked / login screen like every other seller page, instead of seeing an
 * empty "All Caught Up" feed.
 */
export default async function SellerNotificationsPage() {
  const session = await verifySellerSession();
  if (!session.isAuth) redirect("isBlocked" in session && session.isBlocked ? "/seller/blocked" : "/seller/login");

  const data = getSellerNotifications();
  return <SellerNotificationsClient data={data} />;
}
