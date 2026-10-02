import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
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
import type { SimIdentityValues } from "./simIdentity";
import { OTHER_CARRIER } from "./simIdentity";

type SimIdentityFieldsProps = {
  form: UseFormReturn<SimIdentityValues>;
  carrierOptions: readonly string[];
};

export function SimIdentityFields({
  form,
  carrierOptions,
}: SimIdentityFieldsProps) {
  const initialCarrier = form.getValues("carrier");
  const [
    otherMode,
    setOtherMode,
  ] = useState(Boolean(initialCarrier) && !carrierOptions.includes(initialCarrier));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="iccid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ICCID *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={20}
                  placeholder="8923411012345678901"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="msisdn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="+2348031234567"
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
          name="imsi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IMSI</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="621301234567890"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="carrier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carrier</FormLabel>
              <Select
                name={field.name}
                value={otherMode ? OTHER_CARRIER : field.value}
                onValueChange={(value) => {
                  const isOther = value === OTHER_CARRIER;
                  setOtherMode(isOther);
                  field.onChange(isOther ? "" : value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {carrierOptions.map(carrier => (
                    <SelectItem
                      key={carrier}
                      value={carrier}
                    >
                      {carrier}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_CARRIER}>{OTHER_CARRIER}</SelectItem>
                </SelectContent>
              </Select>
              {!otherMode && <FormMessage />}
            </FormItem>
          )}
        />
      </div>

      {otherMode && (
        <FormField
          control={form.control}
          name="carrier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carrier Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter carrier name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
