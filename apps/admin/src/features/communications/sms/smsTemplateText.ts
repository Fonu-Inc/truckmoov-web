import type { SmsTemplateCategory } from "@truckmoov/api/notification";

export const SMS_TEMPLATE_LIMIT = 480;

/** One SMS segment is 160 characters; longer texts are split and billed per part. */
const SEGMENT = 160;

export const CATEGORY_LABEL: Record<SmsTemplateCategory, string> = {
  general: "General",
  job: "Job notifications",
  delivery: "Delivery updates",
  safety: "Safety alerts",
  payment: "Payments",
};

const PLACEHOLDER = /\{\{\s*([A-Z]\w*)\s*\}\}/gi;

export function variablesOf(content: string): string[] {
  const found: string[] = [];
  for (const match of content.matchAll(PLACEHOLDER)) {
    if (!found.includes(match[1]))
      found.push(match[1]);
  }
  return found;
}

export function renderSms(content: string, values: Record<string, string>): string {
  return content.replace(
    PLACEHOLDER,
    (whole, name: string) => values[name]?.trim() || whole,
  );
}

export function segmentCount(text: string): number {
  return text.length === 0 ? 0 : Math.ceil(text.length / SEGMENT);
}
