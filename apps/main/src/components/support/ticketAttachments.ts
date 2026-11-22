import { toast } from "sonner";

// Mirrors the server: MAX_ATTACHMENTS_PER_CALL, MAX_TICKET_ATTACHMENT_BYTES and
// ALLOWED_TICKET_ATTACHMENT_TYPES in the auth service.
export const MAX_TICKET_FILES = 5;
export const MAX_TICKET_FILE_MB = 10;
export const MIN_TICKET_TEXT = 3;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const TICKET_FILE_ACCEPT = [
  ...ALLOWED_TYPES,
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".xls",
  ".xlsx",
].join(",");

export const TICKET_FILE_HINT = `JPG, PNG, WebP, GIF, PDF, Word, Excel, CSV or TXT · up to ${MAX_TICKET_FILE_MB}MB each · max ${MAX_TICKET_FILES} files`;

/** `current` plus the acceptable files of `incoming`, with a toast for each one left out. */
export function addTicketFiles(current: File[], incoming: FileList | null): File[] {
  const next = [...current];
  for (const file of Array.from(incoming ?? [])) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`${file.name} is not an accepted file type`);
      continue;
    }
    if (file.size > MAX_TICKET_FILE_MB * 1024 * 1024) {
      toast.error(`${file.name} exceeds ${MAX_TICKET_FILE_MB}MB`);
      continue;
    }
    if (next.length >= MAX_TICKET_FILES) {
      toast.error(`You can attach up to ${MAX_TICKET_FILES} files`);
      break;
    }
    next.push(file);
  }
  return next;
}
