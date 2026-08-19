import type { TimeRange } from "./TimeRangeSelect";

/** Slice/scale a demo dataset to the chosen window. */
export function sliceByRange<T>(data: T[], range: TimeRange): T[] {
  if (!data?.length)
    return data;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  if (days >= data.length)
    return data;
  return data.slice(-days);
}
