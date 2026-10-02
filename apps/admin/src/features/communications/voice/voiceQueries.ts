import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { VoiceCallQuery } from "@truckmoov/api/notification";
import { getVoiceCalls, getVoicePrompts, getVoiceStats, getVoiceStatus } from "@truckmoov/api/notification";

export const voiceKeys = {
  root: ["platform-voice"] as const,
  status: ["platform-voice", "status"] as const,
  prompts: ["platform-voice", "prompts"] as const,
  calls: (query: VoiceCallQuery) => ["platform-voice", "calls", query] as const,
  stats: (days: number) => ["platform-voice", "stats", days] as const,
};

export const voiceStatusOptions = () => queryOptions({ queryKey: voiceKeys.status, queryFn: getVoiceStatus, staleTime: 60_000 });

export const voicePromptsOptions = () => queryOptions({ queryKey: voiceKeys.prompts, queryFn: getVoicePrompts });

export const voiceCallsOptions = (query: VoiceCallQuery) => queryOptions({
  queryKey: voiceKeys.calls(query),
  queryFn: () => getVoiceCalls(query),
  placeholderData: keepPreviousData,
  refetchInterval: 20_000,
});

export const voiceStatsOptions = (days: number) => queryOptions({
  queryKey: voiceKeys.stats(days),
  queryFn: () => getVoiceStats(days),
  refetchInterval: 60_000,
});
