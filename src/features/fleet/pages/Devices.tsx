import DeviceActionBar from "../components/DeviceActionBar";
import DeviceStats from "../components/DeviceStats";
import DeviceTable from "../components/DeviceTable";

export default function Devices() {
  return (
    <section className="space-y-6">
     {/* <DeviceStats /> */}
     <DeviceActionBar />
     <DeviceTable />
    </section>
  )
}
