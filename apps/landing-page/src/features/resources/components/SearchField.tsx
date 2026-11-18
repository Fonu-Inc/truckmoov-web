"use client";

import { XCircle } from "@phosphor-icons/react/dist/ssr";
import { Search } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/shared/utils";

const VARIANTS = {
  /** Grey pill (Documentation). */
  filled: {
    root: "h-[50px] rounded-full bg-field pr-3 pl-[11px]",
    icon: "size-4 text-heading/60",
    input: "text-xs placeholder:text-heading/60",
  },
  /** White box with a soft drop shadow (Help Articles). */
  outlined: {
    root: "h-12 rounded-[15px] border border-border-field bg-background pr-4 pl-[11px] shadow-[0_4px_5px_0_color-mix(in_srgb,var(--ink)_10%,transparent)]",
    icon: "size-[22px] text-heading",
    input: "text-sm placeholder:text-subtle-foreground",
  },
} as const;

type SearchFieldProps = {
  /** Called with the raw input on every keystroke, and with "" when cleared. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the input. */
  label: string;
  variant?: keyof typeof VARIANTS;
  /** Show the clear (✕) button. */
  clearable?: boolean;
  className?: string;
};

/**
 * Search bar used at the top of the Resources pages; filters client-side. The input is
 * uncontrolled, so this component's props never change while typing: a keystroke
 * re-renders only the results list, not the field.
 */
export function SearchField({
  onChange,
  placeholder = "Search here",
  label,
  variant = "filled",
  clearable = variant === "filled",
  className,
}: SearchFieldProps) {
  const styles = VARIANTS[variant];
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    const input = inputRef.current;
    if (input) {
      input.value = "";
      input.focus();
    }
    onChange("");
  }

  return (
    <div
      role="search"
      className={cn(
        "flex w-full items-center gap-2",
        styles.root,
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className={cn(
          "shrink-0",
          styles.icon,
        )}
      />
      <input
        ref={inputRef}
        type="search"
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-heading outline-none [&::-webkit-search-cancel-button]:hidden",
          styles.input,
        )}
      />
      {clearable && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle-foreground outline-none hover:text-heading focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XCircle
            aria-hidden="true"
            className="size-5"
          />
        </button>
      )}
    </div>
  );
}
