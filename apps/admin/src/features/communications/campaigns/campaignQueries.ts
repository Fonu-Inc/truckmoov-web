import type { PlatformCampaignQuery } from "@truckmoov/api/notification";
import {
  keepPreviousData, queryOptions,
} from "@tanstack/react-query";
import {
  getPlatformCampaign, getPlatformCampaigns,
} from "@truckmoov/api/notification";

export const campaignKeys = {
  root: ["platform-campaigns"] as const,
  list: (query: PlatformCampaignQuery) => [
    "platform-campaigns",
    "list",
    query,
  ] as const,
  detail: (id: string) => [
    "platform-campaigns",
    "detail",
    id,
  ] as const,
};

export function campaignListOptions(query: PlatformCampaignQuery) {
  return queryOptions({
    queryKey: campaignKeys.list(query),
    queryFn: () => getPlatformCampaigns(query),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function campaignDetailOptions(id: string) {
  return queryOptions({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getPlatformCampaign(id),
    enabled: Boolean(id),
    refetchInterval: 10_000,
  });
}
