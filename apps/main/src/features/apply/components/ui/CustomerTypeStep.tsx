import type { ApplicantCustomerType } from "@/features/apply/utils/applyTypes";

import {
  ArrowRight,
  Building2,
  Check,
  Truck,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";

type CustomerTypeStepProps = {
  value: ApplicantCustomerType | null;
  onChange: (value: ApplicantCustomerType) => void;
  onNext: () => void;
};

const OPTIONS: {
  id: ApplicantCustomerType;
  title: string;
  subtitle: string;
  icon: typeof Building2;
  points: string[];
}[] = [
  {
    id: "enterprise",
    title: "Enterprise Customer",
    subtitle: "For businesses and organizations managing a Large company fleet.",
    icon: Building2,
    points: [
      "No limit on the number of vehicles",
      "Manage company vehicles",
      "Manage fleet devices",
      "Manage SIM cards and connectivity",
      "Request and purchase fleet services",
      "Track fleet activities, installations, and service status",
    ],
  },
  {
    id: "owner_operator",
    title: "Owner Operator / Individual Customer",
    subtitle: "For individuals, companies and organisations with 10 vehicles or fewer.",
    icon: Truck,
    points: [
      "Maximum of 10 vehicles",
      "Manage personal vehicles",
      "Manage fleet devices",
      "Manage SIM cards and connectivity",
      "Request and purchase fleet services",
      "Track vehicle, device, and installation status",
    ],
  },
];

export function CustomerTypeStep({
  value,
  onChange,
  onNext,
}: CustomerTypeStepProps) {
  const [
    selection,
    setSelection,
  ] = useState<ApplicantCustomerType | null>(value);

  function handleContinue() {
    if (!selection)
      return;
    onChange(selection);
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">What type of customer are you?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the option that matches how you operate. Owner Operator / Individual accounts are
          limited to 10 vehicles — choose Enterprise Customer if you run more than 10.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = selection === option.id;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelection(option.id)}
              className={cn(
                "group relative rounded-2xl border p-5 text-left transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                  : "border-border/70 bg-card/50 hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <option.icon className="h-5 w-5" />
                </div>
                {selected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <p className="mt-6 text-base font-semibold text-foreground">{option.title}</p>
              <p className="mt-1.5 text-xs font-medium text-primary">{option.subtitle}</p>
              <ul className="mt-5 space-y-2.5">
                {option.points.map(point => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-border/60 pt-6">
        <Button
          size="lg"
          className="min-w-40"
          disabled={!selection}
          onClick={handleContinue}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
