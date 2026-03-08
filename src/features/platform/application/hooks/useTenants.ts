import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiGet, apiPost, getToken } from "@/lib/backendApi";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface BackendTenant {
  id: string;
  companyName: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  billingEmail: string;
  businessAddress?: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

function mapBackendTenant(t: BackendTenant): TenantData {
  return {
    id: t.id,
    name: t.companyName,
    slug: t.slug,
    email: t.contactEmail,
    phone: t.contactPhone ?? null,
    address: t.businessAddress ?? null,
    billingEmail: t.billingEmail,
    plan: 'starter',
    status: (t.status === 'active' ? 'active' : 'pending') as TenantData['status'],
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

// Demo user IDs from authStore mockUsers
const DEMO_USER_IDS = ["pa1", "ta1", "om1", "s1", "dp1", "vf1", "d1"];

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  billingEmail: string | null;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "pending" | "suspended" | "inactive";
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  simCount: number;
  features: Record<string, boolean>;
  createdAt: string;
  monthlyRevenueNgn: number;
  lastActiveAt: string | null;
  // Business info from tenant_business_info
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
  // Invitation status
  invitationStatus?: {
    hasPendingInvitation: boolean;
    invitationAccepted: boolean;
  };
}

export function useTenants() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasFetched = useRef(false);
  const { user } = useAuthStore();

  // Check if this is a demo user (mock login)
  const isDemoUser = user?.id ? DEMO_USER_IDS.includes(user.id) : false;

  const fetchTenants = useCallback(async () => {
    // Demo users get mock tenant fixtures (backend doesn't store demo data)
    if (isDemoUser) {
      const { mockTenants } = await import("@/data/mockData");
      setTenants(
        mockTenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.name.toLowerCase().replace(/\s+/g, "-"),
          email: `admin@${t.name.toLowerCase().replace(/\s+/g, "")}.com`,
          phone: null,
          address: null,
          billingEmail: null,
          plan: t.plan as TenantData["plan"],
          status: t.status as TenantData["status"],
          vehicleCount: t.vehicleCount,
          driverCount: t.driverCount,
          deviceCount: 0,
          simCount: 0,
          features: {},
          createdAt: t.createdAt.toISOString(),
          monthlyRevenueNgn: 0,
          lastActiveAt: null,
        }))
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiGet<{ data: BackendTenant[]; total: number } | BackendTenant[]>('/tenants');
      const list = Array.isArray(response) ? response : (response?.data ?? []);
      setTenants(list.map(mapBackendTenant));
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError(err as Error);
      toast.error("Failed to fetch tenants");
    } finally {
      setIsLoading(false);
    }
  }, [isDemoUser]);

  const updateTenantStatus = useCallback(async (tenantId: string, newStatus: TenantData["status"]) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", tenantId);

      if (error) throw error;

      // Update local state
      setTenants(prev => prev.map(t => 
        t.id === tenantId ? { ...t, status: newStatus } : t
      ));

      toast.success(`Tenant status updated to ${newStatus}`);
      return true;
    } catch (err) {
      console.error("Error updating tenant status:", err);
      toast.error("Failed to update tenant status");
      return false;
    }
  }, []);

  const updateTenant = useCallback(async (tenantId: string, updates: Partial<{
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    billingEmail: string | null;
    plan: TenantData["plan"];
  }>) => {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.billingEmail !== undefined) dbUpdates.billing_email = updates.billingEmail;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;

      const { error } = await supabase
        .from("tenants")
        .update(dbUpdates)
        .eq("id", tenantId);

      if (error) throw error;

      // Update local state - cast properly to maintain type safety
      setTenants(prev => prev.map(t => 
        t.id === tenantId ? { ...t, ...updates } as TenantData : t
      ));

      toast.success("Tenant updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating tenant:", err);
      toast.error("Failed to update tenant");
      return false;
    }
  }, []);

  const deleteTenant = useCallback(async (tenantId: string) => {
    try {
      // First delete related business info
      await supabase
        .from("tenant_business_info")
        .delete()
        .eq("tenant_id", tenantId);

      // Then delete the tenant
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;

      // Update local state
      setTenants(prev => prev.filter(t => t.id !== tenantId));

      toast.success("Tenant deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting tenant:", err);
      toast.error("Failed to delete tenant");
      return false;
    }
  }, []);

  // Listen for auth state changes and fetch when authenticated
  useEffect(() => {
    // Demo users can fetch directly without Supabase session
    // Platform admin demo user should see all tenants
    if (isDemoUser && user?.role === 'platform_admin') {
      if (!hasFetched.current) {
        hasFetched.current = true;
        fetchTenants();
      }
      return;
    }

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        if (!hasFetched.current) {
          hasFetched.current = true;
          fetchTenants();
        }
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const wasAuthenticated = isAuthenticated;
      setIsAuthenticated(!!session);
      
      if (session && !wasAuthenticated) {
        // User just logged in - fetch data
        hasFetched.current = true;
        fetchTenants();
      } else if (!session && !isDemoUser) {
        // User logged out - clear data (but not for demo users)
        setTenants([]);
        hasFetched.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchTenants, isAuthenticated, isDemoUser, user?.role]);

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

export function useTenantDetails(tenantId: string | null) {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setTenant(null);
      return;
    }

    const fetchTenant = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", tenantId)
          .single();

        if (tenantError) throw tenantError;

        // Fetch business info
        const { data: businessInfo, error: businessError } = await supabase
          .from("tenant_business_info")
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle();

        if (businessError) throw businessError;

        const combined: TenantData = {
          id: tenantData.id,
          name: tenantData.name,
          slug: tenantData.slug,
          email: tenantData.email,
          phone: tenantData.phone,
          address: tenantData.address,
          billingEmail: tenantData.billing_email,
          plan: tenantData.plan as TenantData["plan"],
          status: tenantData.status as TenantData["status"],
          vehicleCount: tenantData.vehicle_count || 0,
          driverCount: tenantData.driver_count || 0,
          deviceCount: tenantData.device_count || 0,
          simCount: tenantData.sim_count || 0,
          features: (tenantData.features as Record<string, boolean>) || {},
          createdAt: tenantData.created_at,
          monthlyRevenueNgn: (tenantData as any).monthly_revenue_ngn || 0,
          lastActiveAt: (tenantData as any).last_active_at || null,
          businessInfo: businessInfo
            ? {
                companyName: businessInfo.company_name,
                registrationNumber: businessInfo.registration_number,
                taxId: businessInfo.tax_id,
                businessType: businessInfo.business_type,
                industry: businessInfo.industry,
                addressLine1: businessInfo.address_line1,
                addressLine2: businessInfo.address_line2,
                city: businessInfo.city,
                state: businessInfo.state,
                postalCode: businessInfo.postal_code,
                country: businessInfo.country,
                verificationStatus: businessInfo.verification_status,
                verifiedAt: businessInfo.verified_at,
                yearEstablished: businessInfo.year_established,
              }
            : undefined,
        };

        setTenant(combined);
      } catch (err) {
        console.error("Error fetching tenant details:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [tenantId]);

  return { tenant, isLoading, error };
}
