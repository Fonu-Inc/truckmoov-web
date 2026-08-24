import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle, Fuel, Gauge, Info,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/shadcn/badge";
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
import { Skeleton } from "@/components/shadcn/skeleton";

type DeviceCatalogEntry = {
  id: string;
  manufacturer: string;
  model: string;
  protocol_type: string;
  default_port?: number | null;
  supports_obd: boolean;
  supports_fuel: boolean;
  supports_sos: boolean;
};

const deviceSchema = z.object({
  imei: z.string().min(
    15,
    "IMEI must be 15 digits",
  ).max(
    15,
    "IMEI must be 15 digits",
  ).regex(
    /^\d+$/,
    "IMEI must contain only digits",
  ),
  catalog_id: z.string().uuid("Please select a device model"),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

type DeviceFormDialogWithCatalogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    imei: string; catalog_id: string; manufacturer: string; model: string;
  }) => void;
  title: string;
};

export function DeviceFormDialogWithCatalog({
  open,
  onOpenChange,
  onSubmit,
  title,
}: DeviceFormDialogWithCatalogProps) {
  const catalog: DeviceCatalogEntry[] = [];
  const loading = false;
  const getManufacturers = (): string[] => [];
  const getModelsForManufacturer = (_manufacturer: string): DeviceCatalogEntry[] => [];
  const [
    selectedManufacturer,
    setSelectedManufacturer,
  ] = useState<string>("");
  const [
    selectedCatalogEntry,
    setSelectedCatalogEntry,
  ] = useState<DeviceCatalogEntry | null>(null);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      imei: "",
      catalog_id: "",
    },
  });

  // Reset form when dialog opens
  useEffect(
    () => {
      if (open) {
        form.reset({
          imei: "",
          catalog_id: "",
        });
        setSelectedManufacturer("");
        setSelectedCatalogEntry(null);
      }
    },
    [
      open,
      form,
    ],
  );

  const manufacturers = getManufacturers();
  const modelsForManufacturer = selectedManufacturer
    ? getModelsForManufacturer(selectedManufacturer)
    : [];

  const handleManufacturerChange = (manufacturer: string) => {
    setSelectedManufacturer(manufacturer);
    form.setValue(
      "catalog_id",
      "",
    );
    setSelectedCatalogEntry(null);
  };

  const handleModelChange = (catalogId: string) => {
    form.setValue(
      "catalog_id",
      catalogId,
    );
    const entry = catalog.find(c => c.id === catalogId);
    setSelectedCatalogEntry(entry || null);
  };

  const handleSubmit = (data: DeviceFormData) => {
    const entry = catalog.find(c => c.id === data.catalog_id);
    if (!entry)
      return;

    onSubmit({
      imei: data.imei,
      catalog_id: data.catalog_id,
      manufacturer: entry.manufacturer,
      model: entry.model,
    });
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Register a new IoT tracking device from the approved catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Manufacturer Selection */}
            <div className="space-y-2">
              <FormLabel>Manufacturer</FormLabel>
              <Select
                value={selectedManufacturer}
                onValueChange={handleManufacturerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map(m => (
                    <SelectItem
                      key={m}
                      value={m}
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manufacturers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No supported manufacturers available. Contact platform admin.
                </p>
              )}
            </div>

            {/* Model Selection */}
            <FormField
              control={form.control}
              name="catalog_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select
                    onValueChange={handleModelChange}
                    value={field.value}
                    disabled={!selectedManufacturer}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          selectedManufacturer
                            ? "Select model"
                            : "Select manufacturer first"
                        }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelsForManufacturer.map(entry => (
                        <SelectItem
                          key={entry.id}
                          value={entry.id}
                        >
                          <div className="flex items-center gap-2">
                            <span>{entry.model}</span>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {entry.protocol_type.toUpperCase()}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Model Info */}
            {selectedCatalogEntry && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedCatalogEntry.manufacturer}
                    {" "}
                    {selectedCatalogEntry.model}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Port:
                    {" "}
                    {selectedCatalogEntry.default_port || "Default"}
                  </Badge>
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Gauge className={`h-3.5 w-3.5 ${selectedCatalogEntry.supports_obd ? "text-info" : "text-muted-foreground/30"}`} />
                    <span className={selectedCatalogEntry.supports_obd ? "" : "line-through"}>OBD-II</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className={`h-3.5 w-3.5 ${selectedCatalogEntry.supports_fuel ? "text-warning" : "text-muted-foreground/30"}`} />
                    <span className={selectedCatalogEntry.supports_fuel ? "" : "line-through"}>Fuel</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className={`h-3.5 w-3.5 ${selectedCatalogEntry.supports_sos ? "text-destructive" : "text-muted-foreground/30"}`} />
                    <span className={selectedCatalogEntry.supports_sos ? "" : "line-through"}>SOS</span>
                  </div>
                </div>
              </div>
            )}

            {/* IMEI Input */}
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IMEI Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="359779090012345"
                      maxLength={15}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-1 text-xs">
                    <Info className="h-3 w-3" />
                    15-digit identifier found on device label
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lifecycle Info */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Next Steps:</strong>
                {" "}
                After registration, the device will be in
                <em>Registered</em>
                {" "}
                status.
                An installer must configure the device, then it needs to transmit valid telemetry before
                it can be assigned to a vehicle.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid}
              >
                Register Device
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
