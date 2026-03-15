import MainHeader from "../components/MainHeader";
import MainSidebar from "../components/MainSidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="h-dvh bg-background flex">
      <MainSidebar />
      <section className="h-dvh flex-1 flex flex-col overflow-hidden">
        <MainHeader />
        <main className="bg-card flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
