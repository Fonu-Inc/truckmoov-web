/**
 * Driver performance score (0-100), blended from rating (50%), trip experience
 * capped at 300 (30%), and standing based on status (20%).
 *
 * ponytail: dummy weighting ported from fleetflow-pro until the backend exposes
 * a real score — upgrade path is to fetch it server-side and drop this file.
 */
export function getDriverPerformanceScore(driver: {
  rating?: number | null;
  totalTrips?: number | null;
  status?: string | null;
}): number {
  const rating = Number(driver.rating) || 0;
  const trips = Number(driver.totalTrips) || 0;

  const ratingPart = Math.min(rating / 5, 1) * 50;
  const experiencePart = Math.min(trips / 300, 1) * 30;

  const standing
    = driver.status === "available"
      ? 1
      : driver.status === "active"
        ? 0.8
        : driver.status === "offline"
          ? 0.35
          : 0;
  const standingPart = standing * 20;

  return Math.round(ratingPart + experiencePart + standingPart);
}

export function getPerformanceBand(score: number): { label: string; className: string } {
  if (score >= 85)
    return { label: "Excellent", className: "bg-success/15 text-success border-success/30" };
  if (score >= 70)
    return { label: "Strong", className: "bg-primary/15 text-primary border-primary/30" };
  if (score >= 50)
    return { label: "Fair", className: "bg-warning/15 text-warning border-warning/30" };
  return { label: "Needs review", className: "bg-destructive/15 text-destructive border-destructive/30" };
}
