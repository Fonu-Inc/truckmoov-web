import type {
  SystemTelecomMasterRequest, TelecomMasterOutcome,
} from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResolveSystemTelecomMasterRequest } from "@truckmoov/api/auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
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
import { errorMessage } from "@/features/tenants/utils/onboarding";
import {
  normalizeMtnNumber, TM_STATUS_LABEL,
} from "@/features/tenants/utils/tmNumber";

const OUTCOMES: Partial<Record<SystemTelecomMasterRequest["status"], TelecomMasterOutcome[]>> = {
  pending_verification: [
    "verified",
    "verification_failed",
  ],
  allocation_pending: [
    "allocated",
    "allocation_failed",
  ],
};

const schema = z.object({
  outcome: z.enum([
    "verified",
    "verification_failed",
    "allocated",
    "allocation_failed",
  ]),
  msisdn: z.string().trim(),
  simSerial: z.string().trim(),
  mtnReference: z.string().trim(),
  failureReason: z.string().trim(),
}).superRefine((v, ctx) => {
  if (v.outcome === "allocated" && !normalizeMtnNumber(v.msisdn)) {
    ctx.addIssue({
      code: "custom", path: ["msisdn"], message: "Enter the allocated MTN number.",
    });
  }
  if (v.outcome.endsWith("_failed") && !v.failureReason) {
    ctx.addIssue({
      code: "custom", path: ["failureReason"], message: "Give the reason MTN refused it.",
    });
  }
});
type Values = z.infer<typeof schema>;

export const TM_RESOLVE_FORM_ID = "tm-resolve-form";

/** Records MTN's answer for a pending request until the MTN APIs are integrated. */
export function TmResolveForm({ request }: { request: SystemTelecomMasterRequest }) {
  const outcomes = OUTCOMES[request.status] ?? [];
  const resolve = useResolveSystemTelecomMasterRequest();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      outcome: outcomes[0] ?? "verified",
      msisdn: "",
      simSerial: "",
      mtnReference: "",
      failureReason: "",
    },
  });
  const outcome = form.watch("outcome");

  if (outcomes.length === 0)
    return null;

  function onSubmit(v: Values) {
    const failed = v.outcome.endsWith("_failed");
    resolve.mutate(
      {
        id: request.id,
        data: {
          outcome: v.outcome,
          mtnReference: v.mtnReference || undefined,
          ...(v.outcome === "allocated" ? {
            msisdn: v.msisdn, simSerial: v.simSerial || undefined,
          } : {}),
          ...(failed ? { failureReason: v.failureReason } : {}),
        },
      },
      {
        onSuccess: () => toast.success(`Marked ${TM_STATUS_LABEL[v.outcome]}.`),
        onError: error => toast.error(errorMessage(
          error,
          "Could not update this request.",
        )),
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={TM_RESOLVE_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 rounded-lg border p-3"
      >
        <p className="font-medium">Record MTN outcome</p>
        <FormField
          control={form.control}
          name="outcome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outcome</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {outcomes.map(o => (
                    <SelectItem
                      key={o}
                      value={o}
                    >
                      {TM_STATUS_LABEL[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {outcome === "allocated" && (
          <>
            <FormField
              control={form.control}
              name="msisdn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocated number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0803 123 4567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="simSerial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIM serial</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {outcome.endsWith("_failed") && (
          <FormField
            control={form.control}
            name="failureReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Failure reason</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="mtnReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MTN reference</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          form={TM_RESOLVE_FORM_ID}
          size="sm"
          loading={resolve.isPending}
        >
          Save outcome
        </Button>
      </form>
    </Form>
  );
}
