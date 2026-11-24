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

const FORM_ID = "reject-device-setup-request-form";

const schema = z.object({
  reason: z.string().trim().min(
    1,
    "Rejection reason is required.",
  ),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  organisation?: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function RejectDeviceSetupRequestDialog({
  open,
  organisation,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  useEffect(
    () => {
      if (!open)
        form.reset();
    },
    [
      open,
      form,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending)
          onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
          <DialogDescription>
            {`Device request · ${organisation ?? ""}`}
          </DialogDescription>
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
                  <FormLabel required>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Tell the tenant why this request is being rejected…"
                      className="resize-none"
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
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={isPending}
          >
            {isPending ? "Working…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
