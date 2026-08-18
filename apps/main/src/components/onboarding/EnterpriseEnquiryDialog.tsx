import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmitEnterpriseEnquiry } from "@truckmoov/api/auth";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";

const enquirySchema = z.object({
  name: z.string().min(
    2,
    "Name is required",
  ),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(
    7,
    "Enter a valid phone number",
  ),
  companyName: z.string().min(
    1,
    "Company name is required",
  ),
  message: z.string().optional(),
});
type EnquiryValues = z.infer<typeof enquirySchema>;

type EnterpriseEnquiryDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planName: string;
};

export function EnterpriseEnquiryDialog({
  open,
  onOpenChange,
  planName,
}: EnterpriseEnquiryDialogProps) {
  const mutation = useSubmitEnterpriseEnquiry();
  const form = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "", email: "", phone: "", companyName: "", message: "",
    },
  });

  const onSubmit = (values: EnquiryValues) => {
    mutation.mutate(
      {
        data: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          companyName: values.companyName,
          message: values.message ?? "",
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Enquiry submitted",
            { description: "Our sales team will reach out to you shortly." },
          );
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to submit enquiry. Please try again.");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => !mutation.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Get in touch about
            {planName}
          </DialogTitle>
          <DialogDescription>
            Fill in your details and our sales team will reach out within one business day.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ada Okonkwo"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="ada@company.com"
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+234 800 000 0000"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Logistics"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your fleet size and requirements..."
                      className="resize-none"
                      rows={3}
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit enquiry
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
