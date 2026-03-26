import DriverMessages from "../components/DriverMessages";
import DriverStats from "../components/DriverStats";
import DriverTable from "../components/DriverTable";
import DriverTableActions from "../components/DriverTableActions";
import { useDriverStore } from "../stores/driver";

export default function Driver() {
  const showInbox = useDriverStore((state) => state.showInbox)
  return (
    <section className="space-y-6">
      {/* <DriverStats /> */}
      <DriverTableActions />
      {showInbox && <DriverMessages />}
      <DriverTable />
    </section>
  )
}
