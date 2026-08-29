import { useMemo, useState } from "react";
import { GeographicHeatmap } from "@/components/security/GeographicHeatmap";
import type { FailedAttempt, IPGeolocation } from "@/features/security/types";
import { mockFailedAttempts } from "@/features/security/utils/mocks";

export default function GeographicMapPage() {
  const [failedAttempts] = useState<FailedAttempt[]>(mockFailedAttempts);
  const ipGeoData = useMemo(
    () => new Map<string, IPGeolocation>(),
    [],
  );

  return (
    <div className="space-y-6">
      <GeographicHeatmap
        attempts={failedAttempts.map((fa) => {
          const geo = ipGeoData.get(fa.ipAddress);
          return {
            ip: fa.ipAddress,
            country: geo?.country || "Unknown",
            countryCode: geo?.countryCode || "XX",
            city: geo?.city || "Unknown",
            count: fa.attempts,
            threatLevel: (geo?.threat?.threatLevel as "low" | "medium" | "high") || "medium",
            lastAttempt: new Date(fa.timestamp),
          };
        })}
      />
    </div>
  );
}
