import type {
  ApiKey, ConsoleUsageAnalyticsBucket,
} from "@truckmoov/api/console";
import { toDateParam } from "@truckmoov/app-core/utils/time-utils";

/**
 * `GET /console/analytics/usage` returns one bucket per API key per hour. The
 * charts want a daily series, the table wants a per-key rollup, and the stat
 * cards want totals — so all three are folded out of the same bucket list here.
 */

export type DailyApiUsage = {
  date: string;
  requests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
};

export type ApiKeyUsage = {
  keyId: string;
  keyName: string;
  keyPrefix: string;
  requests: number;
  successRate: number;
  lastUsed: string | null;
};

export type ApiUsageSummary = {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  requestsToday: number;
  errorRateToday: number;
};

/**
 * Latency is a per-bucket average, so it has to be re-weighted by request
 * count when buckets merge — a plain mean of means over-weights quiet hours.
 */
function weightedLatency(totalLatency: number, requests: number) {
  return requests > 0 ? Math.round(totalLatency / requests) : 0;
}

function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Hourly buckets collapsed to one row per calendar day, oldest first. */
export function toDailyUsage(buckets: ConsoleUsageAnalyticsBucket[]): DailyApiUsage[] {
  const byDate = new Map<string, DailyApiUsage & { totalLatency: number }>();

  for (const b of buckets) {
    const date = toDateParam(b.hourBucket);
    if (!date)
      continue;
    const row = byDate.get(date) ?? {
      date, requests: 0, successCount: 0, errorCount: 0, avgLatencyMs: 0, totalLatency: 0,
    };
    row.requests += b.requestCount;
    row.errorCount += b.errorCount;
    row.totalLatency += b.avgLatencyMs * b.requestCount;
    byDate.set(
      date,
      row,
    );
  }

  return [...byDate.values()]
    .map(({
      totalLatency, ...row
    }) => ({
      ...row,
      successCount: row.requests - row.errorCount,
      avgLatencyMs: weightedLatency(
        totalLatency,
        row.requests,
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** One row per API key, joined to the key list for its name and prefix. */
export function toApiKeyUsage(
  buckets: ConsoleUsageAnalyticsBucket[],
  apiKeys: ApiKey[],
): ApiKeyUsage[] {
  const byKey = new Map<string, {
    requests: number; errors: number;
  }>();

  for (const b of buckets) {
    const row = byKey.get(b.apiKeyId) ?? {
      requests: 0, errors: 0,
    };
    row.requests += b.requestCount;
    row.errors += b.errorCount;
    byKey.set(
      b.apiKeyId,
      row,
    );
  }

  return [...byKey.entries()]
    .map(([
      keyId,
      row,
    ]) => {
      const key = apiKeys.find(k => k.id === keyId);
      return {
        keyId,
        keyName: key?.name ?? "Unknown key",
        keyPrefix: key?.keyPrefix ?? "",
        requests: row.requests,
        successRate: percent(
          row.requests - row.errors,
          row.requests,
        ),
        lastUsed: key?.lastUsedAt ?? null,
      };
    })
    .sort((a, b) => b.requests - a.requests);
}

/** Totals across the whole window, plus the most recent day on its own. */
export function toSummary(daily: DailyApiUsage[]): ApiUsageSummary {
  const totalRequests = daily.reduce(
    (s, d) => s + d.requests,
    0,
  );
  const totalErrors = daily.reduce(
    (s, d) => s + d.errorCount,
    0,
  );
  const totalLatency = daily.reduce(
    (s, d) => s + d.avgLatencyMs * d.requests,
    0,
  );
  const today = daily.at(-1);

  return {
    totalRequests,
    successRate: percent(
      totalRequests - totalErrors,
      totalRequests,
    ),
    avgLatencyMs: weightedLatency(
      totalLatency,
      totalRequests,
    ),
    requestsToday: today?.requests ?? 0,
    errorRateToday: today
      ? percent(
          today.errorCount,
          today.requests,
        )
      : 0,
  };
}
