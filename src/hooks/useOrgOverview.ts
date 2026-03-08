import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrgTypeSummary {
  type: string;
  label: string;
  count: number;
  activeCount: number;
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
}

export interface OrgDetail {
  id: string;
  name: string;
  organizationType: string;
  status: string;
  vehicleCount: number;
  driverCount: number;
  deviceCount: number;
  createdAt: string;
}

export interface AggregatorNetwork {
  aggregatorId: string;
  aggregatorName: string;
  childCount: number;
  relationshipType: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  ENTERPRISE: 'Enterprise',
  FLEET_PROVIDER: 'Fleet Provider',
  AGGREGATOR: 'Aggregator',
  OWNER_OPERATOR: 'Owner-Operator',
};

export function useOrgOverview() {
  // Fetch all organizations with asset counts
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['platform-org-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, status, created_at, tenant_id');
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch asset counts per org
  const orgIds = orgs.map((o) => o.id);
  const { data: vehicleCounts = [] } = useQuery({
    queryKey: ['platform-org-vehicles', orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select('owning_org_id')
        .in('owning_org_id', orgIds);
      if (error) throw error;
      return data || [];
    },
    enabled: orgIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const { data: driverCounts = [] } = useQuery({
    queryKey: ['platform-org-drivers', orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('owning_org_id')
        .in('owning_org_id', orgIds);
      if (error) throw error;
      return data || [];
    },
    enabled: orgIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const { data: deviceCounts = [] } = useQuery({
    queryKey: ['platform-org-devices', orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('devices')
        .select('owning_org_id')
        .in('owning_org_id', orgIds);
      if (error) throw error;
      return data || [];
    },
    enabled: orgIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch aggregator relationships
  const { data: relationships = [], isLoading: relsLoading } = useQuery({
    queryKey: ['platform-org-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_relationships')
        .select(`
          from_org_id,
          to_org_id,
          relationship_type,
          status
        `)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Build per-org asset count maps
  const vCountMap = vehicleCounts.reduce<Record<string, number>>((acc, v) => {
    if (v.owning_org_id) acc[v.owning_org_id] = (acc[v.owning_org_id] || 0) + 1;
    return acc;
  }, {});
  const dCountMap = driverCounts.reduce<Record<string, number>>((acc, d) => {
    if (d.owning_org_id) acc[d.owning_org_id] = (acc[d.owning_org_id] || 0) + 1;
    return acc;
  }, {});
  const devCountMap = deviceCounts.reduce<Record<string, number>>((acc, d) => {
    if (d.owning_org_id) acc[d.owning_org_id] = (acc[d.owning_org_id] || 0) + 1;
    return acc;
  }, {});

  // Enrich org details
  const orgDetails: OrgDetail[] = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    organizationType: o.organization_type,
    status: o.status,
    vehicleCount: vCountMap[o.id] || 0,
    driverCount: dCountMap[o.id] || 0,
    deviceCount: devCountMap[o.id] || 0,
    createdAt: o.created_at,
  }));

  // Build type summaries
  const typeOrder = ['ENTERPRISE', 'FLEET_PROVIDER', 'AGGREGATOR', 'OWNER_OPERATOR'];
  const typeSummaries: OrgTypeSummary[] = typeOrder.map((type) => {
    const ofType = orgDetails.filter((o) => o.organizationType === type);
    return {
      type,
      label: ORG_TYPE_LABELS[type] || type,
      count: ofType.length,
      activeCount: ofType.filter((o) => o.status === 'ACTIVE').length,
      vehicleCount: ofType.reduce((s, o) => s + o.vehicleCount, 0),
      driverCount: ofType.reduce((s, o) => s + o.driverCount, 0),
      deviceCount: ofType.reduce((s, o) => s + o.deviceCount, 0),
    };
  });

  // Build aggregator network info
  const aggregatorNetworks: AggregatorNetwork[] = orgs
    .filter((o) => o.organization_type === 'AGGREGATOR')
    .map((agg) => {
      const children = relationships.filter((r) => r.from_org_id === agg.id);
      return {
        aggregatorId: agg.id,
        aggregatorName: agg.name,
        childCount: children.length,
        relationshipType: children[0]?.relationship_type || 'AGGREGATED_FLEET',
      };
    });

  return {
    typeSummaries,
    orgDetails,
    aggregatorNetworks,
    relationships,
    totalOrgs: orgs.length,
    isLoading: orgsLoading || relsLoading,
  };
}
