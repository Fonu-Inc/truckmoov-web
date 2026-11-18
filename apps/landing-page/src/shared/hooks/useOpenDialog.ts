"use client";

import type { DialogId } from "@/shared/stores/dialogStore";
import { useSyncExternalStore } from "react";
import { dialogStore } from "@/shared/stores/dialogStore";

/** The currently open site dialog (or null). Only the DialogHost should subscribe. */
export function useOpenDialog(): DialogId | null {
  return useSyncExternalStore(
    dialogStore.subscribe,
    dialogStore.getSnapshot,
    dialogStore.getServerSnapshot,
  );
}
