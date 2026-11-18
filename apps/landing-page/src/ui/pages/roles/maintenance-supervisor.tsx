import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { maintenanceSupervisor } from "./roles-data";

export default function MaintenanceSupervisor() {
  return <StakeholderLayout data={maintenanceSupervisor} />;
}
