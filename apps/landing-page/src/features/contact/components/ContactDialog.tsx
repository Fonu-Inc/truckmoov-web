"use client";

import type { ContactFormValues } from "@/features/contact/schemas/contactSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle,
  TelegramLogo,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { sendContactEnquiry } from "@truckmoov/api/auth";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  CONTACT_DEFAULTS,
  contactSchema,
} from "@/features/contact/schemas/contactSchema";
import {
  CONTACT_COPY,
  CONTACT_FIELDS,
} from "@/features/contact/utils/contactContent";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";

type ContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * "Contact Us" dialog (Figma frame 234:4615). Controlled by the root DialogHost, so every
 * "Contact Us" trigger (nav, mobile menu, support pill) shares this single instance.
 */
export function ContactDialog({
  open,
  onOpenChange,
}: ContactDialogProps) {
  const [
    sent,
    setSent,
  ] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: CONTACT_DEFAULTS,
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    // Start fresh next time the dialog opens.
    if (!next) {
      form.reset(CONTACT_DEFAULTS);
      setSent(false);
    }
  }

  async function onSubmit(values: ContactFormValues) {
    try {
      await sendContactEnquiry({ data: values });
      setSent(true);
    }
    catch (error) {
      form.setError(
        "root",
        { message: (error as { message?: string }).message || "Your message couldn't be sent. Please try again." },
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[30px] border-border-field p-0 shadow-float sm:h-[650px] sm:max-w-[600px] sm:rounded-[50px]"
      >
        <header className="relative flex shrink-0 items-start gap-[23px] border-b border-border-field px-5 pt-8 pb-6 sm:px-7 sm:pt-[43px]">
          <span
            aria-hidden="true"
            className="flex size-[60px] shrink-0 items-center justify-center rounded-[15px] bg-brand-tint text-brand"
          >
            <TelegramLogo className="size-[30px]" />
          </span>
          <div className="min-w-0 pr-10">
            <DialogTitle className="text-[30px] leading-9 font-semibold text-heading">
              {CONTACT_COPY.title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 max-w-[290px] text-sm leading-[18px] tracking-[-0.01em] text-heading/60">
              {CONTACT_COPY.description}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="absolute top-6 right-5 flex cursor-pointer items-center justify-center rounded-full text-foreground outline-none hover:text-heading focus-visible:ring-2 focus-visible:ring-ring sm:top-9 sm:right-[35px]"
          >
            <X className="size-7" />
          </DialogClose>
        </header>

        {sent
          ? (
              <div
                role="status"
                className="flex flex-1 flex-col items-center justify-center gap-4 px-7 py-12 text-center"
              >
                <CheckCircle
                  aria-hidden="true"
                  weight="fill"
                  className="size-16 text-brand"
                />
                <p className="text-subtitle font-semibold text-heading">
                  {CONTACT_COPY.successTitle}
                </p>
                <p className="max-w-[400px] text-sm leading-[21px] text-subtle-foreground">
                  {CONTACT_COPY.successDescription}
                </p>
                <DialogClose asChild>
                  <Button
                    variant="brand"
                    size="pill"
                    className="mt-4 w-[165px]"
                  >
                    {CONTACT_COPY.successAction}
                  </Button>
                </DialogClose>
              </div>
            )
          : (
              <Form {...form}>
                <form
                  noValidate
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-[17px] overflow-y-auto px-5 pt-[26px] pb-6 sm:pr-[37px] sm:pl-7">
                    {CONTACT_FIELDS.map(field => (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: control }) => (
                          <FormItem className={field.kind === "textarea" ? "gap-[5px]" : "gap-[9px]"}>
                            <FormLabel
                              className="text-sm leading-[17px] font-medium text-heading"
                              required
                            >
                              {field.label}
                            </FormLabel>
                            <FormControl>
                              {field.kind === "textarea"
                                ? (
                                    <textarea
                                      {...control}
                                      placeholder={field.placeholder}
                                      rows={6}
                                      className="min-h-[154px] w-full resize-y rounded-[20px] border border-border-faint bg-field px-5 pt-[7px] pb-[11px] text-xs leading-[17px] text-heading outline-none placeholder:text-heading/50 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50 aria-invalid:border-destructive"
                                    />
                                  )
                                : (
                                    <Input
                                      {...control}
                                      type={field.type}
                                      autoComplete={field.autoComplete}
                                      placeholder={field.placeholder}
                                      className="h-12 rounded-[15px] border-transparent bg-field px-3 text-xs text-heading shadow-none placeholder:text-subtle-foreground"
                                    />
                                  )}
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  {form.formState.errors.root && (
                    <p
                      role="alert"
                      className="mx-[14px] pb-3 text-xs text-destructive sm:mr-[17px]"
                    >
                      {form.formState.errors.root.message}
                    </p>
                  )}
                  <footer className="mx-[14px] flex shrink-0 justify-end border-t border-border-field py-[26px] pr-1.5 sm:mr-[17px] sm:pr-[9px]">
                    <Button
                      type="submit"
                      variant="brand"
                      size="pill"
                      disabled={form.formState.isSubmitting}
                      className="h-[45px] w-[165px] border-brand-deep/20 shadow-none"
                    >
                      <Send
                        aria-hidden="true"
                        strokeWidth={1}
                        className="size-4"
                      />
                      {form.formState.isSubmitting ? CONTACT_COPY.submitting : CONTACT_COPY.submit}
                    </Button>
                  </footer>
                </form>
              </Form>
            )}
      </DialogContent>
    </Dialog>
  );
}
