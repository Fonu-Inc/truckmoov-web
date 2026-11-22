import {
  Download, Plus, Search, SlidersHorizontal, UserCheck, Users, UsersRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TILE_CLASS = "rounded-2xl surface-sleek text-card-foreground";

// ponytail: packages/api has no driver-group endpoint (list/create/edit/delete
// groups, group membership, per-group violations) and FleetDriver carries no
// group field, so every value on this tab renders "-" and the actions only say
// so. Wire to packages/api when one lands.
const KPI_TILES = [
  {
    label: "Total Groups",
    icon: UsersRound,
    chip: "bg-primary/10",
    iconClass: "text-primary",
    valueClass: "",
  },
  {
    label: "Drivers Assigned",
    icon: UserCheck,
    chip: "bg-success/10",
    iconClass: "text-success",
    valueClass: " text-success",
  },
  {
    label: "Avg Group Size",
    icon: Users,
    chip: "bg-warning/10",
    iconClass: "text-warning",
    valueClass: " text-warning",
  },
];

function notifyUnavailable() {
  toast.info("Driver groups aren't available yet.");
}

/** `/drivers/groups` — the design app's Driver Groups tab. */
export default function DriverGroupsPage() {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  return (
    <>
      <PageHeader
        title="Driver Groups"
        description="Driver records, contact details, and driving activity."
        align="start"
        actions={(
          <Button
            variant="gradient"
            onClick={notifyUnavailable}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        )}
      />

      <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-0">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
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
                      <p className="text-sm text-muted-foreground truncate">{tile.label}</p>
                      <p className={`text-xl font-bold mt-1 truncate${tile.valueClass}`}>-</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`${TILE_CLASS} bg-card/50 border-border/50`}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display flex items-center gap-2">
                    <UsersRound className="h-5 w-5 text-primary" />
                    Driver Groups (-)
                  </h3>
                  <p className="text-sm text-muted-foreground">Organise drivers into groups for easier management.</p>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Search groups"
                    placeholder="Search groups by name or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={notifyUnavailable}
                  className="gap-2 bg-card/50 border-border/50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Drivers</TableHead>
                    <TableHead>Driver Violations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      -
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
