"use client";

import type { StockModel } from "@truckmoov/api/auth/device-stock";
import { useQuery } from "@tanstack/react-query";
import { supportedStockModels } from "@truckmoov/api/auth/device-stock";
import {
  useId, useState,
} from "react";

export function DeviceStockModelSelects({
  value, onChange, disabled = false,
}: {
  value?: string; onChange: (model: StockModel | null) => void; disabled?: boolean;
}) {
  const {
    data: models = [], isPending, isError,
  } = useQuery({
    queryKey: ["supported-device-stock-models"], queryFn: supportedStockModels,
  });
  const [
    selected,
    setSelected,
  ] = useState<string>();
  const baseId = useId();
  const model = models.find(m => m.id === value);
  const manufacturer = selected ?? model?.manufacturer ?? "";
  const manufacturers = Array.from(new Set(models.map(m => m.manufacturer))).sort();
  const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label
        className="grid gap-1 text-sm font-medium"
        htmlFor={`${baseId}-manufacturer`}
      >
        Manufacturer
        <select
          required
          className={field}
          id={`${baseId}-manufacturer`}
          disabled={disabled || isPending || isError}
          value={manufacturer}
          onChange={(e) => {
            setSelected(e.target.value);
            onChange(null);
          }}
        >
          <option value="">{isPending ? "Loading manufacturers…" : "Select manufacturer"}</option>
          {manufacturers.map(m => (
            <option
              key={m}
              value={m}
            >
              {m}
            </option>
          ))}
        </select>
      </label>
      <label
        className="grid gap-1 text-sm font-medium"
        htmlFor={`${baseId}-model`}
      >
        Model
        <select
          required
          className={field}
          id={`${baseId}-model`}
          disabled={disabled || !manufacturer}
          value={value ?? ""}
          onChange={e => onChange(models.find(m => m.id === e.target.value) ?? null)}
        >
          <option value="">Select model</option>
          {models.filter(m => m.manufacturer === manufacturer).map(m => (
            <option
              key={m.id}
              value={m.id}
            >
              {m.model}
            </option>
          ))}
        </select>
      </label>
      {(isError || (!isPending && !models.length)) && <p className="text-sm text-destructive sm:col-span-2">{isError ? "Could not load supported models." : "No supported models are available."}</p>}
    </div>
  );
}
