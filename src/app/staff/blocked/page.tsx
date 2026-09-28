import { StaffBlockedAppView } from "@/components/features/staff/StaffBlockedScreen";

/**
 * Landing page for a staff account that was blocked while logged in. The staff
 * layout renders the blocked screen with the staff's name and ID when the
 * session is still present; this fallback covers an already-cleared session.
 */
export default function StaffBlockedPage() {
  return <StaffBlockedAppView name={null} staffId={null} />;
}
