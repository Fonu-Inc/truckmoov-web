import StakeholderLayout from "@/ui/components/stakeholder-layout/stakeholder-layout";
import { viewer } from "./roles-data";

export default function Viewer() {
  return <StakeholderLayout data={viewer} />;
}
