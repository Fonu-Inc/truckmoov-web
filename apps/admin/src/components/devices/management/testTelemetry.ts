export const IMEI_PATTERN = /^\d{15}$/;

/** Blank means "use the default"; anything else must be a number inside the range. */
export function parseCoordinate(
  raw: string,
  limit: number,
): {
  value?: number; valid: boolean;
} {
  const text = raw.trim();
  if (!text)
    return { valid: true };
  const value = Number(text);
  if (!Number.isFinite(value) || Math.abs(value) > limit)
    return { valid: false };
  return {
    value,
    valid: true,
  };
}
