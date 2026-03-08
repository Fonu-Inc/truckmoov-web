import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wifi, HardDrive } from "lucide-react";
import { DeviceMappingUpload, DeviceMappingRow } from "./DeviceMappingUpload";

const simRequestSchema = z.object({
  numberOfSims: z.coerce.number().min(1, "At least 1 SIM required").max(100, "Maximum 100 SIMs per request"),
  dataLimitGb: z.coerce.number().min(0.5, "Minimum 0.5 GB").max(100, "Maximum 100 GB"),
  preferredOperator: z.string().min(1, "Please select an operator"),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
  deviceMappingEnabled: z.boolean().default(false),
});

type SIMRequestFormData = z.infer<typeof simRequestSchema>;

export interface SIMRequestSubmitData extends SIMRequestFormData {
  deviceMappingData?: DeviceMappingRow[];
  deviceMappingFileName?: string;
}

interface SIMRequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SIMRequestSubmitData) => void;
  isSubmitting?: boolean;
}

const operators = [
  { value: "MTN Nigeria", label: "MTN Nigeria" },
  { value: "Airtel Nigeria", label: "Airtel Nigeria" },
  { value: "Glo Nigeria", label: "Glo Nigeria" },
  { value: "9mobile", label: "9mobile" },
];

export function SIMRequestFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting = false 
}: SIMRequestFormDialogProps) {
  const [deviceMappingData, setDeviceMappingData] = useState<DeviceMappingRow[]>([]);
  const [deviceMappingFileName, setDeviceMappingFileName] = useState<string | null>(null);

  const form = useForm<SIMRequestFormData>({
    resolver: zodResolver(simRequestSchema),
    defaultValues: { 
      numberOfSims: 1, 
      dataLimitGb: 1, 
      preferredOperator: "MTN Nigeria", 
      notes: "",
      deviceMappingEnabled: false,
    },
  });

  const deviceMappingEnabled = form.watch("deviceMappingEnabled");

  const handleDeviceDataParsed = (data: DeviceMappingRow[], fileName: string) => {
    setDeviceMappingData(data);
    setDeviceMappingFileName(fileName);
    // Auto-update number of SIMs based on valid device count
    const validCount = data.filter(r => r.isValid).length;
    if (validCount > 0) {
      form.setValue("numberOfSims", validCount);
    }
  };

  const handleClearDeviceData = () => {
    setDeviceMappingData([]);
    setDeviceMappingFileName(null);
  };

  const handleSubmit = (data: SIMRequestFormData) => {
    const finalData: SIMRequestSubmitData = {
      ...data,
    };

    // Include device mapping if enabled
    if (data.deviceMappingEnabled && deviceMappingData.length > 0) {
      finalData.deviceMappingData = deviceMappingData.filter(r => r.isValid);
      finalData.deviceMappingFileName = deviceMappingFileName || undefined;
    }

    onSubmit(finalData);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setDeviceMappingData([]);
      setDeviceMappingFileName(null);
      form.reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
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
                name="dataLimitGb" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limit per SIM (GB) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        min={0.5} 
                        step={0.5}
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
              name="preferredOperator" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Operator *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What happens next?</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>KYC-verified tenants get instant auto-approval</li>
                <li>Otherwise, platform admin will review your request</li>
                <li>Once approved, SIMs will be provisioned automatically</li>
                {deviceMappingEnabled && deviceMappingData.length > 0 && (
                  <li className="text-primary font-medium">SIMs will be auto-assigned to mapped devices — no manual step needed</li>
                )}
              </ul>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
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
