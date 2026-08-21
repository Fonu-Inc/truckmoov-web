import type {
  ApiKey, ConsoleUsageAnalyticsBucket,
} from "@truckmoov/api/console";
import {
  describe, expect, it,
} from "vitest";

import {
  toApiKeyUsage, toDailyUsage, toSummary,
} from "./usageAnalytics";

function bucket(over: Partial<ConsoleUsageAnalyticsBucket>): ConsoleUsageAnalyticsBucket {
  return {
    apiKeyId: "key-1",
    tenantId: "tenant-1",
    hourBucket: "2026-03-01T00:00:00Z",
    requestCount: 0,
    errorCount: 0,
    avgLatencyMs: 0,
    ...over,
  };
}

function apiKey(over: Partial<ApiKey>): ApiKey {
  return {
    id: "key-1",
    tenantId: "tenant-1",
    name: "ERP Integration",
    keyPrefix: "tm_live_abc",
    scopes: ["jobs.read"],
    status: "active",
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00Z",
    revokedAt: null,
    lastUsedAt: "2026-03-01T09:00:00Z",
    expiresAt: null,
    ...over,
  };
}

describe(
  "usage analytics aggregation",
  () => {
    it(
      "collapses hourly buckets in the same day into one row",
      () => {
        const daily = toDailyUsage([
          bucket({
            hourBucket: "2026-03-01T01:00:00Z", requestCount: 100, errorCount: 10, avgLatencyMs: 100,
          }),
          bucket({
            hourBucket: "2026-03-01T02:00:00Z", requestCount: 300, errorCount: 20, avgLatencyMs: 200,
          }),
          bucket({
            hourBucket: "2026-03-02T01:00:00Z", requestCount: 50, errorCount: 0, avgLatencyMs: 80,
          }),
        ]);

        expect(daily).toHaveLength(2);
        expect(daily[0].date).toBe("2026-03-01");
        expect(daily[0].requests).toBe(400);
        expect(daily[0].errorCount).toBe(30);
        expect(daily[0].successCount).toBe(370);
        // Request-weighted, not (100 + 200) / 2 = 150.
        expect(daily[0].avgLatencyMs).toBe(175);
        expect(daily[1].date).toBe("2026-03-02");
      },
    );

    it(
      "returns days oldest first regardless of bucket order",
      () => {
        const daily = toDailyUsage([
          bucket({
            hourBucket: "2026-03-03T01:00:00Z", requestCount: 1,
          }),
          bucket({
            hourBucket: "2026-03-01T01:00:00Z", requestCount: 1,
          }),
        ]);

        expect(daily.map(d => d.date)).toEqual([
          "2026-03-01",
          "2026-03-03",
        ]);
      },
    );

    it(
      "rolls buckets up per API key and joins the key list",
      () => {
        const usage = toApiKeyUsage(
          [
            bucket({
              apiKeyId: "key-1", requestCount: 100, errorCount: 5,
            }),
            bucket({
              apiKeyId: "key-2", requestCount: 400, errorCount: 0,
            }),
            bucket({
              apiKeyId: "key-1", requestCount: 100, errorCount: 5,
            }),
          ],
          [
            apiKey({ id: "key-1" }),
            apiKey({
              id: "key-2", name: "Mobile Backend", keyPrefix: "tm_live_xyz",
            }),
          ],
        );

        // Busiest key first.
        expect(usage[0].keyId).toBe("key-2");
        expect(usage[0].keyName).toBe("Mobile Backend");
        expect(usage[0].successRate).toBe(100);
        expect(usage[1].requests).toBe(200);
        expect(usage[1].successRate).toBe(95);
      },
    );

    it(
      "falls back when a bucket references a key that is no longer listed",
      () => {
        const usage = toApiKeyUsage(
          [
            bucket({
              apiKeyId: "deleted-key", requestCount: 10,
            }),
          ],
          [],
        );

        expect(usage[0].keyName).toBe("Unknown key");
        expect(usage[0].keyPrefix).toBe("");
        expect(usage[0].lastUsed).toBeNull();
      },
    );

    it(
      "summarises totals and treats the most recent day as today",
      () => {
        const summary = toSummary(toDailyUsage([
          bucket({
            hourBucket: "2026-03-01T01:00:00Z", requestCount: 100, errorCount: 0, avgLatencyMs: 100,
          }),
          bucket({
            hourBucket: "2026-03-02T01:00:00Z", requestCount: 100, errorCount: 25, avgLatencyMs: 300,
          }),
        ]));

        expect(summary.totalRequests).toBe(200);
        expect(summary.successRate).toBe(88);
        expect(summary.avgLatencyMs).toBe(200);
        expect(summary.requestsToday).toBe(100);
        expect(summary.errorRateToday).toBe(25);
      },
    );

    it(
      "returns zeros rather than NaN for an empty window",
      () => {
        expect(toDailyUsage([])).toEqual([]);
        expect(toSummary([])).toEqual({
          totalRequests: 0, successRate: 0, avgLatencyMs: 0, requestsToday: 0, errorRateToday: 0,
        });
      },
    );
  },
);
