import {
  Fuel, Leaf, TreePine, TrendingDown, Zap,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { useAuthStore } from "@/features/auth/stores/authStore";
import {
  canSeeTab, SUSTAINABILITY_TABS,
} from "@/features/sustainability/utils/sustainabilityNav";
import { cn } from "@/lib/utils";

/**
 * Sustainability shell, mounted as a pathful layout route at `/sustainability`.
 * Owns the page header, top KPI strip and tab bar; each tab renders into the
 * `Outlet`. Modelled on PayoutsInvoicingLayout / SettingsLayout.
 */
export function SustainabilityLayout() {
  const role = useAuthStore(s => s.user?.role);
  const visibleTabs = SUSTAINABILITY_TABS.filter(tab => canSeeTab(
    tab,
    role,
  ));

  // ponytail: KPI source is the shared stub — swap to a real hook when the
  // API lands; the layout keeps ownership then, so pages don't duplicate the strip.
  const totalCo2 = 0;
  const totalDistance = 0;
  const avgCo2PerKm = 0;
  const evCount = 0;
  const totalProfiled = 0;
  const evAdoptionProgress = totalProfiled > 0
    ? (evCount / totalProfiled) * 100
    : 0;
  const treesEquivalent = Math.round((totalCo2 * 12) / 22);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="h-6 w-6 text-success" />
            Sustainability Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your fleet's environmental impact and progress toward sustainability goals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">CO₂ Emitted (30d)</p>
                <p className="text-2xl font-bold">
                  {totalCo2.toFixed(1)}
                  {" "}
                  kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(totalCo2 / 1000).toFixed(2)}
                  {" "}
                  tonnes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <Fuel className="h-6 w-6 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Avg CO₂/km</p>
                <p className="text-2xl font-bold">
                  {(avgCo2PerKm * 1000).toFixed(0)}
                  {" "}
                  g/km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalDistance.toFixed(0)}
                  {" "}
                  km total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">EV/Zero Emission</p>
                <p className="text-2xl font-bold">
                  {evCount}
                  {" "}
                  /
                  {" "}
                  {totalProfiled}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {evAdoptionProgress.toFixed(1)}
                  % adoption
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <TreePine className="h-6 w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Trees to Offset</p>
                <p className="text-2xl font-bold">{treesEquivalent}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  trees/year equivalent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {visibleTabs.length > 1 && (
        <nav
          aria-label="Sustainability sections"
          className="bg-muted/50 text-muted-foreground inline-flex flex-wrap gap-1 h-auto rounded-md p-1"
        >
          {visibleTabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) => cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-150",
                "hover:text-foreground/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-background text-foreground shadow-sm border-b-2 border-primary",
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  );
}
