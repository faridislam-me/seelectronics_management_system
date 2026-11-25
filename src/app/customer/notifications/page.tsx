import { getCustomerNotifications } from "@/actions/customerActions";
import { getCustomerNotices } from "@/actions/noticeActions";
import NotificationsClient from "./NotificationsClient";

// Reads the session cookie, so it must never be prerendered.
export const dynamic = "force-dynamic";

/**
 * Both lists are fetched here on the server, in parallel, and streamed with the
 * page. Before, the browser requested them after hydration as server actions,
 * which run one at a time and queued behind the header/bottom-nav requests, so
 * the feed waited for 4-5 sequential round-trips.
 */
export default function CustomerNotificationsPage() {
  const data = Promise.all([getCustomerNotifications(), getCustomerNotices()]);
  return <NotificationsClient data={data} />;
}
