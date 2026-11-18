import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { operationsManager } from "./roles-data";

export default function OperationsManager() {
  return <StakeholderLayout data={operationsManager} />;
}
