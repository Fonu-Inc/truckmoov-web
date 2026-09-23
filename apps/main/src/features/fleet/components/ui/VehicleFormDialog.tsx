import type { Vehicle } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCapacityUnits } from "@truckmoov/api/fleet";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

// Server rejects capacity above these per unit (TRU-FE-2 § 4) — mirror them so the error is inline.
const CAPACITY_MAX = {
  tons: 100,
  kg: 100000,
  lb: 220000,
  m3: 200,
  pallets: 100,
} as const;

const vehicleSchema = z.object({
  plateNumber: z.string().min(
    1,
    "Plate number is required",
  ).max(
    20,
    "Plate number too long",
  ),
  vin: z.string().min(
    17,
    "VIN must be 17 characters",
  ).max(
    17,
    "VIN must be 17 characters",
  ),
  registrationNumber: z.string().min(
    1,
    "Registration number is required",
  ).max(
    20,
    "Registration too long",
  ),
  make: z.string().min(
    1,
    "Make is required",
  ).max(
    50,
    "Make too long",
  ),
  model: z.string().min(
    1,
    "Model is required",
  ).max(
    50,
    "Model too long",
  ),
  year: z.coerce.number().min(
    1990,
    "Year must be 1990 or later",
  ).max(
    new Date().getFullYear() + 1,
    "Invalid year",
  ),
  type: z.enum([
    "truck",
    "van",
    "trailer",
  ]),
  capacity: z.coerce.number().min(
    0,
    "Capacity must be positive",
  ),
  capacityUnit: z.enum([
    "kg",
    "lb",
    "tons",
    "m3",
    "pallets",
  ]).default("tons"),
}).superRefine((v, ctx) => {
  const max = CAPACITY_MAX[v.capacityUnit];
  if (v.capacity > max) {
    ctx.addIssue({
      code: "custom",
      path: ["capacity"],
      message: `Max ${max.toLocaleString()} ${v.capacityUnit}`,
    });
  }
});

// ponytail: server-truthful fallback if /capacity-units hasn't loaded yet
const FALLBACK_UNITS: {
  value: "kg" | "lb" | "tons" | "m3" | "pallets"; label: string;
}[] = [
  {
    value: "kg", label: "Kilograms (kg)",
  },
  {
    value: "lb", label: "Pounds (lb)",
  },
  {
    value: "tons", label: "Tons",
  },
  {
    value: "m3", label: "Cubic metres (m³)",
  },
  {
    value: "pallets", label: "Pallets",
  },
];

type VehicleFormData = z.infer<typeof vehicleSchema>;

type VehicleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Vehicle>) => void;
  vehicle?: Vehicle | null;
  title: string;
  isSubmitting?: boolean;
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  onSubmit,
  vehicle,
  title,
  isSubmitting = false,
}: VehicleFormDialogProps) {
  const { data: capacityUnitsResp } = useCapacityUnits();
  const defaultUnit = capacityUnitsResp?.data?.default ?? "tons";
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plateNumber: "",
      vin: "",
      registrationNumber: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      type: "truck",
      capacity: 0,
      capacityUnit: "tons",
    },
  });

  useEffect(
    () => {
      if (vehicle) {
        form.reset({
          plateNumber: vehicle.plateNumber ?? "",
          vin: vehicle.vin,
          registrationNumber: vehicle.registrationNumber,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          capacity: vehicle.capacity,
          capacityUnit: vehicle.capacityUnit ?? defaultUnit,
        });
      }
      else {
        form.reset({
          plateNumber: "",
          vin: "",
          registrationNumber: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          type: "truck",
          capacity: 0,
          capacityUnit: defaultUnit,
        });
      }
    },
    [
      vehicle,
      form,
      open,
      defaultUnit,
    ],
  );

  const handleSubmit = (data: VehicleFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update the vehicle details below." : "Fill in the vehicle details to add to your fleet."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plate Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LAG-123-XY"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="RC-0001234"
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
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="17-character VIN"
                      maxLength={17}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mercedes-Benz"
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
                        placeholder="Actros"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="trailer">Trailer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="40"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacityUnit"
                render={({ field }) => {
                  const units = capacityUnitsResp?.data?.units ?? FALLBACK_UNITS;
                  return (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map(u => (
                            <SelectItem
                              key={u.value}
                              value={u.value}
                            >
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
              >
                {vehicle ? "Save Changes" : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
