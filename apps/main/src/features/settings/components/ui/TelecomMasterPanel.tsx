import type { SystemTelecomMasterStatus } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getTenantTelecomMasterQueryOptions, useSubmitTenantTelecomMaster,
} from "@truckmoov/api/auth";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/shadcn/radio-group";
import { Skeleton } from "@/components/shadcn/skeleton";

const STATUS_LABEL: Record<SystemTelecomMasterStatus, string> = {
  not_selected: "Not Selected",
  pending_verification: "Pending Verification",
  verified: "Verified",
  allocation_pending: "Allocation Pending",
  allocated: "Allocated",
  verification_failed: "Verification Failed",
  allocation_failed: "Allocation Failed",
};

const STATUS_TONE: Record<SystemTelecomMasterStatus, string> = {
  not_selected: "bg-muted text-muted-foreground border-border",
  pending_verification: "bg-warning/15 text-warning border-warning/30",
  allocation_pending: "bg-warning/15 text-warning border-warning/30",
  verified: "bg-success/15 text-success border-success/30",
  allocated: "bg-success/15 text-success border-success/30",
  verification_failed: "bg-destructive/15 text-destructive border-destructive/30",
  allocation_failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function formatTmNumber(msisdn: string) {
  return /^234\d{10}$/.test(msisdn)
    ? `+234 ${msisdn.slice(
      3,
      6,
    )} ${msisdn.slice(
      6,
      9,
    )} ${msisdn.slice(9)}`
    : msisdn;
}

const schema = z.object({
  numberType: z.enum([
    "existing",
    "new",
  ]),
  msisdn: z.string().trim(),
}).refine(
  v => v.numberType === "new" || /^(?:\+?234|0)?[789]\d{9}$/.test(v.msisdn.replace(
    /[\s\-()]/g,
    "",
  )),
  {
    path: ["msisdn"],
    message: "Enter a valid MTN mobile number.",
  },
);
type Values = z.infer<typeof schema>;

export const TELECOM_MASTER_FORM_ID = "telecom-master-form";

function Item({
  label, value,
}: {
  label: string; value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground break-words">{value}</dd>
    </div>
  );
}

function RequestForm() {
  const submit = useSubmitTenantTelecomMaster();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      numberType: "existing", msisdn: "",
    },
  });
  const numberType = form.watch("numberType");

  function onSubmit(values: Values) {
    submit.mutate(
      {
        data: values.numberType === "existing" ? {
          numberType: "existing", msisdn: values.msisdn,
        } : { numberType: "new" },
      },
      {
        onSuccess: () => toast.success("Telecom Master requested — MTN will confirm it."),
        onError: err => toast.error(err.message),
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={TELECOM_MASTER_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="numberType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="gap-2"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="existing" />
                    Use an existing MTN number
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value="new" />
                    Request a new Telecom Master SIM
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {numberType === "existing" && (
          <FormField
            control={form.control}
            name="msisdn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MTN number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0803 123 4567"
                    inputMode="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button
          type="submit"
          form={TELECOM_MASTER_FORM_ID}
          loading={submit.isPending}
        >
          Request Telecom Master
        </Button>
      </form>
    </Form>
  );
}

/** The enterprise account's Telecom Master number. Never a tracking device SIM. */
export function TelecomMasterPanel() {
  const {
    data, isLoading, isError,
  } = useQuery(getTenantTelecomMasterQueryOptions());
  if (isError)
    return null;
  const request = data?.data?.request ?? null;
  const failed = request?.status === "verification_failed" || request?.status === "allocation_failed";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Telecom Master
        </CardTitle>
        <CardDescription>
          Your account&apos;s Telecom Master number for the fleet management service. This is separate from your tracking device SIMs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : request ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Item
                label="Telecom Master"
                value={request.msisdn ? formatTmNumber(request.msisdn) : "Awaiting allocation"}
              />
              <Item
                label="Number Type"
                value={request.numberType === "existing" ? "Existing" : "Newly Allocated"}
              />
              <Item
                label="Network"
                value="MTN"
              />
              <Item
                label="Status"
                value={(
                  <Badge
                    variant="outline"
                    className={STATUS_TONE[request.status]}
                  >
                    {STATUS_LABEL[request.status]}
                  </Badge>
                )}
              />
              <Item
                label="Date Added"
                value={formatDateTime(request.createdAt)}
              />
              <Item
                label="Enterprise Account"
                value={request.organizationName}
              />
              {request.numberType === "new" && (
                <Item
                  label="SIM Serial Number"
                  value={request.simSerial || "—"}
                />
              )}
              {failed && request.failureReason && (
                <Item
                  label="Reason"
                  value={request.failureReason}
                />
              )}
            </dl>
            {!failed && (
              <p className="text-xs text-muted-foreground">
                To change or replace your Telecom Master, contact support — it can&apos;t be edited here.
              </p>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No Telecom Master has been assigned to your account yet.
          </p>
        )}
        {!isLoading && (!request || failed) && <RequestForm />}
      </CardContent>
    </Card>
  );
}
