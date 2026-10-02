import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  getPlatformMailCredentials,
  getPlatformMailThread,
  getPlatformMailThreads,
} from "@truckmoov/api/auth";

export const PAGE = 25;

export const emailKeys = {
  root: ["platform-email"] as const,
  credentials: ["platform-email", "credentials"] as const,
  threads: ["platform-email", "threads"] as const,
  thread: (id: string) => ["platform-email", "thread", id] as const,
};

export const credentialsOptions = () => queryOptions({
  queryKey: emailKeys.credentials,
  queryFn: getPlatformMailCredentials,
  staleTime: 60_000,
});

export const threadsOptions = (enabled: boolean) => infiniteQueryOptions({
  queryKey: emailKeys.threads,
  queryFn: ({ pageParam }) => getPlatformMailThreads(PAGE, pageParam),
  initialPageParam: 0,
  getNextPageParam: (last, pages) => {
    const loaded = pages.reduce((count, page) => count + page.threads.length, 0);
    return loaded < last.total ? loaded : undefined;
  },
  refetchInterval: 30_000,
  enabled,
});

export const threadOptions = (id: string) => queryOptions({
  queryKey: emailKeys.thread(id),
  queryFn: () => getPlatformMailThread(id),
  enabled: Boolean(id),
});
