import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSystemDeviceCatalogQueryOptions,
  getSystemDeviceCatalogReferenceDataQueryOptions,
  getSystemDeviceInventoryQueryOptions,
  getSystemDeviceSummaryQueryOptions,
  useCreateSystemDeviceModel,
  useDeleteSystemDeviceModel,
  useExportSystemDeviceInventory,
  useUpdateSystemDeviceModel,
} from "@/features/auth/api";
import type {
  CreateSystemDeviceModelPayload,
  DeviceCatalogStatus,
  SystemDeviceCatalogQuery,
  SystemDeviceInventoryQuery,
  UpdateSystemDeviceModelPayload,
} from "@/features/auth/api/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function usePlatformDevices() {
  const [inventoryFilters, setInventoryFilters] = useState<SystemDeviceInventoryQuery>({});
  const [catalogFilters, setCatalogFilters] = useState<SystemDeviceCatalogQuery>({});

  const summaryQuery = useQuery(getSystemDeviceSummaryQueryOptions());
  const inventoryQuery = useQuery(getSystemDeviceInventoryQueryOptions(inventoryFilters));
  const catalogQuery = useQuery(getSystemDeviceCatalogQueryOptions(catalogFilters));
  const catalogReferenceDataQuery = useQuery(getSystemDeviceCatalogReferenceDataQueryOptions());

  const exportInventoryMutation = useExportSystemDeviceInventory();
  const createDeviceModelMutation = useCreateSystemDeviceModel();
  const updateDeviceModelMutation = useUpdateSystemDeviceModel();
  const deleteDeviceModelMutation = useDeleteSystemDeviceModel();

  const updateInventoryFilter = (
    key: keyof SystemDeviceInventoryQuery,
    value: string | undefined
  ) => {
    setInventoryFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  const updateCatalogFilter = (
    key: keyof SystemDeviceCatalogQuery,
    value: string | undefined
  ) => {
    setCatalogFilters((current) => ({
      ...current,
      [key]:
        key === "status"
          ? ((value || undefined) as DeviceCatalogStatus | undefined)
          : value || undefined,
    }));
  };

  const refreshAll = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      inventoryQuery.refetch(),
      catalogQuery.refetch(),
      catalogReferenceDataQuery.refetch(),
    ]);
  };

  const exportInventory = async () => {
    const blob = await exportInventoryMutation.mutateAsync(inventoryFilters);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `system-devices-${timestamp}.csv`);
  };

  const createDeviceModel = async (data: CreateSystemDeviceModelPayload["data"]) =>
    createDeviceModelMutation.mutateAsync({ data });

  const updateDeviceModel = async (
    deviceModelId: string,
    data: UpdateSystemDeviceModelPayload["data"]
  ) => updateDeviceModelMutation.mutateAsync({ deviceModelId, data });

  const deleteDeviceModel = async (deviceModelId: string) =>
    deleteDeviceModelMutation.mutateAsync(deviceModelId);

  return {
    summary: summaryQuery.data?.data,
    inventory: inventoryQuery.data?.data,
    catalog: catalogQuery.data?.data,
    catalogReferenceData: catalogReferenceDataQuery.data?.data,
    inventoryFilters,
    catalogFilters,
    setInventoryFilter: updateInventoryFilter,
    setCatalogFilter: updateCatalogFilter,
    refreshAll,
    exportInventory,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    isSummaryLoading: summaryQuery.isLoading,
    isInventoryLoading: inventoryQuery.isLoading,
    isCatalogLoading: catalogQuery.isLoading,
    isCatalogReferenceDataLoading: catalogReferenceDataQuery.isLoading,
    isRefreshing:
      summaryQuery.isFetching ||
      inventoryQuery.isFetching ||
      catalogQuery.isFetching ||
      catalogReferenceDataQuery.isFetching,
    isExportingInventory: exportInventoryMutation.isPending,
    isCreatingDeviceModel: createDeviceModelMutation.isPending,
    isUpdatingDeviceModel: updateDeviceModelMutation.isPending,
    isDeletingDeviceModel: deleteDeviceModelMutation.isPending,
  };
}
