import { create } from "zustand";

type DraftState = {
  byConversation: Record<string, string>;
  set: (conversationId: string, text: string) => void;
  clear: (conversationId: string) => void;
};

export const useDrafts = create<DraftState>(set => ({
  byConversation: {},
  set: (conversationId, text) => set(s => ({
    byConversation: {
      ...s.byConversation, [conversationId]: text,
    },
  })),
  clear: conversationId => set((s) => {
    const {
      [conversationId]: _removed, ...rest
    } = s.byConversation;
    return { byConversation: rest };
  }),
}));
