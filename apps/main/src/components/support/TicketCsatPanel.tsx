import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

type Props = {
  ticketId: string;
  ticketStatus: "open" | "in_progress" | "waiting_on_tenant" | "escalated" | "resolved" | "closed";
};

const RATING_LABELS = [
  "",
  "Very poor",
  "Poor",
  "OK",
  "Good",
  "Excellent",
];

export function TicketCsatPanel({
  ticketId: _ticketId, ticketStatus,
}: Props) {
  const csat: any = null;
  const isLoading = false;
  const isSubmitting = false;
  const submit = async (..._args: any[]) => {};
  const [
    rating,
    setRating,
  ] = useState(0);
  const [
    hover,
    setHover,
  ] = useState(0);
  const [
    comment,
    setComment,
  ] = useState("");
  const [
    recommend,
    setRecommend,
  ] = useState(true);

  if (ticketStatus !== "resolved" && ticketStatus !== "closed")
    return null;
  if (isLoading)
    return null;

  if (csat) {
    return (
      <div className="rounded-lg border bg-success/5 border-success/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Your feedback
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {formatWithPattern(
              csat.created_at,
              "PPp",
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(n => (
            <Star
              key={n}
              className={cn(
                "h-5 w-5",
                n <= csat.rating ? "fill-primary text-primary" : "text-muted-foreground/30",
              )}
            />
          ))}
          <span className="ml-2 text-sm font-medium">{RATING_LABELS[csat.rating]}</span>
        </div>
        {csat.comment && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{csat.comment}</p>
        )}
        {csat.would_recommend !== null && (
          <p className="text-xs text-muted-foreground">
            {csat.would_recommend
              ? "Would recommend FleetPro support to a colleague."
              : "Would not recommend FleetPro support to a colleague."}
          </p>
        )}
      </div>
    );
  }

  const active = hover || rating;

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
      <div className="space-y-1">
        <Label className="text-sm font-semibold">How was your support experience?</Label>
        <p className="text-xs text-muted-foreground">
          Your rating is shared with the platform support team and stored privately for your tenant.
        </p>
      </div>

      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Rating"
      >
        {[
          1,
          2,
          3,
          4,
          5,
        ].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`Rate ${n} out of 5`}
          >
            <Star
              className={cn(
                "h-7 w-7",
                n <= active ? "fill-primary text-primary" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
        {active > 0 && (
          <span className="ml-2 text-sm font-medium">{RATING_LABELS[active]}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="csat-comment"
          className="text-xs"
        >
          Tell us more (optional)
        </Label>
        <Textarea
          id="csat-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="What worked well, what could be better?"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label
          htmlFor="csat-recommend"
          className="text-xs"
        >
          Would you recommend FleetPro support to a colleague?
        </Label>
        <Switch
          id="csat-recommend"
          checked={recommend}
          onCheckedChange={setRecommend}
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={rating === 0 || isSubmitting}
          onClick={() => submit({
            rating, comment, wouldRecommend: recommend,
          })}
        >
          {isSubmitting ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>
    </div>
  );
}
