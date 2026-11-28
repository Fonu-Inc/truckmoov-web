"use client";

import { useState } from "react";
import type { OnboardingStockReview, StockSelection } from "@truckmoov/api/auth/device-stock";

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });
const action = "rounded-md border bg-background px-3 py-2 font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const primaryAction = "rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

type Line = OnboardingStockReview["lines"][number];

export function OnboardingStockReviewPanel({ review, selections, onSelectionsChange, onEditingChange }: {
  review: OnboardingStockReview;
  selections: StockSelection[];
  onSelectionsChange: (choices: StockSelection[]) => void;
  onEditingChange: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const line = review.lines.find(entry => entry.requestId === editing);
  const changed = selections.some(choice => !review.lines.some(entry => entry.requestId === choice.requestId
    && entry.replacements.some(item => item.modelId === choice.modelId && item.quantity === choice.quantity)));

  function edit(entry: Line) {
    setDraft(Object.fromEntries(entry.replacements.map(item => [item.modelId, item.quantity])));
    setEditing(entry.requestId);
    onEditingChange(true);
  }
  function close() {
    setEditing(null);
    onEditingChange(false);
  }
  function confirm(entry: Line) {
    const options = entry.options.flatMap(item => {
      const quantity = draft[item.modelId] ?? 0;
      return quantity ? [{ requestId: entry.requestId, modelId: item.modelId, quantity }] : [];
    });
    onSelectionsChange([...selections.filter(item => item.requestId !== entry.requestId), ...options]);
    close();
  }

  if (line) {
    const shortage = line.requested - line.originalNow;
    return <section className="space-y-4 rounded-xl border bg-card p-4 text-sm sm:p-5" aria-label="Choose alternative models">
      <div className="space-y-1">
        <button type="button" className="text-primary underline" onClick={close}>Back to review</button>
        <h3 className="text-base font-semibold">{line.alternativeKind === "models" ? "Other models from " + line.manufacturer : "Other manufacturers in stock"}</h3>
        <p className="text-muted-foreground">{shortage} of {line.requested} {line.manufacturer} {line.model} devices still need stock.</p>
      </div>
      {!line.options.length && <p role="status">These alternatives are no longer available. Go back to review.</p>}
      {line.options.map(item => {
        const chosenElsewhere = line.options.reduce((n, option) => n + (option.modelId === item.modelId ? 0 : draft[option.modelId] ?? 0), 0);
        const maximum = Math.min(item.available, Math.max(0, shortage - chosenElsewhere));
        return <label key={item.modelId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <span className="space-y-1">
            <strong className="block">{item.manufacturer} {item.model}</strong>
            <span className="block text-muted-foreground">{item.available} available · {money.format(review.order.perDeviceNgn)} device and plan · {money.format(review.order.installationPerDeviceNgn)} installation per unit</span>
          </span>
          <span className="flex items-center gap-2">
            Quantity
            <input type="number" min={0} max={maximum} step={1} inputMode="numeric"
              className="w-20 rounded-md border bg-background px-2 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              value={Math.min(maximum, draft[item.modelId] ?? 0)}
              onChange={event => {
                const value = Math.max(0, Math.min(maximum, Math.floor(Number(event.target.value) || 0)));
                setDraft(previous => ({ ...previous, [item.modelId]: value }));
              }} />
          </span>
        </label>;
      })}
      <button type="button" className={primaryAction} onClick={() => confirm(line)}>Review selected devices</button>
    </section>;
  }

  return <section className="space-y-4 rounded-xl border bg-card p-4 text-sm sm:p-5" aria-label="Device availability review">
    <div className="space-y-1">
      <h3 className="text-base font-semibold">Review device availability</h3>
      <p className="text-muted-foreground">Only available devices and alternatives you choose are payable today.</p>
    </div>
    {changed && <p className="rounded-md border bg-muted p-2" role="status">Stock changed. Review the updated quantities and total before continuing.</p>}
    {review.lines.map(entry => <div key={entry.requestId} className="space-y-2 border-b pb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="font-semibold">{entry.manufacturer} {entry.model}</h4>
        <span className="text-muted-foreground">{entry.requested} requested</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Original units available now: <strong>{entry.originalNow}</strong></span>
        <span>Selected alternatives: <strong>{entry.replacements.reduce((n,item) => n + item.quantity,0)}</strong></span>
        <span>Waiting for stock: <strong>{entry.waiting}</strong></span>
      </div>
      {entry.replacements.length > 0 && <ul className="list-inside list-disc text-muted-foreground">
        {entry.replacements.map(item => <li key={item.modelId}>{item.manufacturer} {item.model} × {item.quantity}</li>)}
      </ul>}
      {entry.waiting > 0 && <p className="text-muted-foreground">Waitlisted devices are not charged today.</p>}
      {entry.originalNow < entry.requested && entry.options.length > 0 && <>
        <p className="text-muted-foreground">{entry.originalNow === 0
          ? `${entry.model} is out of stock for ${entry.manufacturer}.`
          : `Only ${entry.originalNow} of ${entry.requested} ${entry.model} devices are in stock.`}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={action} onClick={() => edit(entry)}>
            {entry.alternativeKind === "models" ? "View other models" : "View other manufacturers"}
          </button>
          <button type="button" className={action} onClick={() => onSelectionsChange(selections.filter(item => item.requestId !== entry.requestId))}>Wait for {entry.model}</button>
        </div>
      </>}
    </div>)}
    <div className="flex items-center justify-between gap-3 font-semibold">
      <span>{review.order.deviceCount} payable today</span>
      <span>{money.format(review.order.totalNgn)}</span>
    </div>
  </section>;
}
