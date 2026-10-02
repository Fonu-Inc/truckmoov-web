import type { SystemDeviceCatalogModel } from "@truckmoov/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DEVICE_CATALOG_PROTOCOLS,
  useCreateDeviceCatalogEntry,
  useUpdateDeviceCatalogEntry,
} from "@truckmoov/api/auth";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
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
import {
  CATALOG_STATUSES,
  FEATURE_OPTIONS,
  STATUS_LABEL,
} from "./catalogShared";

const FORM_ID = "device-catalog-form";

const schema = z.object({
  manufacturer: z.string().trim().min(
    1,
    "Manufacturer is required.",
  ),
  model: z.string().trim().min(
    1,
    "Model is required.",
  ),
  protocolType: z.enum(DEVICE_CATALOG_PROTOCOLS),
  defaultPort: z.number().int().positive("Default port must be positive.").optional(),
  supportedFeatures: z.array(z.enum([
    "obd2",
    "fuel",
    "sos",
  ])),
  status: z.enum([
    "supported",
    "deprecated",
    "blocked",
  ]),
  configurationInstructions: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  manufacturer: "",
  model: "",
  protocolType: "TCP",
  defaultPort: undefined,
  supportedFeatures: [],
  status: "supported",
  configurationInstructions: "",
};

function toFormValues(model: SystemDeviceCatalogModel | null): FormValues {
  if (!model)
    return emptyValues;
  return {
    manufacturer: model.manufacturer,
    model: model.model,
    protocolType: model.protocolType,
    defaultPort: model.defaultPort || undefined,
    supportedFeatures: model.supportedFeatures.filter(
      (feature): feature is FormValues["supportedFeatures"][number] =>
        FEATURE_OPTIONS.some(option => option.value === feature),
    ),
    status: model.status,
    configurationInstructions: model.configurationInstructions ?? "",
  };
}

type CatalogModelDialogProps = {
  open: boolean;
  model: SystemDeviceCatalogModel | null;
  onOpenChange: (open: boolean) => void;
};

export function CatalogModelDialog({
  open,
  model,
  onOpenChange,
}: CatalogModelDialogProps) {
  const isEdit = model !== null;
  const createEntry = useCreateDeviceCatalogEntry();
  const updateEntry = useUpdateDeviceCatalogEntry();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(
    () => {
      if (open)
        form.reset(toFormValues(model));
    },
    [
      open,
      model,
      form,
    ],
  );

  function handleSubmit(values: FormValues) {
    const instructions = values.configurationInstructions?.trim();
    const data = {
      manufacturer: values.manufacturer,
      model: values.model,
      protocolType: values.protocolType,
      defaultPort: values.defaultPort,
      supportedFeatures: values.supportedFeatures,
      status: values.status,
    };
    const onSuccess = () => {
      toast.success(isEdit ? "Device model updated" : "Device model added");
      onOpenChange(false);
    };

    if (isEdit) {
      updateEntry.mutate(
        {
          id: model.id, data: {
            ...data, configurationInstructions: instructions ?? "",
          },
        },
        {
          onSuccess, onError: error => toast.error(error.message),
        },
      );
      return;
    }
    createEntry.mutate(
      {
        data: {
          ...data, configurationInstructions: instructions || undefined,
        },
      },
      {
        onSuccess, onError: error => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Device Model" : "Add Device Model"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the device model configuration." : "Add a new device model to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Teltonika"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., FMC130"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="protocolType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol Type</FormLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEVICE_CATALOG_PROTOCOLS.map(protocol => (
                          <SelectItem
                            key={protocol}
                            value={protocol}
                          >
                            {protocol}
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
                name="defaultPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5001"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={event => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supportedFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supported Features</FormLabel>
                  <div className="flex gap-6">
                    {FEATURE_OPTIONS.map(({
                      value,
                      label,
                      icon: Icon,
                    }) => (
                      <FormItem
                        key={value}
                        className="flex items-center gap-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value.includes(value)}
                            onCheckedChange={checked => field.onChange(
                              checked
                                ? [
                                    ...field.value,
                                    value,
                                  ]
                                : field.value.filter(feature => feature !== value),
                            )}
                          />
                        </FormControl>
                        <FormLabel className="flex items-center gap-1 font-normal">
                          <Icon className="h-4 w-4" />
                          {label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATALOG_STATUSES.map(status => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {STATUS_LABEL[status]}
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
              name="configurationInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Markdown-formatted configuration instructions..."
                      rows={4}
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
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={createEntry.isPending || updateEntry.isPending}
          >
            {isEdit ? "Save Changes" : "Add Model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
