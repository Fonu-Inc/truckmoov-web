import {
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";
import { apiGet } from "@/lib/backendApi";
import { useAuthStore } from "@/stores/authStore";

type BackendTenant = {
  id: string;
  companyName: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  billingEmail: string;
  primaryContactName?: string;
  businessAddress?: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
};

function mapBackendTenant(t: BackendTenant): TenantData {
  return {
    id: t.id,
    name: t.companyName,
    slug: t.slug,
    email: t.contactEmail,
    phone: t.contactPhone ?? null,
    address: t.businessAddress ?? null,
    billingEmail: t.billingEmail,
    primaryContactName: t.primaryContactName ?? null,
    plan: "starter",
    status: (t.status === "active" ? "active" : "pending") as TenantData["status"],
    vehicleCount: 0,
    driverCount: 0,
    deviceCount: 0,
    simCount: 0,
    features: {},
    createdAt: t.createdAt,
    monthlyRevenueNgn: 0,
    lastActiveAt: null,
  };
}

export type TenantData = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  billingEmail: string | null;
  primaryContactName: string | null;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "pending" | "trial" | "suspended" | "inactive" | "terminated";
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  simCount: number;
  features: Record<string, boolean>;
  createdAt: string;
  monthlyRevenueNgn: number;
  lastActiveAt: string | null;
  businessInfo?: {
    companyName: string;
    registrationNumber: string | null;
    taxId: string | null;
    businessType: string | null;
    industry: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    verificationStatus: string | null;
    verifiedAt: string | null;
    yearEstablished: number | null;
  };
  invitationStatus?: {
    hasPendingInvitation: boolean;
    invitationAccepted: boolean;
  };
};

export function useTenants() {
  const [
    tenants,
    setTenants,
  ] = useState<TenantData[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<Error | null>(null);
  const { user } = useAuthStore();

  const fetchTenants = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiGet<{
          data: BackendTenant[];
          total: number;
        } | BackendTenant[]>("/tenants");
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        setTenants(list.map(mapBackendTenant));
      }
      catch (err) {
        console.error(
          "Error fetching tenants:",
          err,
        );
        setError(err as Error);
        toast.error("Failed to fetch tenants");
      }
      finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateTenantStatus = useCallback(
    async (_tenantId: string, _newStatus: TenantData["status"]) => {
      return false;
    },
    [],
  );

  const updateTenant = useCallback(
    async (_tenantId: string, _updates: Partial<{
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      billingEmail: string | null;
      plan: TenantData["plan"];
    }>) => {
      return false;
    },
    [],
  );

  const deleteTenant = useCallback(
    async (_tenantId: string) => {
      return false;
    },
    [],
  );

  return {
    tenants,
    isLoading,
    error,
    refetch: fetchTenants,
    updateTenantStatus,
    updateTenant,
    deleteTenant,
  };
}

export function useTenantDetails(_tenantId: string | null) {
  return {
    tenant: null as TenantData | null,
    isLoading: false,
    error: null as Error | null,
  };
}
