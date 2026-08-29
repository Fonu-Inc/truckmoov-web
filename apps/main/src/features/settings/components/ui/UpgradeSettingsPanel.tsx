import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { OrganisationUpgradeRequest } from "@truckmoov/api/auth";
import {
  getOrganisationUpgradeQueueQueryOptions,
  useRequestOrganisationUpgrade,
} from "@truckmoov/api/auth";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import {
  ArrowUpCircle,
  Check,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Textarea } from "@/components/shadcn/textarea";

const schema = z.object({
  reason: z.string().trim().min(
    10,
    "Give the reviewer at least a sentence — this speeds up approval.",
  ),
});
type Values = z.infer<typeof schema>;

const CAPS = [
  "Vehicle cap",
  "Single owner seat",
  "No Fleet Admin role",
  "Owner-Operator dashboard only",
];

const UNLOCKS = [
  "No vehicle cap",
  "Multi-user seats",
  "Fleet Admin roles for all members",
  "Full fleet management surface",
];

export function UpgradeSettingsPanel() {
  const queue = useQuery(getOrganisationUpgradeQueueQueryOptions());
  const pending = queue.data?.data.pending?.[0];
  const lastDecision = queue.data?.data.history?.[0];
  const [
    resubmitting,
    setResubmitting,
  ] = useState(false);

  const showPending = !!pending;
  const showApproved = !pending && lastDecision?.status === "approved";
  const showRejected = !pending && lastDecision?.status === "rejected" && !resubmitting;
  const showForm = !showPending && !showApproved && !showRejected;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          Upgrade to Fleet Provider
        </CardTitle>
        <CardDescription>
          A reviewer removes the Owner-Operator caps and switches your organisation to
          Fleet Provider. Your vehicles, drivers, jobs, and settlements are preserved.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {showPending && <PendingPanel request={pending} />}
        {showApproved && <ApprovedPanel request={lastDecision} />}
        {showRejected && (
          <RejectedPanel
            request={lastDecision}
            onResubmit={() => setResubmitting(true)}
          />
        )}
        {showForm && <UpgradeForm onSubmitted={() => setResubmitting(false)} />}
      </CardContent>
    </Card>
  );
}

function UpgradeForm({ onSubmitted }: { onSubmitted: () => void }) {
  const submit = useRequestOrganisationUpgrade();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  function onSubmit({ reason }: Values) {
    submit.mutate(
      { data: { reason } },
      {
        onSuccess: () => {
          form.reset();
          onSubmitted();
          toast.success("Request submitted — a reviewer will decide within 3 business days.");
        },
        onError: err => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <Ledger />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note to the reviewer</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="What changed in your operation? e.g. Fleet grew to 9 vehicles after the Kano contract; adding a dispatcher."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submit.isPending}
            >
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit upgrade request
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

function Ledger() {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-0">
      <div className="md:pr-8 md:border-r md:border-border/60">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">You are</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">Owner-Operator</h3>
        <ul className="mt-4 space-y-3">
          {CAPS.map((c, i) => (
            <li
              key={c}
              className="flex items-baseline gap-3 text-sm"
            >
              <span className="font-mono tabular-nums text-base text-muted-foreground">
                {String(i + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:pl-8">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">You become</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">Fleet Provider</h3>
        <ul className="mt-4 space-y-3">
          {UNLOCKS.map(u => (
            <li
              key={u}
              className="flex items-baseline gap-3 text-sm"
            >
              <Check className="h-4 w-4 text-primary translate-y-0.5" />
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PendingPanel({ request }: { request: OrganisationUpgradeRequest }) {
  return (
    <div className="space-y-4 rounded-md border border-border/60 bg-muted/30 p-5">
      <div className="flex items-center gap-2">
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <Clock className="mr-1 h-3.5 w-3.5" />
          Pending review
        </Badge>
        <span className="text-xs text-muted-foreground">
          Submitted
          {" "}
          {formatDateTime(request.requestedAt)}
        </span>
      </div>
      {request.reason && (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your note</p>
          <p className="mt-1 text-sm">{request.reason}</p>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        You'll get a notification when it's decided. No further action needed.
      </p>
    </div>
  );
}

function ApprovedPanel({ request }: { request: OrganisationUpgradeRequest }) {
  return (
    <div className="space-y-3 rounded-md border border-success/30 bg-success/10 p-5">
      <div className="flex items-center gap-2">
        <Badge className="bg-success/20 text-success border-success/30">
          <Check className="mr-1 h-3.5 w-3.5" />
          Approved
        </Badge>
        {request.reviewedAt && (
          <span className="text-xs text-muted-foreground">
            Reviewed
            {" "}
            {formatDateTime(request.reviewedAt)}
          </span>
        )}
      </div>
      <p className="text-sm">
        Your organisation is now a Fleet Provider. Sign out and back in to load the
        full fleet management surface.
      </p>
    </div>
  );
}

function RejectedPanel({
  request,
  onResubmit,
}: {
  request: OrganisationUpgradeRequest;
  onResubmit: () => void;
}) {
  return (
    <div className="space-y-4 rounded-md border border-destructive/30 bg-destructive/10 p-5">
      <div className="flex items-center gap-2">
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Not approved
        </Badge>
        {request.reviewedAt && (
          <span className="text-xs text-muted-foreground">
            Reviewed
            {" "}
            {formatDateTime(request.reviewedAt)}
          </span>
        )}
      </div>
      {request.reviewerNotes && (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Reviewer notes
          </p>
          <p className="mt-1 text-sm">{request.reviewerNotes}</p>
        </div>
      )}
      <div>
        <Button
          variant="outline"
          onClick={onResubmit}
        >
          Submit a new request
        </Button>
      </div>
    </div>
  );
}
