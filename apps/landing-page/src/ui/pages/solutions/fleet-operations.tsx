import SolutionLayout from "@/ui/components/solution-layout/solution-layout";
import { fleetOperations } from "./solutions-data";

export default function FleetOperations() {
  return <SolutionLayout data={fleetOperations} />;
}
