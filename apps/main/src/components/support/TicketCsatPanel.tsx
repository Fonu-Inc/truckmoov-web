import type { SupportTicketStatus } from "@truckmoov/api/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getSupportTicketCsatQueryOptions,
  useSubmitSupportTicketCsat,
} from "@truckmoov/api/auth";
import { formatWithPattern } from "@truckmoov/app-core/utils/time-utils";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

type Props = {
  ticketId: string;
  ticketStatus: SupportTicketStatus;
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
  ticketId, ticketStatus,
}: Props) {
  const rateable = ticketStatus === "resolved" || ticketStatus === "closed";
  const csatQuery = useQuery({
    ...getSupportTicketCsatQueryOptions(ticketId),
    enabled: rateable,
  });
  const csat = csatQuery.data?.data ?? null;
  const submitCsat = useSubmitSupportTicketCsat();
  const isSubmitting = submitCsat.isPending;
  const submit = (data: {
    rating: number; comment: string; wouldRecommend: boolean;
  }) => submitCsat.mutate(
    {
      id: ticketId,
      data: {
        rating: data.rating,
        comment: data.comment.trim() || undefined,
        wouldRecommend: data.wouldRecommend,
      },
    },
    {
      onSuccess: () => toast.success("Thanks for your feedback"),
      onError: error => toast.error(error.message),
    },
  );
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

  if (!rateable || csatQuery.isPending)
    return null;

  if (csat) {
    return (
      <div className="rounded-lg border bg-success/5 border-success/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Feedback
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {formatWithPattern(
              csat.createdAt,
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
        {csat.wouldRecommend !== null && (
          <p className="text-xs text-muted-foreground">
            {csat.wouldRecommend
              ? "Would recommend TruckMoov support to a colleague."
              : "Would not recommend TruckMoov support to a colleague."}
          </p>
        )}
      </div>
    );
  }

  const active = hover || rating;

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
      <div className="space-y-1">
        <Label
          className="text-sm font-semibold"
          required
        >
          How was your support experience?
        </Label>
        <p className="text-xs text-muted-foreground">
          One rating per ticket for your whole account. The support team sees it.
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
          Would you recommend TruckMoov support to a colleague?
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
