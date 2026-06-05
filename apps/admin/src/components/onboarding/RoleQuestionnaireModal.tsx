import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  getRoleQuestionnaire,
  type OnboardingQuestion,
} from "./roleQuestions";

type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;

/**
 * Single-page role-based onboarding form.
 *
 * All steps are stacked vertically inside one scrollable modal. Each step
 * is a labeled section with dropdowns and input fields only — no radios,
 * no per-step pagination. A single "Finish Setup" CTA submits everything.
 */
export function RoleQuestionnaireModal() {
  const { user } = useAuthStore();
  const {
    showQuestionnaire,
    completeQuestionnaire,
    skipOnboarding,
    setQuestionnaireAnswers,
  } = useOnboardingStore();

  const questionnaire = useMemo(
    () => getRoleQuestionnaire(user?.role),
    [user?.role],
  );

  const [answers, setAnswers] = useState<Answers>({});

  const setAnswer = (qid: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const allRequired = useMemo(() => {
    return questionnaire.steps.flatMap((s) => s.questions).filter((q) => q.required);
  }, [questionnaire]);

  const isFormValid = allRequired.every((q) => {
    const v = answers[q.id];
    if (q.type === "multi") return Array.isArray(v) && v.length > 0;
    return typeof v === "string" && v.trim().length > 0;
  });

  const handleSubmit = () => {
    if (!isFormValid) return;
    setQuestionnaireAnswers(answers);
    completeQuestionnaire();
  };

  return (
    <Dialog
      open={showQuestionnaire}
      onOpenChange={(o) => {
        if (!o) skipOnboarding();
      }}
    >
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden bg-card"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="border-b border-border px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {questionnaire.audience} · Quick Setup
              </p>
              <h2 className="text-base font-semibold leading-tight text-foreground">
                Tell us about your operation
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Fill in the sections below — it only takes a minute.
              </p>
            </div>
          </div>
        </div>

        {/* Body — single scrollable form, vertical steps */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {questionnaire.steps.map((step, idx) => (
              <section
                key={step.id}
                className={cn(
                  "space-y-4",
                  idx > 0 && "border-t border-border pt-8",
                )}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Step {idx + 1}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.subtitle}
                  </p>
                </div>

                <div className="space-y-4">
                  {step.questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Footer — single CTA */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isFormValid}>
            Finish Setup
            <Check className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Field renderers ---------------- */

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: OnboardingQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">
        {question.prompt}
        {question.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {question.helper && (
        <p className="text-xs text-muted-foreground">{question.helper}</p>
      )}

      {question.type === "single" && (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "multi" && (
        <MultiSelectDropdown
          options={question.options ?? []}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      )}

      {(question.type === "text" || question.type === "number") && (
        <Input
          type={question.type === "number" ? "number" : "text"}
          placeholder={question.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function MultiSelectDropdown({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const label =
    value.length === 0
      ? "Select one or more"
      : value.length === 1
        ? options.find((o) => o.id === value[0])?.label ?? "1 selected"
        : `${value.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            value.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const active = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent/50",
                )}
              >
                <span>{opt.label}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}



