import { StaffLayout } from "@/components/layout";
import EmergencyCallScreen from "@/components/features/shared/EmergencyCallScreen";

export default function JoruriSebaPage() {
  return (
    <StaffLayout balance={0}>
      <EmergencyCallScreen />
    </StaffLayout>
  );
}
