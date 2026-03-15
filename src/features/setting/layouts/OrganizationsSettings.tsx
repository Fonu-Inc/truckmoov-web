import { Outlet } from "react-router-dom";
import SettingsTab from "../components/SettingsTab";

export default function SettingsLayout() {
  return (
   <section className="space-y-6">
    <SettingsTab />
    <Outlet />
   </section>
  )
}
