import type { VoiceCallQuery } from "@truckmoov/api/notification";
import {
  keepPreviousData, queryOptions,
} from "@tanstack/react-query";
import {
  getVoiceCalls, getVoicePrompts, getVoiceStats, getVoiceStatus,
} from "@truckmoov/api/notification";

export const voiceKeys = {
  root: ["platform-voice"] as const,
  status: [
    "platform-voice",
    "status",
  ] as const,
  prompts: [
    "platform-voice",
    "prompts",
  ] as const,
  calls: (query: VoiceCallQuery) => [
    "platform-voice",
    "calls",
    query,
  ] as const,
  stats: (days: number) => [
    "platform-voice",
    "stats",
    days,
  ] as const,
};

export function voiceStatusOptions() {
  return queryOptions({
    queryKey: voiceKeys.status, queryFn: getVoiceStatus, staleTime: 60_000,
  });
}

export function voicePromptsOptions() {
  return queryOptions({
    queryKey: voiceKeys.prompts, queryFn: getVoicePrompts,
  });
}

export function voiceCallsOptions(query: VoiceCallQuery) {
  return queryOptions({
    queryKey: voiceKeys.calls(query),
    queryFn: () => getVoiceCalls(query),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });
}

export function voiceStatsOptions(days: number) {
  return queryOptions({
    queryKey: voiceKeys.stats(days),
    queryFn: () => getVoiceStats(days),
    refetchInterval: 60_000,
  });
}
