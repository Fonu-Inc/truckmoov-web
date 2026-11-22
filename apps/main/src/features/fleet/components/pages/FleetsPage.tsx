import {
  Boxes,
  Download,
  Layers,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TILE_CLASS = "rounded-2xl surface-sleek text-card-foreground";

// ponytail: packages/api has no fleet-group endpoint (list/create/edit/delete
// fleets, fleet membership, per-fleet violations), so every value on this tab
// renders "-" and the actions only explain that. Wire to packages/api when one lands.
const KPI_TILES = [
  {
    label: "Total Fleets",
    icon: Boxes,
    chip: "bg-primary/10",
    iconClass: "text-primary",
  },
  {
    label: "Vehicles Assigned",
    icon: Truck,
    chip: "bg-success/10",
    iconClass: "text-success",
  },
  {
    label: "Avg Vehicles / Fleet",
    icon: Layers,
    chip: "bg-warning/10",
    iconClass: "text-warning",
  },
  {
    label: "Unassigned Vehicles",
    icon: ShieldAlert,
    chip: "bg-muted",
    iconClass: "text-muted-foreground",
  },
];

function notifyUnavailable() {
  toast.info("Fleets aren't available yet.");
}

/** `/fleet/fleets` — the design app's Fleets tab. */
export default function FleetsPage() {
  // ponytail: same aggregator gating as VehiclesPage's write actions
  const isAggregatorAdmin = useAuthStore(s => s.user?.role) === "AGGREGATOR_ADMIN";
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  return (
    <>
      <PageHeader
        title="Fleets"
        description="Vehicle records, fleet membership, and operational details."
        actions={!isAggregatorAdmin && (
          <Button onClick={notifyUnavailable}>
            <Plus className="mr-2 h-4 w-4" />
            Create Fleet
          </Button>
        )}
      />

      <div className="mt-3 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {KPI_TILES.map(tile => (
              <div
                key={tile.label}
                className={TILE_CLASS}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.chip} shrink-0`}>
                      <tile.icon className={`h-5 w-5 ${tile.iconClass}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">{tile.label}</p>
                      <p className="text-xl font-bold mt-1 truncate">-</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={TILE_CLASS}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    Fleets (-)
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Group your vehicles into fleets for easier management and reporting.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={notifyUnavailable}
                  className="bg-transparent border-input"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search fleets by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={notifyUnavailable}
                  className="bg-card/50 border-border/50 relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-6 font-medium">Fleet</th>
                      <th className="pb-3 pr-6 font-medium">Description</th>
                      <th className="pb-3 pr-6 font-medium">Vehicles</th>
                      <th className="pb-3 pr-6 font-medium">Violations</th>
                      <th className="pb-3 pr-6 font-medium">Created</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
