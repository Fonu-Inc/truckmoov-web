import type { ComponentPropsWithoutRef } from "react";

import { CITIES_BY_STATE } from "@truckmoov/api/auth";
import { Check, ChevronsUpDown } from "lucide-react";
import { forwardRef, useState } from "react";

import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { cn } from "@/lib/utils";

type CityComboboxProps = Omit<ComponentPropsWithoutRef<"button">, "value" | "onChange"> & {
  /** API state name (`NIGERIAN_STATES`), e.g. "FCT". Empty disables the picker. */
  state: string;
  value: string;
  onChange: (city: string) => void;
};

/** Search the state's LGAs, or keep what was typed for places that aren't LGA names. */
export const CityCombobox = forwardRef<HTMLButtonElement, CityComboboxProps>(({
  state,
  value,
  onChange,
  className,
  disabled,
  ...props
}, ref) => {
  const [
    open,
    setOpen,
  ] = useState(false);
  const [
    search,
    setSearch,
  ] = useState("");
  const typed = search.trim();
  // Plain substring match: cmdk's fuzzy scoring would rank the "Use …" item first.
  const cities = (CITIES_BY_STATE[state] ?? []).filter(city => city.toLowerCase().includes(typed.toLowerCase()));
  const listed = cities.some(city => city.toLowerCase() === typed.toLowerCase());

  function pick(city: string) {
    onChange(city);
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          {...props}
          disabled={disabled || !state}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || (state ? "Search your city" : "Select a state first")}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No matching city.</CommandEmpty>
            <CommandGroup>
              {cities.map(city => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => pick(city)}
                >
                  <Check className={cn(
                    "mr-2 h-4 w-4",
                    value === city ? "opacity-100" : "opacity-0",
                  )}
                  />
                  {city}
                </CommandItem>
              ))}
              {typed && !listed && (
                <CommandItem
                  value={`use:${typed}`}
                  onSelect={() => pick(typed)}
                >
                  Use &ldquo;
                  {typed}
                  &rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});
CityCombobox.displayName = "CityCombobox";
