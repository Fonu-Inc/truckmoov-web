import type { ColumnDef } from "@tanstack/react-table";
import type {
  SystemDeviceCatalogModel,
  SystemDeviceCatalogQuery,
} from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DEVICE_CATALOG_PROTOCOLS,
  getSystemDevicesCatalogExportQueryOptions,
  getSystemDevicesCatalogQueryOptions,
  getSystemDevicesSummaryQueryOptions,
  useCreateDeviceCatalogEntry,
  useDeleteDeviceCatalogEntry,
  useUpdateDeviceCatalogEntry,
} from "@truckmoov/api/auth";
import {
  AlertTriangle,
  BookOpen,
  Download,
  Edit,
  Fuel,
  Gauge,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

type CatalogStatusFilter = "all" | "supported" | "deprecated" | "blocked";
type DeviceFeature = "obd2" | "fuel" | "sos";

const DEVICE_CATALOG_FORM_ID = "device-catalog-form";
const EDIT_DEVICE_CATALOG_FORM_ID = "edit-device-catalog-form";
const DEVICE_FEATURE_OPTIONS: Array<{
  value: DeviceFeature;
  label: string;
  icon: typeof Gauge;
}> = [
  {
    value: "obd2",
    label: "OBD-II",
    icon: Gauge,
  },
  {
    value: "fuel",
    label: "Fuel",
    icon: Fuel,
  },
  {
    value: "sos",
    label: "SOS",
    icon: AlertTriangle,
  },
];
const protocolBadgeClass: Record<string, string> = {
  TCP: "border-info/30 bg-info/10 text-info hover:bg-info/10",
  HTTP: "border-success/30 bg-success/10 text-success hover:bg-success/10",
  MQTT: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10",
  UDP: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/10",
};
const statusBadgeClass: Record<string, string> = {
  supported: "border-success/40 bg-success/15 text-success hover:bg-success/15",
  deprecated: "border-warning/40 bg-warning/15 text-warning hover:bg-warning/15",
  blocked: "border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/15",
};
const statusLabel: Record<string, string> = {
  supported: "Supported",
  deprecated: "Deprecated",
  blocked: "Blocked",
};
const featureIconClass: Record<string, string> = {
  obd2: "text-info",
  fuel: "text-warning",
  sos: "text-destructive",
};

const deviceCatalogFormSchema = z.object({
  manufacturer: z.string().trim().min(
    1,
    "Manufacturer is required.",
  ),
  model: z.string().trim().min(
    1,
    "Model is required.",
  ),
  protocolType: z.enum(DEVICE_CATALOG_PROTOCOLS),
  defaultPort: z.number().int().positive("Default port must be positive.").optional(),
  supportedFeatures: z.array(z.enum([
    "obd2",
    "fuel",
    "sos",
  ])),
  status: z.enum([
    "supported",
    "deprecated",
    "blocked",
  ]),
  configurationInstructions: z.string().optional(),
});

const editDeviceCatalogFormSchema = deviceCatalogFormSchema.omit({ status: true });

type DeviceCatalogFormValues = z.infer<typeof deviceCatalogFormSchema>;
type EditDeviceCatalogFormValues = z.infer<typeof editDeviceCatalogFormSchema>;

const defaultCatalogFormValues: DeviceCatalogFormValues = {
  manufacturer: "",
  model: "",
  protocolType: "TCP",
  defaultPort: undefined,
  supportedFeatures: [],
  status: "supported",
  configurationInstructions: "",
};
const defaultEditCatalogFormValues: EditDeviceCatalogFormValues = {
  manufacturer: "",
  model: "",
  protocolType: "TCP",
  defaultPort: undefined,
  supportedFeatures: [],
  configurationInstructions: "",
};

function getCatalogFormValues(model: SystemDeviceCatalogModel): EditDeviceCatalogFormValues {
  const protocolType = model.protocolType;
  const supportedFeatures = model.supportedFeatures.filter(
    (feature): feature is DeviceFeature => [
      "obd2",
      "fuel",
      "sos",
    ].includes(feature),
  );

  return {
    manufacturer: model.manufacturer,
    model: model.model,
    protocolType,
    defaultPort: model.defaultPort || undefined,
    supportedFeatures,
    configurationInstructions: model.configurationInstructions ?? "",
  };
}

export function DeviceCatalogManager() {
  const queryClient = useQueryClient();
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearchQuery,
    setDebouncedSearchQuery,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<CatalogStatusFilter>("all");
  const [
    createDialogOpen,
    setCreateDialogOpen,
  ] = useState(false);
  const [
    editingModel,
    setEditingModel,
  ] = useState<SystemDeviceCatalogModel | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const [
    statusDialogModel,
    setStatusDialogModel,
  ] = useState<SystemDeviceCatalogModel | null>(null);
  const [
    modelPendingDelete,
    setModelPendingDelete,
  ] = useState<SystemDeviceCatalogModel | null>(null);
  const [
    pendingStatus,
    setPendingStatus,
  ] = useState<"supported" | "deprecated" | "blocked">("supported");
  const createCatalogEntry = useCreateDeviceCatalogEntry();
  const updateCatalogEntry = useUpdateDeviceCatalogEntry();
  const deleteCatalogEntry = useDeleteDeviceCatalogEntry();
  const form = useForm<DeviceCatalogFormValues>({
    resolver: zodResolver(deviceCatalogFormSchema),
    defaultValues: defaultCatalogFormValues,
  });
  const editForm = useForm<EditDeviceCatalogFormValues>({
    resolver: zodResolver(editDeviceCatalogFormSchema),
    defaultValues: defaultEditCatalogFormValues,
  });

  useEffect(
    () => {
      const timer = setTimeout(
        setDebouncedSearchQuery,
        400,
        searchQuery,
      );
      return () => clearTimeout(timer);
    },
    [searchQuery],
  );

  const searchParam = debouncedSearchQuery.trim();
  const catalogQueryPayload: SystemDeviceCatalogQuery | undefined
    = searchParam || statusFilter !== "all"
      ? {
          params: {
            ...(searchParam ? { search: searchParam } : {}),
            ...(statusFilter !== "all" ? { status: statusFilter } : {}),
          },
        }
      : undefined;
  const catalogQuery = useQuery(getSystemDevicesCatalogQueryOptions(catalogQueryPayload));
  const models = catalogQuery.data?.data.models ?? [];
  const summary = useQuery(getSystemDevicesSummaryQueryOptions()).data?.data;
  const catalogCounters = [
    {
      label: "Total", value: summary?.totalCatalogModels, className: "",
    },
    {
      label: "Supported", value: summary?.supportedCatalogModels, className: "text-success",
    },
    {
      label: "Deprecated", value: summary?.deprecatedCatalogModels, className: "text-warning",
    },
    {
      label: "Blocked", value: summary?.blockedCatalogModels, className: "text-destructive",
    },
  ];

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDevicesCatalogExportQueryOptions(catalogQueryPayload));
      const url = URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "device-catalog.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
    catch {
      toast.error("Export failed");
    }
    finally {
      setIsExporting(false);
    }
  }

  function handleCreateSubmit(values: DeviceCatalogFormValues) {
    createCatalogEntry.mutate(
      {
        data: {
          manufacturer: values.manufacturer,
          model: values.model,
          protocolType: values.protocolType,
          defaultPort: values.defaultPort,
          supportedFeatures: values.supportedFeatures,
          status: values.status,
          configurationInstructions: values.configurationInstructions?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Device model added");
          form.reset(defaultCatalogFormValues);
          setCreateDialogOpen(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleOpenEdit(model: SystemDeviceCatalogModel) {
    setEditingModel(model);
    editForm.reset(getCatalogFormValues(model));
  }

  function handleEditDialogOpenChange(open: boolean) {
    if (!open) {
      setEditingModel(null);
      editForm.reset(defaultEditCatalogFormValues);
    }
  }

  function handleEditSubmit(values: EditDeviceCatalogFormValues) {
    if (!editingModel) {
      return;
    }

    updateCatalogEntry.mutate(
      {
        id: editingModel.id,
        data: {
          manufacturer: values.manufacturer,
          model: values.model,
          protocolType: values.protocolType,
          defaultPort: values.defaultPort,
          supportedFeatures: values.supportedFeatures,
          configurationInstructions: values.configurationInstructions?.trim() ?? "",
        },
      },
      {
        onSuccess: () => {
          toast.success("Device model updated");
          setEditingModel(null);
          editForm.reset(defaultEditCatalogFormValues);
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleOpenStatusDialog(model: SystemDeviceCatalogModel) {
    setStatusDialogModel(model);
    setPendingStatus(model.status as "supported" | "deprecated" | "blocked");
  }

  function handleStatusSubmit() {
    if (!statusDialogModel) {
      return;
    }
    updateCatalogEntry.mutate(
      {
        id: statusDialogModel.id,
        data: { status: pendingStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Marked ${statusLabel[pendingStatus]}`);
          setStatusDialogModel(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleDeleteModel(model: SystemDeviceCatalogModel) {
    deleteCatalogEntry.mutate(
      { id: model.id },
      {
        onSuccess: () => toast.success("Device model deleted"),
        onError: error => toast.error(error.message),
      },
    );
  }

  const catalogColumns: ColumnDef<SystemDeviceCatalogModel>[] = [
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.manufacturer}</span>
      ),
    },
    {
      accessorKey: "model",
      header: "Model",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.model}</span>
      ),
    },
    {
      accessorKey: "protocolType",
      header: "Protocol",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`h-6 rounded-md px-2 text-xs font-bold ${
            protocolBadgeClass[row.original.protocolType] ?? "border-muted bg-muted text-muted-foreground"
          }`}
        >
          {row.original.protocolType}
        </Badge>
      ),
    },
    {
      accessorKey: "defaultPort",
      header: "Port",
      meta: { className: "px-5 text-muted-foreground" },
      cell: ({ row }) => row.original.defaultPort,
    },
    {
      accessorKey: "supportedFeatures",
      header: "Features",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.supportedFeatures.length > 0
            ? (
                row.original.supportedFeatures.map(feature => (
                  <span
                    key={feature}
                    title={DEVICE_FEATURE_OPTIONS.find(o => o.value === feature)?.label ?? feature}
                  >
                    {feature === "obd2"
                      ? (
                          <Gauge className={`h-4 w-4 ${featureIconClass[feature]}`} />
                        )
                      : feature === "fuel"
                        ? (
                            <Fuel className={`h-4 w-4 ${featureIconClass[feature]}`} />
                          )
                        : feature === "sos"
                          ? (
                              <AlertTriangle className={`h-4 w-4 ${featureIconClass[feature]}`} />
                            )
                          : null}
                  </span>
                ))
              )
            : (
                <span className="text-muted-foreground text-sm">Basic</span>
              )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`h-6 rounded-md px-2 text-xs font-bold ${
            statusBadgeClass[row.original.status] ?? "border-muted bg-muted text-muted-foreground"
          }`}
        >
          {statusLabel[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[56px] px-5 text-right" },
      cell: ({ row }) => {
        const model = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44"
            >
              <DropdownMenuItem onClick={() => handleOpenEdit(model)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={updateCatalogEntry.isPending}
                onClick={() => handleOpenStatusDialog(model)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Status…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={deleteCatalogEntry.isPending}
                onClick={() => setModelPendingDelete(model)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device Model
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Device Catalog
              </CardTitle>
              <CardDescription>
                Manage supported device manufacturers and models
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {catalogCounters.map(stat => (
              <div
                key={stat.label}
                className="rounded-lg border bg-card p-3"
              >
                <p className={`text-2xl font-bold ${stat.className}`}>{stat.value ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search manufacturer or model..."
                className="pl-10"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={value => setStatusFilter(value as CatalogStatusFilter)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="supported">Supported</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <DataTable
              columns={catalogColumns}
              data={models}
              isLoading={catalogQuery.isLoading}
              isError={catalogQuery.isError}
              errorMessage="Unable to load the device catalog."
              onRetry={() => catalogQuery.refetch()}
              hasActiveFilters={!!searchParam || statusFilter !== "all"}
              emptyState="No device models in the catalog yet."
              filteredEmptyState="No device models match your filters."
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Add Device Model</DialogTitle>
            <DialogDescription>
              Add a new device model to the catalog.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              id={DEVICE_CATALOG_FORM_ID}
              onSubmit={form.handleSubmit(handleCreateSubmit)}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Teltonika"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., FMC130"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="protocolType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol Type</FormLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEVICE_CATALOG_PROTOCOLS.map(protocol => (
                            <SelectItem
                              key={protocol}
                              value={protocol}
                            >
                              {protocol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 5001"
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value ? Number(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supportedFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supported Features</FormLabel>
                    <div className="flex flex-wrap gap-5">
                      {DEVICE_FEATURE_OPTIONS.map(({
                        value,
                        label,
                        icon: Icon,
                      }) => (
                        <FormItem
                          key={value}
                          className="flex items-center gap-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value.includes(value)}
                              onCheckedChange={(checked) => {
                                const nextValue = checked
                                  ? [
                                      ...field.value,
                                      value,
                                    ]
                                  : field.value.filter(feature => feature !== value);
                                field.onChange(nextValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="flex items-center gap-1 font-normal">
                            <Icon className="h-4 w-4" />
                            {label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="supported">Supported</SelectItem>
                        <SelectItem value="deprecated">Deprecated</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="configurationInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Markdown-formatted configuration instructions..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={DEVICE_CATALOG_FORM_ID}
              loading={createCatalogEntry.isPending}
            >
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingModel !== null}
        onOpenChange={handleEditDialogOpenChange}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Edit Device Model</DialogTitle>
            <DialogDescription>
              Update the device model catalog details.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              id={EDIT_DEVICE_CATALOG_FORM_ID}
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Teltonika"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., FMC130"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="protocolType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol Type</FormLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEVICE_CATALOG_PROTOCOLS.map(protocol => (
                            <SelectItem
                              key={protocol}
                              value={protocol}
                            >
                              {protocol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="defaultPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Port</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 5001"
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value ? Number(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="supportedFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supported Features</FormLabel>
                    <div className="flex flex-wrap gap-5">
                      {DEVICE_FEATURE_OPTIONS.map(({
                        value,
                        label,
                        icon: Icon,
                      }) => (
                        <FormItem
                          key={value}
                          className="flex items-center gap-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value.includes(value)}
                              onCheckedChange={(checked) => {
                                const nextValue = checked
                                  ? [
                                      ...field.value,
                                      value,
                                    ]
                                  : field.value.filter(feature => feature !== value);
                                field.onChange(nextValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="flex items-center gap-1 font-normal">
                            <Icon className="h-4 w-4" />
                            {label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="configurationInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Markdown-formatted configuration instructions..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleEditDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={EDIT_DEVICE_CATALOG_FORM_ID}
              loading={updateCatalogEntry.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusDialogModel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialogModel(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the catalog status for
              {" "}
              {statusDialogModel?.manufacturer}
              {" "}
              {statusDialogModel?.model}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select
              value={pendingStatus}
              onValueChange={value => setPendingStatus(value as typeof pendingStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supported">Supported</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusDialogModel(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusSubmit}
              loading={updateCatalogEntry.isPending}
              disabled={pendingStatus === statusDialogModel?.status}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!modelPendingDelete}
        onOpenChange={() => setModelPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete device model?</AlertDialogTitle>
            <AlertDialogDescription>
              {modelPendingDelete?.manufacturer}
              {" "}
              {modelPendingDelete?.model}
              {" "}
              will be removed from the catalog. Devices already registered against it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Model</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => modelPendingDelete && handleDeleteModel(modelPendingDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
