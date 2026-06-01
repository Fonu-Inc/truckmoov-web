import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SIMCard } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shadcn/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { useEffect } from "react";

const simSchema = z.object({
  iccid: z.string().min(19, "ICCID must be 19-20 digits").max(20),
  imsi: z.string().min(15, "IMSI must be 15 digits").max(15),
  mobileNumber: z.string().min(10, "Invalid phone number").max(20),
  networkOperator: z.string().min(1, "Operator required"),
  dataLimit: z.coerce.number().min(1).max(100),
  simType: z.enum(["IOT", "DRIVER", "HOTSPOT"]).default("IOT"),
  monthlyRentalNgn: z.coerce.number().min(0).default(0),
});

const simTypes: { value: "IOT" | "DRIVER" | "HOTSPOT"; label: string }[] = [
  { value: "IOT", label: "IoT (telematics device)" },
  { value: "DRIVER", label: "Driver (voice/SMS handset)" },
  { value: "HOTSPOT", label: "Hotspot / MiFi" },
];

type SIMFormData = z.infer<typeof simSchema>;

interface SIMFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<SIMCard>) => void;
  sim?: SIMCard | null;
  title: string;
}

const operators = ["MTN Nigeria", "Airtel Nigeria", "Glo Nigeria", "9mobile", "Safaricom", "Vodacom"];

export function SIMFormDialog({ open, onOpenChange, onSubmit, sim, title }: SIMFormDialogProps) {
  const form = useForm<SIMFormData>({
    resolver: zodResolver(simSchema),
    defaultValues: { iccid: "", imsi: "", mobileNumber: "", networkOperator: "", dataLimit: 5, simType: "IOT", monthlyRentalNgn: 0 },
  });

  useEffect(() => {
    if (sim) {
      form.reset({
        iccid: sim.iccid, imsi: sim.imsi, mobileNumber: sim.mobileNumber,
        networkOperator: sim.networkOperator, dataLimit: sim.dataLimit,
        simType: ((sim as unknown as { sim_type?: "IOT" | "DRIVER" | "HOTSPOT" }).sim_type) ?? "IOT",
        monthlyRentalNgn: ((sim as unknown as { monthly_rental_ngn?: number }).monthly_rental_ngn) ?? 0,
      });
    } else {
      form.reset({ iccid: "", imsi: "", mobileNumber: "", networkOperator: "", dataLimit: 5, simType: "IOT", monthlyRentalNgn: 0 });
    }
  }, [sim, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{sim ? "Update SIM card details." : "Register a new SIM card."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="iccid" render={({ field }) => (
              <FormItem><FormLabel>ICCID</FormLabel><FormControl><Input placeholder="89234500001234567890" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="imsi" render={({ field }) => (
              <FormItem><FormLabel>IMSI</FormLabel><FormControl><Input placeholder="234500123456789" maxLength={15} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="mobileNumber" render={({ field }) => (
              <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="+234 901 234 5678" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="networkOperator" render={({ field }) => (
              <FormItem><FormLabel>Network Operator</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger></FormControl>
                  <SelectContent>{operators.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dataLimit" render={({ field }) => (
              <FormItem><FormLabel>Data Limit (GB)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="simType" render={({ field }) => (
              <FormItem><FormLabel>SIM Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{simTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="monthlyRentalNgn" render={({ field }) => (
              <FormItem><FormLabel>Monthly Rental (₦)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{sim ? "Save Changes" : "Register SIM"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



