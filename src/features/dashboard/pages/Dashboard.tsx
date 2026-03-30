import OpsKpiCards from "../components/OpsKpiCards";
import QuickActions from "../components/QuickActions";
import DispatchBoard from "../components/DispatchBoard";
import DeliveryMetricsCard from "../components/DeliveryMetricsCard";
import ExportCard from "../components/ExportCard";

export default function Dashboard() {
 return (
  <section className="space-y-6">
   <OpsKpiCards />
   <QuickActions />
   <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <DispatchBoard />
    <DeliveryMetricsCard />
   </div>
   <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <ExportCard />
   </div>
  </section>
 );
}
