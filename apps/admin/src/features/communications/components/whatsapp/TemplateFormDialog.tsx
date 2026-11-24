import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSystemWhatsAppTemplate } from "@truckmoov/api/notification";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import {
  buildTemplateComponents,
  placeholderNumbers,
  placeholdersAreSequential,
  TEMPLATE_NAME_PATTERN,
} from "./templateComponents";

export const TEMPLATE_FORM_ID = "whatsapp-template-form";

const LANGUAGES = [
  {
    value: "en_US", label: "English (US)",
  },
  {
    value: "en_GB", label: "English (UK)",
  },
  {
    value: "en", label: "English",
  },
  {
    value: "fr", label: "French",
  },
  {
    value: "es", label: "Spanish",
  },
  {
    value: "pt_BR", label: "Portuguese (Brazil)",
  },
  {
    value: "ar", label: "Arabic",
  },
  {
    value: "sw", label: "Swahili",
  },
];

const CATEGORIES = [
  {
    value: "UTILITY", label: "Utility", hint: "Order, job and account updates a customer expects.",
  },
  {
    value: "MARKETING", label: "Marketing", hint: "Promotions and announcements. Billed at a higher rate.",
  },
];

const templateSchema = z.object({
  name: z.string().min(
    1,
    "Name is required.",
  ).max(512).regex(
    TEMPLATE_NAME_PATTERN,
    "Use lowercase letters, numbers and underscores.",
  ),
  language: z.string().min(1),
  category: z.enum([
    "UTILITY",
    "MARKETING",
  ]),
  header: z.string().max(
    60,
    "Header is at most 60 characters.",
  ).refine(
    value => !value.includes("{{"),
    "Header variables are not supported here.",
  ),
  body: z.string().trim().min(
    1,
    "Body is required.",
  ).max(
    1024,
    "Body is at most 1024 characters.",
  ).refine(
    placeholdersAreSequential,
    "Number variables {{1}}, {{2}}... in order with no gaps.",
  ),
  footer: z.string().max(
    60,
    "Footer is at most 60 characters.",
  ),
  examples: z.array(z.string()),
}).superRefine((value, context) => {
  placeholderNumbers(value.body).forEach((_, index) => {
    if (!value.examples[index]?.trim()) {
      context.addIssue({
        code: "custom", path: [
          "examples",
          index,
        ], message: "Give an example value.",
      });
    }
  });
});

type TemplateFormValues = Required<z.infer<typeof templateSchema>>;

type TemplateFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TemplateFormDialog({
  open, onOpenChange,
}: TemplateFormDialogProps) {
  const create = useCreateSystemWhatsAppTemplate();
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      language: "en_US",
      category: "UTILITY",
      header: "",
      body: "",
      footer: "",
      examples: [],
    },
  });
  const variableCount = placeholderNumbers(form.watch("body")).length;

  const close = (next: boolean) => {
    if (!next)
      form.reset();
    onOpenChange(next);
  };

  const onSubmit = (values: TemplateFormValues) => {
    create.mutate(
      {
        data: {
          name: values.name,
          language: values.language,
          category: values.category,
          template_type: "other",
          components: buildTemplateComponents(values),
        },
      },
      {
        onSuccess: () => {
          toast.success("Template submitted to Meta for review.");
          close(false);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New message template</DialogTitle>
          <DialogDescription>
            Meta reviews every template, usually within minutes, before it can be sent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id={TEMPLATE_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="driver_followup"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Language</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map(language => (
                          <SelectItem
                            key={language.value}
                            value={language.value}
                          >
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {CATEGORIES.find(category => category.value === field.value)?.hint}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="header"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header (optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Hello {{1}}, your job {{2}} starts at {{3}}."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use
                    {"{{1}}"}
                    ,
                    {"{{2}}"}
                    ... for values filled in when sending.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {Array.from(
              { length: variableCount },
              (_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`examples.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>
                        Example for
                        {" "}
                        {`{{${index + 1}}}`}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ),
            )}
            <FormField
              control={form.control}
              name="footer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer (optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={TEMPLATE_FORM_ID}
            variant="gradient"
            loading={create.isPending}
          >
            Submit for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
