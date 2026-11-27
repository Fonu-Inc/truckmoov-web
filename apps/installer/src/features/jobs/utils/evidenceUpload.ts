import type { InstallerJobDetail } from "@truckmoov/api/auth";

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
/** The only category the API accepts today; used when the options have not loaded. */
export const DEFAULT_EVIDENCE_CATEGORY = "device_installation";

/** Same file picked twice arrives as two File objects, so identity is name + size + mtime. */
export const evidenceFileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

export type JobEvidence = InstallerJobDetail["evidence"][number];

/** Legacy photos (no vehicleId) cover every vehicle, the same as the server's gate. */
export function evidenceCoverage(units: InstallerJobDetail["units"], evidence: JobEvidence[]) {
  const vehicleIds = units.flatMap(u => (u.vehicleId ? [u.vehicleId] : []));
  const covered = vehicleIds.filter(id => evidence.some(e => !e.vehicleId || e.vehicleId === id)).length;
  return {
    covered,
    total: vehicleIds.length,
    met: evidence.length > 0 && covered === vehicleIds.length,
  };
}

export function evidenceErrorMessage(statusCode?: number) {
  switch (statusCode) {
    case 400:
      return "This photo was rejected. Try a different photo.";
    case 413:
      return "The photo must be 10 MB or smaller.";
    case 409:
      return "This job changed. It has been reloaded.";
    case 403:
    case 404:
      return "This job is no longer available to you.";
    case 503:
      return "Upload is temporarily unavailable. Try again.";
    default:
      return "Upload failed. Try again.";
  }
}

export function removeErrorMessage(statusCode?: number) {
  return [
    409,
    403,
    404,
  ].includes(statusCode ?? 0) ? evidenceErrorMessage(statusCode) : "Could not remove the photo. Try again.";
}
