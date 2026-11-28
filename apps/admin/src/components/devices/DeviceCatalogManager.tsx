import type {
  DeviceCatalogStatus, SystemDeviceCatalogModel, SystemDeviceCatalogQuery,
} from "@truckmoov/api/auth";
import type { CatalogStatusFilter } from "./catalog/catalogShared";
import {
  useQuery, useQueryClient,
} from "@tanstack/react-query";
import {
  getSystemDevicesCatalogExportQueryOptions,
  getSystemDevicesCatalogQueryOptions,
  getSystemDevicesSummaryQueryOptions,
  useDeleteDeviceCatalogEntry,
  useUpdateDeviceCatalogEntry,
} from "@truckmoov/api/auth";
import {
  BookOpen,
  Download,
  Plus,
  Search,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { PageActions } from "@/shared/components/layout/PageTitle";
import { useConfirmAction } from "@/shared/hooks/useConfirmAction";
import { getCatalogColumns } from "./catalog/catalogColumns";
import { CatalogModelDialog } from "./catalog/CatalogModelDialog";
import {
  CATALOG_STATUSES,
  STATUS_LABEL,
} from "./catalog/catalogShared";

export function DeviceCatalogManager() {
  const queryClient = useQueryClient();
  const {
    confirm, confirmDialog,
  } = useConfirmAction();
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<CatalogStatusFilter>("all");
  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);
  const [
    editingModel,
    setEditingModel,
  ] = useState<SystemDeviceCatalogModel | null>(null);
  const [
    isExporting,
    setIsExporting,
  ] = useState(false);
  const updateEntry = useUpdateDeviceCatalogEntry();
  const deleteEntry = useDeleteDeviceCatalogEntry();

  useEffect(
    () => {
      const timer = setTimeout(
        setDebouncedSearch,
        400,
        searchQuery,
      );
      return () => clearTimeout(timer);
    },
    [searchQuery],
  );

  const search = debouncedSearch.trim();
  const hasFilters = !!search || statusFilter !== "all";
  const queryPayload: SystemDeviceCatalogQuery | undefined = hasFilters
    ? {
        params: {
          ...(search ? { search } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        },
      }
    : undefined;
  const catalogQuery = useQuery(getSystemDevicesCatalogQueryOptions(queryPayload));
  const summaryQuery = useQuery(getSystemDevicesSummaryQueryOptions());
  const summary = summaryQuery.data?.data;
  const models = catalogQuery.data?.data.models ?? [];
  const stats = [
    {
      label: "Total Models", value: summary?.totalCatalogModels, className: "",
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

  function refreshSummary() {
    queryClient.invalidateQueries({ queryKey: getSystemDevicesSummaryQueryOptions().queryKey });
  }

  function openCreate() {
    setEditingModel(null);
    setDialogOpen(true);
  }

  function openEdit(model: SystemDeviceCatalogModel) {
    setEditingModel(model);
    setDialogOpen(true);
  }

  function changeStatus(model: SystemDeviceCatalogModel, status: DeviceCatalogStatus) {
    const run = () => updateEntry.mutate(
      {
        id: model.id, data: { status },
      },
      {
        onSuccess: () => {
          toast.success(`Marked ${STATUS_LABEL[status]}`);
          refreshSummary();
        },
        onError: error => toast.error(error.message),
      },
    );
    if (status !== "blocked")
      return run();
    confirm({
      title: "Block device model?",
      description: `${model.manufacturer} ${model.model} will be blocked in the catalog.`,
      confirmLabel: "Block Model",
      onConfirm: run,
    });
  }

  function requestDelete(model: SystemDeviceCatalogModel) {
    confirm({
      title: "Delete Device Model",
      description: `Are you sure you want to delete ${model.manufacturer} ${model.model}? This action cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => deleteEntry.mutate(
        { id: model.id },
        {
          onSuccess: () => {
            toast.success("Device model deleted");
            refreshSummary();
          },
          onError: error => toast.error(error.message),
        },
      ),
    });
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await queryClient.fetchQuery(getSystemDevicesCatalogExportQueryOptions(queryPayload));
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

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open)
      refreshSummary();
  }

  const columns = getCatalogColumns({
    busy: updateEntry.isPending,
    onEdit: openEdit,
    onStatusChange: changeStatus,
    onDelete: requestDelete,
  });

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-3"
          >
            <p className={`text-2xl font-bold ${stat.className}`}>{stat.value ?? "N/A"}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <PageActions>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Device Model
        </Button>
      </PageActions>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Device Inventory
              </CardTitle>
              <CardDescription>
                Manage device manufacturers, models, protocols, ports, features, and support status
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
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
                {CATALOG_STATUSES.map(status => (
                  <SelectItem
                    key={status}
                    value={status}
                  >
                    {STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <DataTable
              columns={columns}
              data={models}
              isLoading={catalogQuery.isLoading}
              isError={catalogQuery.isError}
              errorMessage="Unable to load the device catalog."
              onRetry={() => catalogQuery.refetch()}
              hasActiveFilters={hasFilters}
              emptyState="No device models in catalog. Add your first model."
              filteredEmptyState="No models match your search."
            />
          </div>
        </CardContent>
      </Card>

      <CatalogModelDialog
        open={dialogOpen}
        model={editingModel}
        onOpenChange={handleDialogChange}
      />
      {confirmDialog}
    </>
  );
}
