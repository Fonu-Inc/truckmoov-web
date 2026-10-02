const PLACEHOLDER = /\{\{\s*(\d+)\s*\}\}/g;

export const TEMPLATE_NAME_PATTERN = /^[a-z0-9_]+$/;

export type TemplateDraft = {
  header: string;
  body: string;
  footer: string;
  examples: string[];
};

/** Placeholder numbers in order of first use, without repeats. */
export function placeholderNumbers(text: string): number[] {
  const seen = new Set<number>();
  for (const match of text.matchAll(PLACEHOLDER))
    seen.add(Number(match[1]));
  return [...seen].sort((a, b) => a - b);
}

/** Meta wants positional placeholders numbered 1..n with no gaps. */
export function placeholdersAreSequential(text: string) {
  return placeholderNumbers(text).every((value, index) => value === index + 1);
}

export function fillPlaceholders(text: string, values: Record<string, string>) {
  return text.replace(PLACEHOLDER, (match, index: string) => values[index]?.trim() || match);
}

export function buildTemplateComponents(draft: TemplateDraft): Record<string, unknown>[] {
  const components: Record<string, unknown>[] = [];
  if (draft.header.trim())
    components.push({ type: "HEADER", format: "TEXT", text: draft.header.trim() });
  const body: Record<string, unknown> = { type: "BODY", text: draft.body.trim() };
  const count = placeholderNumbers(draft.body).length;
  if (count > 0)
    body.example = { body_text: [draft.examples.slice(0, count).map(value => value.trim())] };
  components.push(body);
  if (draft.footer.trim())
    components.push({ type: "FOOTER", text: draft.footer.trim() });
  return components;
}

type Component = Record<string, unknown>;

function componentOf(components: Component[] | undefined, type: string) {
  return components?.find(component => String(component.type).toUpperCase() === type);
}

export function bodyTextOf(components: Component[] | undefined) {
  return String(componentOf(components, "BODY")?.text ?? "");
}

/**
 * A template can be sent from the inbox when its variables are all in the
 * body or a text header. A media header or a URL button with a variable needs
 * input the inbox does not collect.
 */
export function isSendableFromInbox(components: Component[] | undefined) {
  const header = componentOf(components, "HEADER");
  if (header && header.format && String(header.format).toUpperCase() !== "TEXT")
    return false;
  const buttons = componentOf(components, "BUTTONS")?.buttons;
  if (!Array.isArray(buttons))
    return true;
  return !buttons.some(button => String((button as Component).url ?? "").includes("{{"));
}

export function variableNumbersOf(components: Component[] | undefined) {
  const header = String(componentOf(components, "HEADER")?.text ?? "");
  return placeholderNumbers(`${header} ${bodyTextOf(components)}`);
}
