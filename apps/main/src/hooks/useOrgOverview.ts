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

export function useOrgOverview() {
  return {
    typeSummaries: [] as OrgTypeSummary[],
    orgDetails: [] as OrgDetail[],
    aggregatorNetworks: [] as AggregatorNetwork[],
    relationships: [] as any[],
    totalOrgs: 0,
    isLoading: false,
  };
}
