import {
  useCallback, useEffect,
} from "react";

type ShortcutAction = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
};

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT"
        || target.tagName === "TEXTAREA"
        || target.isContentEditable
      ) {
        // Allow Escape key in inputs
        if (event.key !== "Escape")
          return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase()
          && ctrlMatch
          && shiftMatch
          && altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts],
  );

  useEffect(
    () => {
      window.addEventListener(
        "keydown",
        handleKeyDown,
      );
      return () => window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    },
    [handleKeyDown],
  );
}

export function useGlobalShortcuts(callbacks?: {
  onSearch?: () => void;
  onRefresh?: () => void;
}) {
  const shortcuts: ShortcutAction[] = [
    {
      key: "k",
      ctrl: true,
      action: () => callbacks?.onSearch?.(),
      description: "Open search",
    },
    {
      key: "/",
      action: () => callbacks?.onSearch?.(),
      description: "Focus search",
    },
    {
      key: "r",
      ctrl: true,
      shift: true,
      action: () => callbacks?.onRefresh?.(),
      description: "Refresh data",
    },
    {
      key: "Escape",
      action: () => {
        // Close any open dialogs/modals - handled by individual components
        document.dispatchEvent(new CustomEvent("shortcut:escape"));
      },
      description: "Close dialog",
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Helper to format shortcut for display
export function formatShortcut(
  key: string,
  options?: {
    ctrl?: boolean; shift?: boolean; alt?: boolean;
  },
): string {
  const isMac
    = typeof navigator !== "undefined"
      && navigator.platform.toUpperCase().includes("MAC");

  const parts: string[] = [];

  if (options?.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (options?.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (options?.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  // Format the key
  let displayKey = key.toUpperCase();
  if (key === "Escape")
    displayKey = "Esc";
  if (key === "/")
    displayKey = "/";

  parts.push(displayKey);

  return parts.join(isMac ? "" : "+");
}

// Common shortcut definitions
export const SHORTCUTS = {
  search: {
    key: "k", ctrl: true, display: () => formatShortcut(
      "k",
      { ctrl: true },
    ),
  },
  searchAlt: {
    key: "/", display: () => "/",
  },
  refresh: {
    key: "r", ctrl: true, shift: true, display: () => formatShortcut(
      "r",
      {
        ctrl: true, shift: true,
      },
    ),
  },
  escape: {
    key: "Escape", display: () => "Esc",
  },
  save: {
    key: "s", ctrl: true, display: () => formatShortcut(
      "s",
      { ctrl: true },
    ),
  },
  newItem: {
    key: "n", ctrl: true, display: () => formatShortcut(
      "n",
      { ctrl: true },
    ),
  },
} as const;
