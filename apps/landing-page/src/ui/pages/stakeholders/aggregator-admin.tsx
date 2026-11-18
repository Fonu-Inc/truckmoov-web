import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { aggregator } from "./stakeholders-data";

export default function AggregatorAdmin() {
  return <StakeholderLayout data={aggregator} />;
}
