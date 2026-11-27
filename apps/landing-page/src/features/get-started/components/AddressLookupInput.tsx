"use client";

import type {
  ComponentProps,
  KeyboardEvent,
  Ref,
} from "react";
import type {
  LocationPlace,
  LocationSuggestion,
} from "@/features/get-started/utils/addressLookup";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { Loader2 } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  findLocations,
  LOOKUP_DEBOUNCE_MS,
  LOOKUP_MIN_CHARS,
} from "@/features/get-started/utils/addressLookup";
import { FIELD_CLASS } from "@/features/get-started/utils/getStartedContent";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

export type PickedLocation = {
  address: string;
  lat: number;
  lng: number;
  place?: LocationPlace;
};

const LOOKUP_ERROR = "Couldn't look up addresses right now";

/**
 * A text input that searches Nigerian addresses (Photon) as you type and reports the one the
 * applicant picks. Copy of apps/main MapLocationInput (embedded, nigeriaOnly). The text is
 * controlled by the form; `selectedAddress` is the text that was last picked.
 */
export function AddressLookupInput({
  text,
  onTextChange,
  selectedAddress,
  onSelect,
  onBlur,
  inputRef,
  onLookupFailedChange,
  placeholder,
  id,
  ...ariaProps
}: Pick<ComponentProps<"input">, "id" | "aria-invalid" | "aria-describedby"> & {
  text: string;
  onTextChange: (text: string) => void;
  selectedAddress: string | null;
  onSelect: (location: PickedLocation) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  onLookupFailedChange?: (failed: boolean) => void;
  placeholder?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listId = `${inputId}-suggestions`;
  const [
    suggestions,
    setSuggestions,
  ] = useState<LocationSuggestion[]>([]);
  const [
    isSearching,
    setIsSearching,
  ] = useState(false);
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);
  const [
    highlightedIndex,
    setHighlightedIndex,
  ] = useState(-1);
  const [
    notFound,
    setNotFound,
  ] = useState(false);
  const [
    lookupFailed,
    setLookupFailed,
  ] = useState(false);
  // A restored draft must not trigger a search until the user types.
  const [
    userEdited,
    setUserEdited,
  ] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // The Enter-key search in flight; typing aborts it so its result can't replace newer text.
  const enterSearchRef = useRef<AbortController | null>(null);

  const query = text.trim();
  const searchDue = userEdited && query.length >= LOOKUP_MIN_CHARS && query !== selectedAddress?.trim();
  const listOpen = isOpen && searchDue && suggestions.length > 0;

  useEffect(
    () => {
      onLookupFailedChange?.(lookupFailed);
    },
    [
      lookupFailed,
      onLookupFailedChange,
    ],
  );

  useEffect(
    () => {
      if (!searchDue)
        return;

      const controller = new AbortController();
      const timeout = window.setTimeout(
        async () => {
          setIsSearching(true);
          try {
            const results = await findLocations(
              query,
              controller.signal,
            );
            setLookupFailed(false);
            setSuggestions(results);
            setHighlightedIndex(-1);
            setIsOpen(results.length > 0);
          }
          catch (searchError) {
            if ((searchError as Error).name !== "AbortError") {
              setSuggestions([]);
              setIsOpen(false);
              setLookupFailed(true);
            }
          }
          finally {
            if (!controller.signal.aborted)
              setIsSearching(false);
          }
        },
        LOOKUP_DEBOUNCE_MS,
      );

      return () => {
        window.clearTimeout(timeout);
        controller.abort();
      };
    },
    [
      query,
      searchDue,
    ],
  );

  useEffect(
    () => {
      const closeList = (event: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node))
          setIsOpen(false);
      };
      document.addEventListener(
        "mousedown",
        closeList,
      );
      return () => document.removeEventListener(
        "mousedown",
        closeList,
      );
    },
    [],
  );

  function pick(result: LocationSuggestion) {
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setNotFound(false);
    setLookupFailed(false);
    onSelect({
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      place: result.place,
    });
  }

  // Enter without a highlighted suggestion searches once and takes the first hit.
  async function submit() {
    const highlighted = suggestions[highlightedIndex];
    if (listOpen && highlighted) {
      pick(highlighted);
      return;
    }
    if (!query || isSearching)
      return;

    const controller = new AbortController();
    enterSearchRef.current = controller;
    setIsSearching(true);
    setNotFound(false);
    try {
      const [result] = await findLocations(
        query,
        controller.signal,
      );
      if (controller.signal.aborted)
        return;
      setLookupFailed(false);
      if (!result) {
        setNotFound(true);
        return;
      }
      pick(result);
    }
    catch (searchError) {
      if ((searchError as Error).name !== "AbortError")
        setLookupFailed(true);
    }
    finally {
      if (enterSearchRef.current === controller) {
        enterSearchRef.current = null;
        setIsSearching(false);
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter must never submit the wizard form from here.
    if (event.key === "Enter") {
      if (event.nativeEvent.isComposing)
        return;
      event.preventDefault();
      void submit();
      return;
    }

    if (!listOpen)
      return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex(current => current < suggestions.length - 1 ? current + 1 : 0);
    }
    else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(current => current > 0 ? current - 1 : suggestions.length - 1);
    }
    else if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <MapPin
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={inputId}
        ref={inputRef}
        type="text"
        value={text}
        onChange={(event) => {
          onTextChange(event.target.value);
          // A changed query voids the results and any Enter search in flight; a stray space
          // doesn't change the query.
          if (event.target.value.trim() !== query) {
            enterSearchRef.current?.abort();
            if (enterSearchRef.current) {
              enterSearchRef.current = null;
              setIsSearching(false);
            }
            setSuggestions([]);
            setHighlightedIndex(-1);
          }
          setUserEdited(true);
          setNotFound(false);
          if (event.target.value.trim().length < LOOKUP_MIN_CHARS) {
            setLookupFailed(false);
            setIsSearching(false);
          }
        }}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={200}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-activedescendant={highlightedIndex >= 0 && listOpen ? `${listId}-${highlightedIndex}` : undefined}
        aria-invalid={ariaProps["aria-invalid"]}
        aria-describedby={ariaProps["aria-describedby"]}
        className={cn(
          FIELD_CLASS,
          "pr-10 pl-10",
        )}
      />
      {isSearching && (
        <Loader2 className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {listOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-[15px] border border-border bg-background p-1 shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <button
              id={`${listId}-${index}`}
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={highlightedIndex === index}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => pick(suggestion)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm text-heading transition-colors",
                highlightedIndex === index ? "bg-surface" : "hover:bg-surface",
              )}
            >
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <span className="line-clamp-2">{suggestion.address}</span>
            </button>
          ))}
        </div>
      )}

      {(notFound || lookupFailed) && (
        <p
          role="alert"
          className="mt-1.5 text-xs text-destructive"
        >
          {notFound ? "Location not found. Try a more specific address." : LOOKUP_ERROR}
        </p>
      )}
    </div>
  );
}
