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
  getSystemDevicesCatalogExportQueryOptions,
  getSystemDevicesCatalogQueryOptions,
  useCreateDeviceCatalogEntry,
  useDeleteDeviceCatalogEntry,
  useUpdateDeviceCatalogEntry,
} from "@truckmoov/api/auth";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Download,
  Edit,
  Fuel,
  Gauge,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";
import * as z from "zod";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
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
  TCP: "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-50",
  HTTP: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  MQTT: "border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-50",
  UDP: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-50",
};
const statusBadgeClass: Record<string, string> = {
  supported: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15",
  deprecated: "border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/15",
  blocked: "border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/15",
};
const statusLabel: Record<string, string> = {
  supported: "Supported",
  deprecated: "Deprecated",
  blocked: "Blocked",
};
const featureIconClass: Record<string, string> = {
  obd2: "text-blue-500",
  fuel: "text-amber-500",
  sos: "text-red-500",
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
  protocolType: z.enum([
    "TCP",
    "HTTP",
    "MQTT",
    "UDP",
  ]),
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
  const protocolType = [
    "TCP",
    "HTTP",
    "MQTT",
    "UDP",
  ].includes(model.protocolType)
    ? model.protocolType as EditDeviceCatalogFormValues["protocolType"]
    : "TCP";
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
          form.reset(defaultCatalogFormValues);
          setCreateDialogOpen(false);
        },
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
          configurationInstructions: values.configurationInstructions?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditingModel(null);
          editForm.reset(defaultEditCatalogFormValues);
        },
      },
    );
  }

  function handleMarkDeprecated(model: SystemDeviceCatalogModel) {
    updateCatalogEntry.mutate({
      id: model.id,
      data: { status: "deprecated" },
    });
  }

  function handleBlockModel(model: SystemDeviceCatalogModel) {
    updateCatalogEntry.mutate({
      id: model.id,
      data: { status: "blocked" },
    });
  }

  function handleDeleteModel(model: SystemDeviceCatalogModel) {
    deleteCatalogEntry.mutate({ id: model.id });
  }

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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-14 px-5 text-muted-foreground">Manufacturer</TableHead>
                  <TableHead className="h-14 px-5 text-muted-foreground">Model</TableHead>
                  <TableHead className="h-14 px-5 text-muted-foreground">Protocol</TableHead>
                  <TableHead className="h-14 px-5 text-muted-foreground">Port</TableHead>
                  <TableHead className="h-14 px-5 text-muted-foreground">Features</TableHead>
                  <TableHead className="h-14 px-5 text-muted-foreground">Status</TableHead>
                  <TableHead className="h-14 w-[56px] px-5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogQuery.isLoading
                  ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="px-5 py-8 text-center text-muted-foreground"
                        >
                          Loading device catalog...
                        </TableCell>
                      </TableRow>
                    )
                  : models.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="px-5 py-8 text-center text-muted-foreground"
                          >
                            No device models in catalog.
                          </TableCell>
                        </TableRow>
                      )
                    : (
                        models.map(model => (
                          <TableRow
                            key={model.id}
                            className="h-[72px]"
                          >
                            <TableCell className="px-5 font-semibold text-foreground">{model.manufacturer}</TableCell>
                            <TableCell className="px-5 font-semibold text-foreground">{model.model}</TableCell>
                            <TableCell className="px-5">
                              <Badge
                                variant="outline"
                                className={`h-6 rounded-md px-2 text-xs font-bold ${
                                  protocolBadgeClass[model.protocolType] ?? "border-muted bg-muted text-muted-foreground"
                                }`}
                              >
                                {model.protocolType}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-5 text-muted-foreground">
                              {model.defaultPort}
                            </TableCell>
                            <TableCell className="px-5">
                              <div className="flex items-center gap-1.5">
                                {model.supportedFeatures.length > 0
                                  ? (
                                      model.supportedFeatures.map(feature => (
                                        <span
                                          key={feature}
                                          title={feature}
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
                            </TableCell>
                            <TableCell className="px-5">
                              <Badge
                                variant="outline"
                                className={`h-6 rounded-md px-2 text-xs font-bold ${
                                  statusBadgeClass[model.status] ?? "border-muted bg-muted text-muted-foreground"
                                }`}
                              >
                                {statusLabel[model.status] ?? model.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-5 text-right">
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
                                    onClick={() => handleMarkDeprecated(model)}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Mark Deprecated
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={updateCatalogEntry.isPending}
                                    onClick={() => handleBlockModel(model)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Block Model
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={deleteCatalogEntry.isPending}
                                    onClick={() => handleDeleteModel(model)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
              </TableBody>
            </Table>
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
                          <SelectItem value="TCP">TCP</SelectItem>
                          <SelectItem value="HTTP">HTTP</SelectItem>
                          <SelectItem value="MQTT">MQTT</SelectItem>
                          <SelectItem value="UDP">UDP</SelectItem>
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
                          <SelectItem value="TCP">TCP</SelectItem>
                          <SelectItem value="HTTP">HTTP</SelectItem>
                          <SelectItem value="MQTT">MQTT</SelectItem>
                          <SelectItem value="UDP">UDP</SelectItem>
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
    </>
  );
}
