export type FormatKind = "bold" | "italic" | "strike" | "code";

const MARKS: Record<FormatKind, string> = { bold: "*", italic: "_", strike: "~", code: "`" };

export type Edit = { text: string; selectionStart: number; selectionEnd: number };

/** Wraps the selection in WhatsApp's own markup, or unwraps it when already wrapped. */
export function applyFormat(text: string, start: number, end: number, kind: FormatKind): Edit {
  const mark = MARKS[kind];
  const selected = text.slice(start, end);
  const wrapped = selected.length >= 2 && selected.startsWith(mark) && selected.endsWith(mark);
  if (wrapped) {
    const inner = selected.slice(1, -1);
    return { text: text.slice(0, start) + inner + text.slice(end), selectionStart: start, selectionEnd: start + inner.length };
  }
  return {
    text: `${text.slice(0, start)}${mark}${selected}${mark}${text.slice(end)}`,
    selectionStart: start + 1,
    selectionEnd: start + 1 + selected.length,
  };
}

export function insertAt(text: string, start: number, end: number, insert: string): Edit {
  const caret = start + insert.length;
  return { text: text.slice(0, start) + insert + text.slice(end), selectionStart: caret, selectionEnd: caret };
}

/** The `/shortcut` being typed at the caret, if any. */
export function slashQuery(text: string, caret: number): string | null {
  const match = /(?:^|\s)\/([a-z0-9_-]*)$/i.exec(text.slice(0, caret));
  return match ? match[1].toLowerCase() : null;
}

/** Replaces the `/shortcut` at the caret with the reply body. */
export function expandSlash(text: string, caret: number, body: string): Edit {
  const head = text.slice(0, caret).replace(/\/[a-z0-9_-]*$/i, "");
  const next = head + body + text.slice(caret);
  const position = head.length + body.length;
  return { text: next, selectionStart: position, selectionEnd: position };
}
