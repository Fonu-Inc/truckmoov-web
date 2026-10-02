import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import { useDrafts } from "../../useDrafts";
import type { Edit, FormatKind } from "./formatting";
import { applyFormat, expandSlash, insertAt, slashQuery } from "./formatting";

export type ComposerText = {
  ref: RefObject<HTMLTextAreaElement | null>;
  text: string;
  slash: string | null;
  setText: (value: string, caret: number) => void;
  format: (kind: FormatKind) => void;
  insert: (value: string) => void;
  expand: (body: string) => void;
  clear: () => void;
};

/** The draft text, kept per conversation, with the edits the toolbar makes at the caret. */
export function useComposerText(conversationId: string): ComposerText {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const text = useDrafts(s => s.byConversation[conversationId] ?? "");
  const [caret, setCaret] = useState(0);

  const setText = useCallback((value: string, position: number) => {
    useDrafts.getState().set(conversationId, value);
    setCaret(position);
  }, [conversationId]);

  const selection = () => ({
    start: ref.current?.selectionStart ?? text.length,
    end: ref.current?.selectionEnd ?? text.length,
  });

  const apply = (edit: Edit) => {
    setText(edit.text, edit.selectionEnd);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  return {
    ref,
    text,
    slash: slashQuery(text, caret),
    setText,
    format: (kind) => {
      const { start, end } = selection();
      apply(applyFormat(text, start, end, kind));
    },
    insert: (value) => {
      const { start, end } = selection();
      apply(insertAt(text, start, end, value));
    },
    expand: body => apply(expandSlash(text, caret, body)),
    clear: () => {
      useDrafts.getState().clear(conversationId);
      setCaret(0);
    },
  };
}
