import type { InstallationFeedback } from "@truckmoov/api/auth";
import { useSubmitInstallationFeedback } from "@truckmoov/api/auth";
import {
  Loader2, Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import { cn } from "@/lib/utils";

const RATINGS = [
  1,
  2,
  3,
  4,
  5,
];

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex gap-1"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {RATINGS.map(n => (
        <Star
          key={n}
          className={cn(
            "h-5 w-5",
            n <= rating ? "fill-warning text-warning" : "text-muted-foreground",
          )}
        />
      ))}
    </span>
  );
}

export function InstallationFeedbackCard({ feedback }: { feedback: InstallationFeedback | null }) {
  const submit = useSubmitInstallationFeedback();
  const [
    rating,
    setRating,
  ] = useState(0);
  const [
    comment,
    setComment,
  ] = useState("");

  if (feedback) {
    return (
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="space-y-2 p-5">
          <h2 className="text-sm font-medium tracking-tight">Thanks for your feedback</h2>
          <Stars rating={feedback.rating} />
          {feedback.comment && <p className="text-sm text-muted-foreground">{feedback.comment}</p>}
        </CardContent>
      </Card>
    );
  }

  const onSubmit = () => submit.mutate(
    {
      rating, comment: comment.trim() || undefined,
    },
    { onError: error => toast.error(error.message) },
  );

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <fieldset>
          <legend className="text-sm font-medium tracking-tight">How was your installation?</legend>
          <p className="mt-1 text-sm text-muted-foreground">Rate the installation to close your request.</p>
          <div className="mt-3 flex gap-1">
            {RATINGS.map(n => (
              <label
                key={n}
                className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <input
                  type="radio"
                  name="installation-rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="sr-only"
                />
                <span className="sr-only">{`${n} out of 5 stars`}</span>
                <Star
                  aria-hidden
                  className={cn(
                    "h-7 w-7 transition-colors",
                    n <= rating ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning",
                  )}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="installation-feedback-comment">Comment (optional)</Label>
          <Textarea
            id="installation-feedback-comment"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us how it went"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={rating === 0 || submit.isPending}
        >
          {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit feedback
        </Button>
      </CardContent>
    </Card>
  );
}
