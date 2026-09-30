import type { DashboardJob } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRejectInstallerJob } from "@truckmoov/api/auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Textarea } from "@/components/shadcn/textarea";

// The server trims, then requires 3–500 characters (TRU-FE-19).
const rejectOfferSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      3,
      "Give a reason of at least 3 characters.",
    )
    .max(
      500,
      "Keep the reason under 500 characters.",
    ),
});

type RejectOfferValues = z.infer<typeof rejectOfferSchema>;

export const REJECT_OFFER_FORM_ID = "installer-reject-offer-form";

type RejectOfferFormProps = {
  /** The offer being rejected; null closes the dialog. */
  offer: Pick<DashboardJob, "jobId" | "jobNumber"> | null;
  onClose: () => void;
  /** After a successful reject — the job is no longer the installer's. */
  onRejected?: () => void;
};

/** A rejected offer goes to the next installer and never comes back to this one. */
export function RejectOfferForm({
  offer, onClose, onRejected,
}: RejectOfferFormProps) {
  const reject = useRejectInstallerJob();

  const form = useForm<RejectOfferValues>({
    resolver: zodResolver(rejectOfferSchema),
    defaultValues: { reason: "" },
  });

  function close() {
    form.reset();
    onClose();
  }

  function onSubmit(values: RejectOfferValues) {
    if (!offer)
      return;
    reject.mutate(
      {
        jobId: offer.jobId,
        data: { reason: values.reason },
      },
      {
        onSuccess: () => {
          toast.success(
            `Offer ${offer.jobNumber} rejected.`,
            { description: "It has gone to the next installer." },
          );
          close();
          onRejected?.();
        },
        onError: (error) => {
          if (error.statusCode === 409) {
            toast.error("This job changed. The dashboard has been refreshed.");
            close();
            return;
          }
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Dialog
      open={!!offer}
      onOpenChange={open => !open && close()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reject offer
            {offer ? ` ${offer.jobNumber}` : ""}
          </DialogTitle>
          <DialogDescription>
            The job goes to the next installer and won't be offered to you again.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={REJECT_OFFER_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      className="resize-none"
                      placeholder="e.g. Already booked across town that morning"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={REJECT_OFFER_FORM_ID}
            variant="destructive"
            loading={reject.isPending}
          >
            Reject offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
