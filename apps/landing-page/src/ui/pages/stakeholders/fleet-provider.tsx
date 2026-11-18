import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { fleetProvider } from "./stakeholders-data";

export default function FleetProvider() {
  return <StakeholderLayout data={fleetProvider} />;
}
