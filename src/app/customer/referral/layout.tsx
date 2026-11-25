import { getCustomerReferralData } from "@/actions";
import ReferralShell from "./_components/ReferralShell";

// Reads the session cookie, so it must never be prerendered.
export const dynamic = "force-dynamic";

/**
 * The referral data is fetched here on the server and streamed with the page,
 * instead of the browser asking for it in a separate request after the page
 * has loaded and hydrated. The promise is NOT awaited, so the header and the
 * skeleton show immediately while the data arrives.
 */
export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return <ReferralShell initial={getCustomerReferralData()}>{children}</ReferralShell>;
}
