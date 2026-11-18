import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { enterprise } from "./stakeholders-data";

export default function EnterpriseAdmin() {
  return <StakeholderLayout data={enterprise} />;
}
