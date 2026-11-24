import type { InstallerIssueType } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  INSTALLER_ISSUE_TYPES,
  useInstallerOptions,
  useReportInstallerJobIssue,
} from "@truckmoov/api/auth";
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
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const reportIssueSchema = z.object({
  issueType: z.enum(
    INSTALLER_ISSUE_TYPES,
    { message: "Select an issue type." },
  ),
  description: z.string().trim().min(
    1,
    "Describe the issue.",
  ),
  photo: z
    .instanceof(File)
    .optional()
    .refine(
      f => !f || PHOTO_TYPES.includes(f.type),
      "Use a JPG, PNG or WebP photo.",
    )
    .refine(
      f => !f || f.size <= MAX_PHOTO_BYTES,
      "The photo must be 10 MB or smaller.",
    ),
});

type ReportIssueValues = z.infer<typeof reportIssueSchema>;

export const REPORT_ISSUE_FORM_ID = "installer-report-issue-form";

type ReportIssueFormProps = {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Raises a support ticket and moves the job to issue_reported (POST /auth/installer/jobs/:id/issues). */
export function ReportIssueForm({
  jobId, open, onOpenChange,
}: ReportIssueFormProps) {
  const report = useReportInstallerJobIssue();
  // Categories come from GET /auth/installer/options; the documented enum is the fallback.
  const categories = useInstallerOptions().data?.data.supportCategories
    ?? INSTALLER_ISSUE_TYPES.map(key => ({
      key, label: key,
    }));

  const form = useForm<ReportIssueValues>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      issueType: undefined,
      description: "",
      photo: undefined,
    },
  });

  function close() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: ReportIssueValues) {
    report.mutate(
      {
        jobId,
        issueType: values.issueType,
        description: values.description,
        photo: values.photo,
      },
      {
        onSuccess: () => {
          toast.success(
            "Issue reported.",
            { description: "A support ticket has been raised for this job." },
          );
          close();
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={o => (o ? onOpenChange(true) : close())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Installation Issue</DialogTitle>
          <DialogDescription>
            This raises a support ticket and moves the job to Issue reported until it is resolved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={REPORT_ISSUE_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Issue type</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value ?? ""}
                    onValueChange={v => field.onChange(v as InstallerIssueType)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem
                          key={c.key}
                          value={c.key}
                        >
                          {c.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Describe the issue</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      className="resize-none"
                      placeholder="Describe what happened on site"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={PHOTO_TYPES.join(",")}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={e => field.onChange(e.target.files?.[0])}
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
            form={REPORT_ISSUE_FORM_ID}
            variant="destructive"
            loading={report.isPending}
          >
            Submit issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
