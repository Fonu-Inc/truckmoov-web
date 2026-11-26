import type { DriverGroup } from "@truckmoov/api/fleet";
import {
  useCreateDriverGroup,
  useDeleteDriverGroup,
  useDriverGroups,
  useDrivers,
  useUpdateDriverGroup,
} from "@truckmoov/api/fleet";
import {
  Eye, Pencil, Plus, Search, SlidersHorizontal, Trash2, UserCheck, Users, UsersRound,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import { Textarea } from "@/components/shadcn/textarea";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { DriverGroupDetailsDialog } from "@/features/drivers/components/ui/DriverGroupDetailsDialog";
import { PageHeader } from "@/shared/components/layout/PageHeader";

const TILE_CLASS = "rounded-2xl surface-sleek text-card-foreground";

type GroupSize = "small" | "medium" | "large";
const SIZES: GroupSize[] = [
  "small",
  "medium",
  "large",
];
const SIZE_HINT: Record<GroupSize, string> = {
  small: "(≤3)", medium: "(4-7)", large: "(8+)",
};

function sizeBucket(count: number): GroupSize {
  if (count <= 3)
    return "small";
  return count <= 7 ? "medium" : "large";
}

function onError(error: { message: string }) {
  toast.error(error.message);
}

/** `/drivers/groups` — the design app's Driver Groups tab. */
export default function DriverGroupsPage() {
  const role = useAuthStore(s => s.user?.role);
  // The server lets these roles change groups; others only see them.
  const mayManage = role === "ENTERPRISE_ADMIN" || role === "OWNER_OPERATOR" || role === "OPERATIONS_MANAGER";

  const groupsQuery = useDriverGroups();
  const driversQuery = useDrivers();
  const createGroup = useCreateDriverGroup();
  const updateGroup = useUpdateDriverGroup();
  const deleteGroup = useDeleteDriverGroup();

  const groups = useMemo(
    () => groupsQuery.data?.data ?? [],
    [groupsQuery.data],
  );
  const drivers = useMemo(
    () => driversQuery.data?.data ?? [],
    [driversQuery.data],
  );

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    sizeFilter,
    setSizeFilter,
  ] = useState<GroupSize[]>([]);
  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);
  const [
    editing,
    setEditing,
  ] = useState<DriverGroup | null>(null);
  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<DriverGroup | null>(null);
  const [
    detailsId,
    setDetailsId,
  ] = useState<string | null>(null);
  const [
    name,
    setName,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    driverIds,
    setDriverIds,
  ] = useState<string[]>([]);
  const [
    driverSearch,
    setDriverSearch,
  ] = useState("");
  const [
    violationsEnabled,
    setViolationsEnabled,
  ] = useState(false);

  const driverNameById = useMemo(
    () => new Map(drivers.map(d => [
      d.id,
      d.name,
    ])),
    [drivers],
  );

  const q = search.toLowerCase();
  const filteredGroups = groups.filter(g =>
    (g.name.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q))
    && (sizeFilter.length === 0 || sizeFilter.includes(sizeBucket(g.driverCount))));

  const loaded = !groupsQuery.isLoading;
  const kpis = [
    {
      label: "Total Groups", value: groups.length, icon: UsersRound, chip: "bg-primary/10", iconClass: "text-primary", valueClass: "",
    },
    {
      label: "Drivers Assigned",
      value: new Set(groups.flatMap(g => g.driverIds)).size,
      icon: UserCheck,
      chip: "bg-success/10",
      iconClass: "text-success",
      valueClass: " text-success",
    },
    {
      label: "Avg Group Size",
      value: groups.length ? Math.round(groups.reduce(
        (sum, g) => sum + g.driverCount,
        0,
      ) / groups.length) : 0,
      icon: Users,
      chip: "bg-warning/10",
      iconClass: "text-warning",
      valueClass: " text-warning",
    },
  ];

  const resetForm = () => {
    setName("");
    setDescription("");
    setDriverIds([]);
    setDriverSearch("");
    setViolationsEnabled(false);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (group: DriverGroup) => {
    setEditing(group);
    setName(group.name);
    setDescription(group.description ?? "");
    setDriverIds(group.driverIds);
    setViolationsEnabled(group.violationsEnabled);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const data = {
      name: name.trim(), description: description.trim() || null, driverIds, violationsEnabled,
    };
    const onSuccess = () => {
      toast.success(editing ? "Driver group updated" : "Driver group created");
      setIsFormOpen(false);
      resetForm();
    };
    if (editing) {
      updateGroup.mutate(
        {
          id: editing.id, data,
        },
        {
          onSuccess, onError,
        },
      );
    }
    else {
      createGroup.mutate(
        { data },
        {
          onSuccess, onError,
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget)
      return;
    deleteGroup.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => toast.success("Driver group deleted"),
        onError,
        onSettled: () => setDeleteTarget(null),
      },
    );
  };

  // A driver can only belong to one group; block drivers already assigned elsewhere.
  const groupOf = (driverId: string) => groups.find(g => g.id !== editing?.id && g.driverIds.includes(driverId));

  const toggleDriver = (id: string) => {
    if (!driverIds.includes(id) && groupOf(id))
      return;
    setDriverIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [
      ...prev,
      id,
    ]));
  };

  const filteredDriverOptions = drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Driver Groups"
        description="Driver records, contact details, and driving activity."
        align="start"
        actions={mayManage && (
          <Button
            variant="gradient"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        )}
      />

      <div className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-0">
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {kpis.map(tile => (
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
                      {loaded
                        ? <p className={`text-xl font-bold mt-1 truncate${tile.valueClass}`}>{tile.value}</p>
                        : <Skeleton className="mt-1 h-7 w-12" />}
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
                    Driver Groups
                    {loaded ? ` (${filteredGroups.length})` : <Skeleton className="h-4 w-8" />}
                  </h3>
                  <p className="text-sm text-muted-foreground">Organise drivers into groups for easier management.</p>
                </div>
                <ExportButton
                  filename="driver-groups"
                  rows={filteredGroups}
                  columns={[
                    {
                      header: "Name", accessor: "name",
                    },
                    {
                      header: "Description", accessor: (g: DriverGroup) => g.description ?? "",
                    },
                    {
                      header: "Driver Count", accessor: (g: DriverGroup) => g.driverCount,
                    },
                    {
                      header: "Driver Violations", accessor: (g: DriverGroup) => (g.violationsEnabled ? "Enabled" : "Disabled"),
                    },
                    {
                      header: "Created", accessor: (g: DriverGroup) => new Date(g.createdAt).toLocaleDateString(),
                    },
                    {
                      header: "Drivers", accessor: (g: DriverGroup) => g.driverIds.map(id => driverNameById.get(id) || id).join("; "),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Search groups"
                    placeholder="Search groups by name or description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 bg-card/50 border-border/50"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {sizeFilter.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1"
                        >
                          {sizeFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-56"
                    align="end"
                  >
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Group size</p>
                      {SIZES.map(size => (
                        <div
                          key={size}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`size-${size}`}
                            checked={sizeFilter.includes(size)}
                            onCheckedChange={checked => setSizeFilter(prev => (checked ? [
                              ...prev,
                              size,
                            ] : prev.filter(s => s !== size)))}
                          />
                          <Label
                            htmlFor={`size-${size}`}
                            className="text-sm font-normal capitalize"
                          >
                            {size}
                            {" "}
                            {SIZE_HINT[size]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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
                  {!loaded
                    ? Array.from(
                        { length: 4 },
                        (_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={6}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    : filteredGroups.length === 0
                      ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-8"
                            >
                              {groupsQuery.isError ? "We couldn't load driver groups." : "No driver groups found."}
                            </TableCell>
                          </TableRow>
                        )
                      : filteredGroups.map(group => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="max-w-[320px] truncate text-muted-foreground">{group.description || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {group.driverCount}
                                {" "}
                                driver
                                {group.driverCount === 1 ? "" : "s"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={group.violationsEnabled ? "default" : "outline"}>{group.violationsEnabled ? "Enabled" : "Disabled"}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {new Date(group.createdAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                                },
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailsId(group.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                {mayManage && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Edit ${group.name}`}
                                      onClick={() => openEdit(group)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Delete ${group.name}`}
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setDeleteTarget(group)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <DriverGroupDetailsDialog
        group={groups.find(g => g.id === detailsId) ?? null}
        groups={groups}
        drivers={drivers}
        mayManage={mayManage}
        onClose={() => setDetailsId(null)}
      />

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open)
            resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver Group" : "New Driver Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label
                htmlFor="group-name"
                required
              >
                Group Name
              </Label>
              <Input
                id="group-name"
                value={name}
                maxLength={80}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lagos Mainland Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={description}
                maxLength={240}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this group"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Assign Drivers (
                {driverIds.length}
                {" "}
                selected)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={e => setDriverSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-56 border rounded-md p-2">
                <div className="space-y-1">
                  {filteredDriverOptions.map((driver) => {
                    const other = groupOf(driver.id);
                    return (
                      <div
                        key={driver.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded ${other ? "opacity-60" : "hover:bg-muted/50"}`}
                      >
                        <Checkbox
                          id={`driver-${driver.id}`}
                          disabled={Boolean(other)}
                          checked={driverIds.includes(driver.id)}
                          onCheckedChange={() => toggleDriver(driver.id)}
                        />
                        <Label
                          htmlFor={`driver-${driver.id}`}
                          className={`text-sm font-normal flex-1 ${other ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {driver.name}
                        </Label>
                        {other
                          ? (
                              <Badge
                                variant="outline"
                                className="rounded-full text-[10px] text-muted-foreground"
                              >
                                In
                                {" "}
                                {other.name}
                              </Badge>
                            )
                          : <span className="text-xs text-muted-foreground">{driver.phone}</span>}
                      </div>
                    );
                  })}
                  {filteredDriverOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No drivers match your search</p>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="group-violations">Enable Driver Violations</Label>
                <p className="text-xs text-muted-foreground">Track and report violations for drivers in this group.</p>
              </div>
              <Switch
                id="group-violations"
                checked={violationsEnabled}
                onCheckedChange={setViolationsEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={createGroup.isPending || updateGroup.isPending}
              onClick={handleSubmit}
            >
              {editing ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Driver Group</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "
            {deleteTarget?.name}
            "? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteGroup.isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
