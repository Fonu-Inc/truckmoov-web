import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  getCommunicationRateHistoryQueryOptions,
  getCommunicationRatesQueryOptions,
  useUpdateCommunicationRates,
} from "@truckmoov/api/auth";
import type {
  CommunicationChannel,
  CommunicationRate,
  CommunicationRateUnit,
} from "@truckmoov/api/auth";
import { formatDate, formatTime } from "@truckmoov/app-core/utils/time-utils";
import {
  Bot,
  DollarSign,
  History,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Router,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
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
import { Separator } from "@/components/shadcn/separator";
import { Switch } from "@/components/shadcn/switch";

const CHANNELS = ["sms", "whatsapp", "voice", "ai", "iot_sim"] as const;

const rateRowSchema = z.object({
  channel: z.enum(CHANNELS),
  unit: z.enum(["per_message", "per_minute", "per_request", "recurring_monthly"]),
  rateNaira: z.coerce
    .number({ invalid_type_error: "Enter a valid rate" })
    .min(0.01, "Rate must be at least ₦0.01"),
  enabled: z.boolean(),
  description: z.string().max(255).optional(),
});

const formSchema = z.object({ rates: z.array(rateRowSchema) });

type FormValues = z.infer<typeof formSchema>;

export const COMMUNICATION_PRICING_FORM_ID = "communication-pricing-form";

const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  voice: "Voice",
  ai: "AI",
  iot_sim: "IoT SIM",
};

const UNIT_LABELS: Record<CommunicationRateUnit, string> = {
  per_message: "per message",
  per_minute: "per minute",
  per_request: "per request",
  recurring_monthly: "per month",
};

const DEFAULT_UNIT: Record<CommunicationChannel, CommunicationRateUnit> = {
  sms: "per_message",
  whatsapp: "per_message",
  voice: "per_minute",
  ai: "per_request",
  iot_sim: "recurring_monthly",
};

function getIcon(channel: CommunicationChannel) {
  switch (channel) {
    case "voice":
      return <Phone className="h-5 w-5" />;
    case "sms":
      return <MessageSquare className="h-5 w-5" />;
    case "whatsapp":
      return <MessageCircle className="h-5 w-5" />;
    case "ai":
      return <Bot className="h-5 w-5" />;
    case "iot_sim":
      return <Router className="h-5 w-5" />;
    default:
      return <DollarSign className="h-5 w-5" />;
  }
}

function getBadgeClass(channel: CommunicationChannel) {
  switch (channel) {
    case "voice":
      return "bg-info/10 text-info border-info/20";
    case "sms":
    case "whatsapp":
      return "bg-success/10 text-success border-success/20";
    case "ai":
      return "bg-primary/10 text-primary border-primary/20";
    case "iot_sim":
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "";
  }
}

function serverRatesToForm(rates: CommunicationRate[] | undefined): FormValues {
  const byChannel = new Map(rates?.map(r => [r.channel, r]));
  return {
    rates: CHANNELS.map((channel) => {
      const row = byChannel.get(channel);
      return {
        channel,
        unit: row?.unit ?? DEFAULT_UNIT[channel],
        rateNaira: row ? row.rateKobo / 100 : 0.01,
        enabled: row?.enabled ?? true,
        description: row?.description ?? "",
      };
    }),
  };
}

export function CommunicationPricing() {
  const ratesQuery = useQuery(getCommunicationRatesQueryOptions());
  const updateRates = useUpdateCommunicationRates();
  const [historyChannel, setHistoryChannel] = useState<CommunicationChannel | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: serverRatesToForm(undefined),
  });
  const { fields } = useFieldArray({ control: form.control, name: "rates" });
  const watched = form.watch("rates");

  useEffect(() => {
    if (ratesQuery.data?.data) {
      form.reset(serverRatesToForm(ratesQuery.data.data));
    }
  }, [ratesQuery.data, form]);

  const onSubmit = (values: FormValues) => {
    updateRates.mutate(
      {
        data: {
          rates: values.rates.map(r => ({
            channel: r.channel,
            rateKobo: Math.round(r.rateNaira * 100),
            enabled: r.enabled,
            description: r.description || undefined,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Rates updated");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  if (ratesQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasChanges = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Communication Pricing
            </CardTitle>
            <CardDescription>
              Configure usage-based billing rates for all communication channels
            </CardDescription>
          </div>
          <Button
            type="submit"
            form={COMMUNICATION_PRICING_FORM_ID}
            loading={updateRates.isPending}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form
            id={COMMUNICATION_PRICING_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-3">
              {fields.map((field, index) => {
                const channel = field.channel;
                const row = watched[index];
                return (
                  <Card
                    key={field.id}
                    className={`border-2 ${row?.enabled ? "border-primary/20" : "border-muted opacity-60"}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${getBadgeClass(channel)}`}>
                            {getIcon(channel)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{CHANNEL_LABELS[channel]}</h4>
                            <p className="text-xs text-muted-foreground">
                              {UNIT_LABELS[row?.unit ?? DEFAULT_UNIT[channel]]}
                            </p>
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name={`rates.${index}.enabled`}
                          render={({ field: switchField }) => (
                            <Switch
                              checked={switchField.value}
                              onCheckedChange={switchField.onChange}
                            />
                          )}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`rates.${index}.rateNaira`}
                        render={({ field: rateField }) => (
                          <FormItem>
                            <FormLabel>Rate (₦)</FormLabel>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                ₦
                              </span>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  {...rateField}
                                  className="pl-8"
                                  disabled={!row?.enabled}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`rates.${index}.description`}
                        render={({ field: descField }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...descField}
                                placeholder="Optional label"
                                disabled={!row?.enabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setHistoryChannel(channel)}
                      >
                        <History className="h-4 w-4 mr-2" />
                        View history
                      </Button>

                      {form.formState.dirtyFields.rates?.[index] && (
                        <Badge
                          variant="outline"
                          className="w-full justify-center bg-warning/10 text-warning border-warning/20"
                        >
                          Unsaved changes
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Billing Summary</h4>
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                {watched
                  .filter(r => r.enabled)
                  .map(r => (
                    <div key={r.channel} className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {CHANNEL_LABELS[r.channel]}:
                      </span>
                      <span className="font-medium">
                        ₦{Number(r.rateNaira || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-muted-foreground ml-1">/ {UNIT_LABELS[r.unit]}</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>

      <RateHistoryDialog
        channel={historyChannel}
        onClose={() => setHistoryChannel(null)}
      />
    </Card>
  );
}

type RateHistoryDialogProps = {
  channel: CommunicationChannel | null;
  onClose: () => void;
};

function RateHistoryDialog({ channel, onClose }: RateHistoryDialogProps) {
  const historyQuery = useQuery({
    ...getCommunicationRateHistoryQueryOptions(channel ?? ("sms" as CommunicationChannel)),
    enabled: Boolean(channel),
  });

  const columns: ColumnDef<CommunicationRate>[] = [
    {
      accessorKey: "effectiveFrom",
      header: "Effective from",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{formatDate(row.original.effectiveFrom)}</div>
          <div className="text-xs text-muted-foreground">
            {formatTime(row.original.effectiveFrom)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "rateKobo",
      header: "Rate",
      cell: ({ row }) => (
        <span className="font-medium">
          ₦{(row.original.rateKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.enabled
              ? "bg-success/10 text-success border-success/20"
              : "bg-muted text-muted-foreground"
          }
        >
          {row.original.enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <Dialog open={channel !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {channel ? CHANNEL_LABELS[channel] : ""} rate history
          </DialogTitle>
          <DialogDescription>Every rate this channel has had, newest first.</DialogDescription>
        </DialogHeader>
        <DataTable
          columns={columns}
          data={historyQuery.data?.data ?? []}
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          errorMessage={historyQuery.error?.message}
          onRetry={() => historyQuery.refetch()}
          emptyState="No rate history yet"
        />
      </DialogContent>
    </Dialog>
  );
}
