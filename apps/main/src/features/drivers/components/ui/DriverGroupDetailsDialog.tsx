import type {
  DriverGroup, FleetDriver,
} from "@truckmoov/api/fleet";
import type { DriverRow } from "@/features/drivers/utils/driverRows";
import type { CheckboxFilterValue } from "@/features/fleet/utils/checkboxFilter";
import type { Driver } from "@/types";
import { useUpdateDriverGroup } from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  Ban, CalendarDays, Eye, MoreHorizontal, Search, ShieldAlert, UserCheck, UserPlus, Users, UsersRound, UserX,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { DriverDetailsSheet } from "@/components/drivers/DriverDetailsSheet";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Progress } from "@/components/shadcn/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { getPerformanceBand } from "@/features/drivers/utils/driverPerformance";
import {
  driverScore, toDriverRow, toLocalDriver,
} from "@/features/drivers/utils/driverRows";
import { CheckboxGroupsFilter } from "@/features/fleet/components/ui/CheckboxGroupsFilter";
import { passesFilter } from "@/features/fleet/utils/checkboxFilter";
import { cn } from "@/lib/utils";

const CARD_CLASS = "rounded-2xl surface-sleek text-card-foreground";
const PERFORMANCE_BANDS = [
  "Excellent",
  "Strong",
  "Fair",
  "Needs review",
  "Unscored",
];

const statusColors: Record<string, string> = {
  available: "bg-success/10 text-success",
  active: "bg-primary/10 text-primary",
  offline: "bg-muted text-muted-foreground",
  suspended: "bg-destructive/10 text-destructive",
};

function channelOf(d: DriverRow) {
  return String(d.preferredChannel ?? d.communicationPreference ?? "");
}

function bandLabel(score: number | null) {
  return score === null ? "Unscored" : getPerformanceBand(score).label;
}

/** View Details on the Driver Groups tab: the group's drivers, with add and a profile view. */
export function DriverGroupDetailsDialog({
  group, groups, drivers, mayManage, onClose,
}: {
  group: DriverGroup | null;
  groups: DriverGroup[];
  drivers: FleetDriver[];
  mayManage: boolean;
  onClose: () => void;
}) {
  const [
    query,
    setQuery,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    filters,
    setFilters,
  ] = useState<CheckboxFilterValue>({});
  const [
    selected,
    setSelected,
  ] = useState<Driver | null>(null);
  const [
    addOpen,
    setAddOpen,
  ] = useState(false);
  const [
    picked,
    setPicked,
  ] = useState<string[]>([]);
  const [
    addQuery,
    setAddQuery,
  ] = useState("");
  const updateGroup = useUpdateDriverGroup();

  const rows = useMemo(
    () => drivers.map(toDriverRow),
    [drivers],
  );
  const members = useMemo(
    () => rows.filter(d => group?.driverIds.includes(d.id)),
    [
      rows,
      group,
    ],
  );
  const channels = useMemo(
    () => [...new Set(members.map(channelOf).filter(Boolean))].sort(),
    [members],
  );

  const q = query.toLowerCase();
  const filtered = members.filter(d =>
    `${d.name} ${d.phone} ${d.email ?? ""} ${d.licenseNumber}`.toLowerCase().includes(q)
    && (status === "all" || d.status === status)
    && passesFilter(
      filters,
      "Preferred Channel",
      channelOf(d),
    )
    && passesFilter(
      filters,
      "Performance",
      bandLabel(driverScore(d)),
    ));

  const count = (s: string) => members.filter(d => d.status === s).length;
  const kpis = [
    {
      label: "Total Drivers", value: members.length, icon: Users, tone: "bg-primary/10 text-primary",
    },
    {
      label: "Active", value: count("active"), icon: UserCheck, tone: "bg-success/10 text-success",
    },
    {
      label: "Offline", value: count("offline"), icon: UserX, tone: "bg-warning/10 text-warning",
    },
    {
      label: "Suspended", value: count("suspended"), icon: Ban, tone: "bg-muted text-muted-foreground",
    },
  ];

  const reset = () => {
    setQuery("");
    setStatus("all");
    setFilters({});
  };

  // A driver can only belong to one group; show membership and block re-assignment.
  const groupOf = (driverId: string) => groups.find(g => g.id !== group?.id && g.driverIds.includes(driverId));
  const aq = addQuery.toLowerCase();
  const candidates = rows.filter(d => !group?.driverIds.includes(d.id) && `${d.name} ${d.phone}`.toLowerCase().includes(aq));

  const confirmAdd = () => {
    if (!group || !picked.length)
      return;
    const addable = picked.filter(id => !groupOf(id));
    if (!addable.length) {
      toast.error("Selected drivers already belong to another group");
      return;
    }
    updateGroup.mutate(
      {
        id: group.id, data: {
          driverIds: [
            ...group.driverIds,
            ...addable,
          ],
        },
      },
      {
        onSuccess: () => {
          toast.success(`${addable.length} driver${addable.length === 1 ? "" : "s"} added to ${group.name}`);
          setAddOpen(false);
          setPicked([]);
          setAddQuery("");
        },
        onError: (error: { message: string }) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <>
      <Dialog
        open={Boolean(group)}
        onOpenChange={(o) => {
          if (!o) {
            onClose();
            reset();
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <UsersRound className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block truncate">{group?.name}</span>
                <span className="block text-sm font-normal text-muted-foreground truncate">{group?.description || "Group overview and assigned drivers"}</span>
              </div>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full gap-1",
                    group?.violationsEnabled ? "border-success/40 text-success" : "text-muted-foreground",
                  )}
                >
                  <ShieldAlert className="h-3 w-3" />
                  {" "}
                  Driver Violations
                  {" "}
                  {group?.violationsEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full gap-1 text-muted-foreground"
                >
                  <CalendarDays className="h-3 w-3" />
                  {" "}
                  Created
                  {" "}
                  {group ? new Date(group.createdAt).toLocaleDateString() : "-"}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          {mayManage && (
            <div className="flex justify-end">
              <Button
                className="rounded-xl gap-2"
                onClick={() => {
                  setPicked([]);
                  setAddQuery("");
                  setAddOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />
                {" "}
                Add Driver
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(k => (
              <div
                key={k.label}
                className={CARD_CLASS}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    k.tone,
                  )}
                  >
                    <k.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{k.label}</p>
                    <p className="text-xl font-semibold truncate">{k.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={CARD_CLASS}>
            <div className="flex flex-col p-6 pb-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold leading-none tracking-tight">Group Drivers</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">All drivers in this group. Search, filter or open a driver's profile.</p>
                </div>
                <ExportButton
                  filename="group-drivers"
                  rows={filtered}
                  columns={[
                    {
                      header: "Driver", accessor: "name",
                    },
                    {
                      header: "Phone Number", accessor: "phone",
                    },
                    {
                      header: "Email", accessor: d => d.email ?? "",
                    },
                    {
                      header: "License", accessor: "licenseNumber",
                    },
                    {
                      header: "Status", accessor: d => d.status ?? "",
                    },
                    {
                      header: "Performance Score",
                      accessor: (d) => {
                        const score = driverScore(d);
                        return score === null ? "Unscored" : `${Math.round(score)}%`;
                      },
                    },
                    {
                      header: "Trips", accessor: d => d.trips ?? 0,
                    },
                    {
                      header: "Preferred Channel", accessor: d => channelOf(d),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search group drivers"
                    placeholder="Search by name, phone, email or license..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger className="w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <CheckboxGroupsFilter
                  value={filters}
                  onChange={setFilters}
                  groups={[
                    {
                      title: "Preferred Channel", options: channels,
                    },
                    {
                      title: "Performance", options: PERFORMANCE_BANDS,
                    },
                  ]}
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      {[
                        "Driver",
                        "Phone Number",
                        "Email",
                        "License",
                        "Status",
                        "Performance Score",
                        "Trips",
                        "Preferred Channel",
                      ].map(h => (
                        <th
                          key={h}
                          className="pb-3 pr-6 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((d) => {
                      const score = driverScore(d);
                      const band = score === null ? null : getPerformanceBand(score);
                      return (
                        <tr
                          key={d.id}
                          className="transition-colors hover:bg-secondary/30"
                        >
                          <td className="py-4 pr-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {d.name.split(" ").map(n => n[0]).join("").slice(
                                  0,
                                  2,
                                )}
                              </div>
                              <span className="font-medium text-sm">{d.name}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-6 text-sm">{d.phone}</td>
                          <td className="py-4 pr-6 text-muted-foreground max-w-[160px] truncate">{d.email || "-"}</td>
                          <td className="py-4 pr-6">
                            <p className="font-mono">{d.licenseNumber}</p>
                            {d.licenseExpiryDate && (
                              <p className="text-[11px] text-muted-foreground">
                                Exp:
                                {" "}
                                {format(
                                  new Date(d.licenseExpiryDate),
                                  "MMM dd, yyyy",
                                )}
                              </p>
                            )}
                          </td>
                          <td className="py-4 pr-6">
                            <span className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                              statusColors[d.status ?? ""] ?? "bg-muted text-muted-foreground",
                            )}
                            >
                              {d.status ?? "-"}
                            </span>
                          </td>
                          <td className="py-4 pr-6">
                            {score === null || !band
                              ? <span className="text-muted-foreground">Unscored</span>
                              : (
                                  <div className="min-w-[110px] space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-sm font-semibold">
                                        {Math.round(score)}
                                        %
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] ${band.className}`}
                                      >
                                        {band.label}
                                      </Badge>
                                    </div>
                                    <Progress
                                      value={score}
                                      className="h-1.5"
                                    />
                                  </div>
                                )}
                          </td>
                          <td className="py-4 pr-6">{d.trips ?? 0}</td>
                          <td className="py-4 pr-6 capitalize">{channelOf(d) || "-"}</td>
                          <td className="py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${d.name}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelected(toLocalDriver(d))}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-30" />
                    <p>{members.length ? "No drivers found" : "No drivers assigned to this group"}</p>
                    {members.length > 0 && <p className="text-sm">Try adjusting your search or filters</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DriverDetailsSheet
        open={Boolean(selected)}
        onOpenChange={(o) => {
          if (!o)
            setSelected(null);
        }}
        driver={selected}
      />

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Driver to
              {" "}
              {group?.name}
            </DialogTitle>
            <DialogDescription>Select from your existing drivers. A driver can only belong to one group.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl"
              placeholder="Search drivers..."
              value={addQuery}
              onChange={e => setAddQuery(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border p-2">
            {candidates.length === 0
              ? <p className="py-6 text-center text-sm text-muted-foreground">No other drivers available.</p>
              : candidates.map((d) => {
                  const other = groupOf(d.id);
                  return (
                    <label
                      key={d.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-2",
                        other ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer",
                      )}
                    >
                      <Checkbox
                        disabled={Boolean(other)}
                        checked={picked.includes(d.id)}
                        onCheckedChange={c => setPicked(p => (c ? [
                          ...p,
                          d.id,
                        ] : p.filter(x => x !== d.id)))}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.phone}</p>
                      </div>
                      {other && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] text-muted-foreground shrink-0"
                        >
                          In
                          {" "}
                          {other.name}
                        </Badge>
                      )}
                    </label>
                  );
                })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!picked.length || updateGroup.isPending}
              onClick={confirmAdd}
            >
              Add
              {" "}
              {picked.length || ""}
              {" "}
              Driver
              {picked.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
