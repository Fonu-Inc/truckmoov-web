import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mockDrivers } from "@/data/mockData";
import { useOrgDataScope } from "@/hooks/useOrgDataScope";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/backendApi";
import { useAuthStore } from "@/stores/authStore";

export type DriverData = {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  licenseNumber: string;
  licenseExpiry: string | null;
  status: "active" | "available" | "on_trip" | "offline" | "on_break";
  rating: number;
  totalTrips: number;
  currentVehicleId: string | null;
  communicationPreference: string;
  createdAt: string;
  updatedAt: string;
};

type DriverResponseDto = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  status: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
};

function toDriverData(dto: DriverResponseDto): DriverData {
  return {
    id: dto.id,
    tenantId: dto.tenantId ?? "",
    name: `${dto.firstName} ${dto.lastName}`.trim(),
    phone: dto.phone,
    email: dto.email ?? null,
    licenseNumber: dto.licenseNumber ?? "",
    licenseExpiry: dto.licenseExpiryDate ? dto.licenseExpiryDate.split("T")[0] : null,
    status: (dto.status as DriverData["status"]) ?? "available",
    rating: 0,
    totalTrips: 0,
    currentVehicleId: null,
    communicationPreference: "whatsapp",
    createdAt: typeof dto.createdAt === "string" ? dto.createdAt : new Date(dto.createdAt).toISOString(),
    updatedAt: typeof dto.updatedAt === "string" ? dto.updatedAt : new Date(dto.updatedAt).toISOString(),
  };
}

function toCreateDto(data: Partial<DriverData>) {
  const [
    firstName = "",
    ...rest
  ] = (data.name ?? "").split(" ");
  const lastName = rest.join(" ") || firstName;
  return {
    firstName,
    lastName,
    phone: data.phone ?? "",
    email: data.email ?? undefined,
    licenseNumber: data.licenseNumber ?? undefined,
    licenseExpiryDate: data.licenseExpiry ?? undefined,
    status: "active" as const,
    ...(data.tenantId ? { tenantId: data.tenantId } : {}),
  };
}

export function useDrivers() {
  const [
    drivers,
    setDrivers,
  ] = useState<DriverData[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState<Error | null>(null);
  const { user } = useAuthStore();
  const orgScope = useOrgDataScope();
  const canCreateAssets = true; const canUpdateAssets = true; const canDeleteAssets = true;

  const assetOrgIdsKey = JSON.stringify(orgScope.assetOrgIds);
  const stableAssetOrgIds = useMemo(
    () => orgScope.assetOrgIds,
    [assetOrgIdsKey],
  );
  const isPlatformAdmin = user?.role === "platform_admin";

  const fetchDrivers = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiGet<DriverResponseDto[]>("/drivers");
        const mapped = (data || []).map(toDriverData);
        if (mapped.length === 0) {
          setDrivers(
            mockDrivers.map(d => ({
              id: d.id,
              tenantId: "",
              name: d.name,
              phone: d.phone,
              email: d.email ?? null,
              licenseNumber: d.licenseNumber,
              licenseExpiry: d.licenseExpiry ? d.licenseExpiry.toISOString().split("T")[0] : null,
              status: d.status as DriverData["status"],
              rating: d.rating,
              totalTrips: d.totalTrips,
              currentVehicleId: d.currentVehicle ?? null,
              communicationPreference: d.communicationPreference ?? "whatsapp",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })),
          );
        }
        else {
          setDrivers(mapped);
        }
      }
      catch (err) {
        console.error(
          "Error fetching drivers:",
          err,
        );
        setError(err as Error);
        toast.error("Failed to fetch drivers");
      }
      finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const addDriver = useCallback(
    async (driver: Partial<DriverData>) => {
      if (!canCreateAssets) {
        toast.error("You don't have permission to add drivers");
        return false;
      }
      try {
        const targetTenantId = (isPlatformAdmin ? driver.tenantId ?? user?.tenantId : user?.tenantId) ?? undefined;
        const dto = toCreateDto({
          ...driver,
          tenantId: targetTenantId,
        });
        const data = await apiPost<DriverResponseDto>(
          "/drivers",
          dto,
        );
        setDrivers(prev => [
          toDriverData(data),
          ...prev,
        ]);
        toast.success("Driver added successfully");
        return true;
      }
      catch (err) {
        console.error(
          "Error adding driver:",
          err,
        );
        toast.error("Failed to add driver");
        return false;
      }
    },
    [
      isPlatformAdmin,
      user?.tenantId,
      canCreateAssets,
    ],
  );

  const updateDriver = useCallback(
    async (id: string, updates: Partial<DriverData>) => {
      if (!canUpdateAssets) {
        toast.error("You don't have permission to update drivers");
        return false;
      }
      try {
        const dto: Record<string, unknown> = {};
        if (updates.name !== undefined) {
          const [
            firstName = "",
            ...rest
          ] = updates.name.split(" ");
          dto.firstName = firstName;
          dto.lastName = rest.join(" ") || firstName;
        }
        if (updates.phone !== undefined)
          dto.phone = updates.phone;
        if (updates.email !== undefined)
          dto.email = updates.email;
        if (updates.licenseNumber !== undefined)
          dto.licenseNumber = updates.licenseNumber;
        if (updates.licenseExpiry !== undefined)
          dto.licenseExpiryDate = updates.licenseExpiry;
        if (updates.status !== undefined)
          dto.status = updates.status;
        await apiPatch(
          `/drivers/${id}`,
          dto,
        );
        setDrivers(prev => prev.map(d => (d.id === id
          ? {
              ...d,
              ...updates,
            }
          : d)));
        toast.success("Driver updated successfully");
        return true;
      }
      catch (err) {
        console.error(
          "Error updating driver:",
          err,
        );
        toast.error("Failed to update driver");
        return false;
      }
    },
    [],
  );

  const deleteDriver = useCallback(
    async (id: string) => {
      if (!canDeleteAssets) {
        toast.error("You don't have permission to delete drivers");
        return false;
      }
      try {
        await apiDelete(`/drivers/${id}`);
        setDrivers(prev => prev.filter(d => d.id !== id));
        toast.success("Driver deleted successfully");
        return true;
      }
      catch (err) {
        console.error(
          "Error deleting driver:",
          err,
        );
        toast.error("Failed to delete driver");
        return false;
      }
    },
    [],
  );

  useEffect(
    () => {
      fetchDrivers();
    },
    [fetchDrivers],
  );

  return {
    drivers,
    isLoading,
    error,
    refetch: fetchDrivers,
    addDriver,
    updateDriver,
    deleteDriver,
    canCreate: canCreateAssets,
    canUpdate: canUpdateAssets,
    canDelete: canDeleteAssets,
  };
}
