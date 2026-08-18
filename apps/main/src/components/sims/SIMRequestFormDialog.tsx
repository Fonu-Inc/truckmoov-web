import type { DeviceMappingRow } from "./DeviceMappingUpload";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  getSimCarriersQueryOptions, getSimDataBundlesQueryOptions,
} from "@truckmoov/api/auth";
import {
  HardDrive, Loader2, Wifi,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { DeviceMappingUpload } from "./DeviceMappingUpload";

// Tenant data-bundle plan (GET /auth/sims/data-bundles → data.items[])
type BundleItem = {
  id: string;
  code: string;
  name: string;
  carrier: string;
  dataAmountGb: number;
  validityDays: number;
  billingCycle: string;
  price: number;
  currency: string;
  active: boolean;
};

const simRequestSchema = z.object({
  numberOfSims: z.coerce.number().min(
    1,
    "At least 1 SIM required",
  ).max(
    100,
    "Maximum 100 SIMs per request",
  ),
  bundleCode: z.string().min(
    1,
    "Please select a data bundle",
  ),
  planCycle: z.enum([
    "monthly",
    "yearly",
  ]).default("monthly"),
  preferredOperator: z.string().min(
    1,
    "Please select an operator",
  ),
  useCase: z.string().min(
    3,
    "Please describe the use case",
  ).max(
    200,
    "Use case must be under 200 characters",
  ),
  notes: z.string().max(
    500,
    "Notes must be under 500 characters",
  ).optional(),
  deviceMappingEnabled: z.boolean().default(false),
});

type SIMRequestFormData = z.infer<typeof simRequestSchema>;

export type SIMRequestSubmitData = {
  /** Derived from dataAmount + dataUnit, kept for backward compatibility with submit hook. */
  dataLimitGb: number;
  deviceMappingData?: DeviceMappingRow[];
  deviceMappingFileName?: string;
  deviceMappingFile?: File;
} & SIMRequestFormData;

type SIMRequestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SIMRequestSubmitData) => void;
  isSubmitting?: boolean;
};

export function SIMRequestFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: SIMRequestFormDialogProps) {
  const [
    deviceMappingData,
    setDeviceMappingData,
  ] = useState<DeviceMappingRow[]>([]);
  const [
    deviceMappingFileName,
    setDeviceMappingFileName,
  ] = useState<string | null>(null);
  const [
    deviceMappingFile,
    setDeviceMappingFile,
  ] = useState<File | null>(null);

  const form = useForm<SIMRequestFormData>({
    resolver: zodResolver(simRequestSchema),
    defaultValues: {
      numberOfSims: 1,
      bundleCode: "",
      planCycle: "monthly",
      preferredOperator: "",
      useCase: "",
      notes: "",
      deviceMappingEnabled: false,
    },
  });

  const deviceMappingEnabled = form.watch("deviceMappingEnabled");
  const carrier = form.watch("preferredOperator"); // carrier id
  const planCycle = form.watch("planCycle");

  const carriersQuery = useQuery({
    ...getSimCarriersQueryOptions(),
    enabled: open,
  });
  const carriers = carriersQuery.data?.data.carriers ?? [];
  const firstCarrierId = carriers[0]?.id;

  // Auto-select the first carrier once loaded so the data-bundle query fires eagerly.
  useEffect(
    () => {
      if (open && firstCarrierId && !form.getValues("preferredOperator")) {
        form.setValue(
          "preferredOperator",
          firstCarrierId,
        );
      }
    },
    [
      open,
      firstCarrierId,
      form,
    ],
  );

  const bundlesQuery = useQuery({
    ...getSimDataBundlesQueryOptions({
      params: {
        carrierId: carrier,
        billingCycle: planCycle,
      },
    }),
    enabled: open && Boolean(carrier && planCycle),
  });
  const bundlesData = bundlesQuery.data?.data as { items?: BundleItem[] } | undefined;
  const availableBundles = bundlesData?.items ?? [];

  const handleDeviceDataParsed = (data: DeviceMappingRow[], fileName: string, file: File) => {
    setDeviceMappingData(data);
    setDeviceMappingFileName(fileName);
    setDeviceMappingFile(file);
    const validCount = data.filter(r => r.isValid).length;
    if (validCount > 0) {
      form.setValue(
        "numberOfSims",
        validCount,
      );
    }
  };

  const handleClearDeviceData = () => {
    setDeviceMappingData([]);
    setDeviceMappingFileName(null);
    setDeviceMappingFile(null);
  };

  const handleSubmit = (data: SIMRequestFormData) => {
    // bundleCode holds the bundle id; resolve carrier id → name for the request payload.
    const bundle = availableBundles.find(b => b.id === data.bundleCode);
    const carrierName = carriers.find(c => c.id === data.preferredOperator)?.name ?? data.preferredOperator;
    const finalData: SIMRequestSubmitData = {
      ...data,
      preferredOperator: carrierName,
      dataLimitGb: bundle?.dataAmountGb ?? 0,
    };

    if (data.deviceMappingEnabled && deviceMappingData.length > 0) {
      finalData.deviceMappingData = deviceMappingData.filter(r => r.isValid);
      finalData.deviceMappingFileName = deviceMappingFileName || undefined;
      finalData.deviceMappingFile = deviceMappingFile || undefined;
    }

    onSubmit(finalData);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setDeviceMappingData([]);
      setDeviceMappingFileName(null);
      setDeviceMappingFile(null);
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Request IoT SIMs</DialogTitle>
              <DialogDescription>
                Submit a request for IoT SIM cards. Platform admin will review and approve.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="numberOfSims"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of SIMs *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      min={1}
                      max={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredOperator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={carriers.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            carriersQuery.isLoading
                              ? "Loading carriers..."
                              : carriers.length === 0
                                ? "No carriers available"
                                : "Select carrier"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      {carriers.map(c => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                        >
                          {c.displayName}
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
              name="planCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value as string}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Bundle is renewed every
                    {" "}
                    {field.value === "yearly" ? "year" : "month"}
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bundleCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Bundle Plan *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value as string}
                    disabled={!carrier || availableBundles.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !carrier
                              ? "Select carrier first"
                              : availableBundles.length === 0
                                ? "No bundles available for this carrier/plan"
                                : "Select bundle"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      {availableBundles.map(b => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                        >
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Bundles are configured by Platform Admin per carrier and plan type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="useCase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Case *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Fleet GPS tracking, Cold-chain telemetry, Driver dashcams"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Why do you need these SIMs? Helps Platform Admin approve faster.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Device Mapping Toggle */}
            <FormField
              control={form.control}
              name="deviceMappingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2 cursor-pointer">
                      <HardDrive className="h-4 w-4 text-primary" />
                      Device Mapping
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Upload a file to link SIMs to devices after activation
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Device Mapping Upload */}
            {deviceMappingEnabled && (
              <DeviceMappingUpload
                onDataParsed={handleDeviceDataParsed}
                onClear={handleClearDeviceData}
                parsedData={deviceMappingData}
                fileName={deviceMappingFileName}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional requirements or notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    )
                  : (
                      "Submit Request"
                    )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
