import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
} from "lucide-react";

import { Button } from "@/components/shadcn/button";

/** The design's resume gate: shown on /apply while an application is saved in this browser. */
export function ApplicationResumeScreen({
  onContinue,
  onNew,
  onBack,
}: {
  onContinue: () => void;
  onNew: () => void;
  onBack: () => void;
}) {
  const options = [
    {
      key: "continue",
      label: "Continue your application",
      icon: FileText,
      onClick: onContinue,
    },
    {
      key: "new",
      label: "Start a new application",
      icon: Plus,
      onClick: onNew,
    },
  ];

  return (
    <section>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">You have an application in progress</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We saved your progress in this browser. Continue where you stopped or start a new application.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {options.map(option => (
          <Button
            key={option.key}
            variant="outline"
            onClick={option.onClick}
            className="group h-auto min-h-48 min-w-0 flex-col items-start gap-6 whitespace-normal rounded-2xl border-warning/30 bg-card p-6 text-left transition-colors hover:border-warning/60 hover:bg-warning/5"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning"
              aria-hidden="true"
            >
              <option.icon className="h-6 w-6" />
            </span>
            <span className="flex w-full items-center justify-between gap-3 text-base font-semibold text-foreground">
              {option.label}
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-warning" />
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
