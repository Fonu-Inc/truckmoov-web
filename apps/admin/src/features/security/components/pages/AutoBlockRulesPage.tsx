import { useQuery } from "@tanstack/react-query";
import {
  getSystemAutoBlockRulesQueryOptions,
  useUpdateSystemAutoBlockRule,
} from "@truckmoov/api/auth";
import type { SystemAutoBlockRule } from "@truckmoov/api/auth";
import { Loader2, ShieldAlert, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";

type DraftMap = Record<string, {
  maxAttempts: string;
  windowMinutes: string;
  blockDurationHours: string; // "" means permanent
}>;

function ruleDraft(rule: SystemAutoBlockRule) {
  return {
    maxAttempts: String(rule.maxAttempts),
    windowMinutes: String(rule.windowMinutes),
    blockDurationHours: rule.blockDurationHours == null ? "" : String(rule.blockDurationHours),
  };
}

export default function AutoBlockRulesPage() {
  const rulesQuery = useQuery(getSystemAutoBlockRulesQueryOptions());
  const updateMutation = useUpdateSystemAutoBlockRule();
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const rules = useMemo(
    () => (rulesQuery.data?.data ?? []).slice().sort((a, b) => a.precedence - b.precedence),
    [rulesQuery.data],
  );

  useEffect(() => {
    if (!rules.length) return;
    setDrafts((prev) => {
      const next: DraftMap = { ...prev };
      for (const r of rules) {
        if (!next[r.id]) next[r.id] = ruleDraft(r);
      }
      return next;
    });
  }, [rules]);

  const patch = (rule: SystemAutoBlockRule, data: Parameters<typeof updateMutation.mutate>[0]["data"]) => {
    setPendingId(rule.id);
    updateMutation.mutate(
      { id: rule.id, data },
      {
        onSuccess: (res) => {
          toast.success(`${rule.name} updated`);
          setPendingId(null);
          const fresh = res?.data;
          if (fresh) setDrafts(prev => ({ ...prev, [rule.id]: ruleDraft(fresh) }));
        },
        onError: (error) => {
          toast.error(error.message);
          setPendingId(null);
          setDrafts(prev => ({ ...prev, [rule.id]: ruleDraft(rule) }));
        },
      },
    );
  };

  const commitNumber = (
    rule: SystemAutoBlockRule,
    field: "maxAttempts" | "windowMinutes" | "blockDurationHours",
    raw: string,
  ) => {
    if (field === "blockDurationHours" && raw === "") {
      if (rule.blockDurationHours === null) return;
      patch(rule, { blockDurationHours: null });
      return;
    }
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      setDrafts(prev => ({ ...prev, [rule.id]: ruleDraft(rule) }));
      return;
    }
    if (rule[field] === n) return;
    patch(rule, { [field]: n });
  };

  return (
    <div className="space-y-6">
      {/* How Auto-Blocking Works — outside and above the rules card */}
      <div className="flex overflow-hidden rounded-lg border border-border/60 bg-card">
        <div aria-hidden className="w-[2px] shrink-0 bg-primary" />
        <div className="flex flex-1 items-start gap-4 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              How auto-blocking works
            </p>
            <p className="text-sm">
              An IP that trips the failed-attempt threshold inside the time window gets blocked automatically.
              Rules run in priority order — the first one that matches wins.
              Blocks appear in <span className="font-medium">Blocked IPs</span>, triggers in <span className="font-medium">Security Events</span>.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Automated IP Blocking Rules
              </CardTitle>
              <CardDescription className="mt-1">
                Tune the tripwires that decide when a failing IP gets blocked.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rulesQuery.isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {rulesQuery.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">
                {rulesQuery.error?.message ?? "Failed to load rules."}
              </p>
              <button
                className="mt-2 text-xs text-primary underline underline-offset-2"
                onClick={() => rulesQuery.refetch()}
              >
                Try again
              </button>
            </div>
          )}

          {!rulesQuery.isLoading && !rulesQuery.isError && rules.length === 0 && (
            <p className="text-sm text-muted-foreground">No auto-block rules configured.</p>
          )}

          <div className="space-y-3">
            {rules.map((rule) => {
              const draft = drafts[rule.id] ?? ruleDraft(rule);
              const isPending = pendingId === rule.id && updateMutation.isPending;
              const isPermanent = draft.blockDurationHours === "";
              return (
                <div
                  key={rule.id}
                  className={`rounded-lg border transition-colors ${
                    rule.enabled ? "border-primary/30 bg-primary/[0.03]" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    <Switch
                      checked={rule.enabled}
                      disabled={isPending}
                      onCheckedChange={(v) => patch(rule, { enabled: v })}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
                          Priority {rule.precedence}
                        </p>
                        {isPending && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="mt-0.5 text-base font-semibold">{rule.name}</h3>
                      <p className={`mt-3 text-sm leading-relaxed ${rule.enabled ? "" : "text-muted-foreground"}`}>
                        Block an IP after{" "}
                        <InlineNumber
                          value={draft.maxAttempts}
                          disabled={isPending}
                          onChange={v => setDrafts(prev => ({ ...prev, [rule.id]: { ...draft, maxAttempts: v } }))}
                          onCommit={v => commitNumber(rule, "maxAttempts", v)}
                          suffix="failed attempts"
                          ariaLabel="Max attempts"
                        />
                        {" "}within{" "}
                        <InlineNumber
                          value={draft.windowMinutes}
                          disabled={isPending}
                          onChange={v => setDrafts(prev => ({ ...prev, [rule.id]: { ...draft, windowMinutes: v } }))}
                          onCommit={v => commitNumber(rule, "windowMinutes", v)}
                          suffix="minutes"
                          ariaLabel="Time window in minutes"
                        />
                        , then{" "}
                        {isPermanent ? (
                          <>
                            <span className="font-medium text-destructive">block permanently</span>
                            <button
                              type="button"
                              className="ml-2 text-xs text-primary underline underline-offset-2 disabled:opacity-50"
                              disabled={isPending}
                              // ponytail: local-only draft flip — no PATCH until the user
                              // commits a value on blur/Enter.
                              onClick={() => setDrafts(prev => ({
                                ...prev,
                                [rule.id]: { ...draft, blockDurationHours: "24" },
                              }))}
                            >
                              set duration
                            </button>
                            .
                          </>
                        ) : (
                          <>
                            block for{" "}
                            <InlineNumber
                              value={draft.blockDurationHours}
                              disabled={isPending}
                              onChange={v => setDrafts(prev => ({ ...prev, [rule.id]: { ...draft, blockDurationHours: v } }))}
                              onCommit={v => commitNumber(rule, "blockDurationHours", v)}
                              suffix="hours"
                              ariaLabel="Block duration in hours"
                            />
                            <button
                              type="button"
                              className="ml-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                              disabled={isPending}
                              onClick={() => commitNumber(rule, "blockDurationHours", "")}
                            >
                              make permanent
                            </button>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InlineNumber({
  value,
  onChange,
  onCommit,
  suffix,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  suffix: string;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 align-baseline">
      <Input
        type="number"
        min={1}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        aria-label={ariaLabel}
        className="inline-block h-7 w-14 px-2 text-center font-mono tabular-nums text-sm"
      />
      <span className="text-muted-foreground">{suffix}</span>
    </span>
  );
}
