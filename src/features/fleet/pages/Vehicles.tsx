import VehicleStats from "../components/VehicleStats";
import VehicleTable from "../components/VehicleTable";
import VehicleTableActionCard from "../components/VehicleTableActionCard";

export default function Vehicles() {
 return (
  <section className="space-y-6">
   <VehicleStats />
   <section className="space-y-6">
    <VehicleTableActionCard />
    <VehicleTable />
   </section>
  </section>
 )
}
