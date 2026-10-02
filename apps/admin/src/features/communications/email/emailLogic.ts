import type { MailAddress } from "@truckmoov/api/auth";

type Person = { address: string; name: string | null };

export function personLabel(person: Person): string {
  return person.name?.trim() || person.address;
}

export function participantsLabel(participants: Person[], ownAddress: string | null): string {
  const others = participants.filter(p => p.address.toLowerCase() !== ownAddress?.toLowerCase());
  const shown = (others.length > 0 ? others : participants).slice(0, 3).map(personLabel);
  return shown.join(", ") || "No participants";
}

/** Comma, semicolon or whitespace separated addresses; anything that is not an address is returned as invalid. */
export function parseAddresses(raw: string): { valid: MailAddress[]; invalid: string[] } {
  const valid: MailAddress[] = [];
  const invalid: string[] = [];
  for (const part of raw.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean)) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part))
      valid.push({ address: part.toLowerCase() });
    else
      invalid.push(part);
  }
  return { valid, invalid };
}

export function replySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`;
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Standard mail ports and the usual security for each. */
export function secureFor(port: number): boolean {
  return port === 465 || port === 993;
}
