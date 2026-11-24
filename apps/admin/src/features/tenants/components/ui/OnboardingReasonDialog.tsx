import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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

const reasonSchema = z.object({
  reason: z.string().trim().min(
    1,
    "A reason is required",
  ).max(1000),
});
type ReasonFormValues = z.infer<typeof reasonSchema>;

const FORM_ID = "onboarding-reason-form";

type OnboardingReasonDialogProps = {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  destructive?: boolean;
  fieldLabel?: string;
  placeholder?: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
};

/** Reject / request changes / document reject — the reason is what the applicant reads. */
export function OnboardingReasonDialog({
  open,
  title,
  description,
  submitLabel,
  destructive,
  fieldLabel = "Reason",
  placeholder = "Shared with the applicant. Write something they can act on.",
  loading,
  onOpenChange,
  onSubmit,
}: OnboardingReasonDialogProps) {
  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  useEffect(
    () => {
      if (open)
        form.reset({ reason: "" });
    },
    [
      open,
      form,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={o => !loading && onOpenChange(o)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(values => onSubmit(values.reason.trim()))}
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{fieldLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      className="resize-none"
                      placeholder={placeholder}
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
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant={destructive ? "destructive" : "default"}
            loading={loading}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
