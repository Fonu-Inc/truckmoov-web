import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Route, Clock, FileText } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const completionSchema = z.object({
  revenueNgn: z.coerce.number().min(0, "Revenue must be positive"),
  billableKm: z.coerce.number().min(0, "Distance must be positive").optional(),
  billableHours: z.coerce.number().min(0, "Hours must be positive").optional(),
  customerChargeNgn: z.coerce.number().min(0, "Charge must be positive").optional(),
  completionNotes: z.string().max(500).optional(),
});

type CompletionFormData = z.infer<typeof completionSchema>;

interface JobCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    reference: string;
    amountNgn: number;
    pickupAddress: string;
    deliveryAddress: string;
  } | null;
  onComplete: (data: {
    revenueNgn: number;
    billableKm?: number;
    billableHours?: number;
    customerChargeNgn?: number;
    completionNotes?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function JobCompletionDialog({ 
  open, 
  onOpenChange, 
  job, 
  onComplete,
  isSubmitting = false 
}: JobCompletionDialogProps) {
  const { format: formatCurrency } = useCurrency();

  const form = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      revenueNgn: 0,
      billableKm: undefined,
      billableHours: undefined,
      customerChargeNgn: undefined,
      completionNotes: "",
    },
  });

  useEffect(() => {
    if (job) {
      // Pre-populate with job amount as default revenue
      form.reset({
        revenueNgn: job.amountNgn || 0,
        billableKm: undefined,
        billableHours: undefined,
        customerChargeNgn: job.amountNgn || 0,
        completionNotes: "",
      });
    }
  }, [job, form]);

  const handleSubmit = (data: CompletionFormData) => {
    onComplete({
      revenueNgn: data.revenueNgn,
      billableKm: data.billableKm,
      billableHours: data.billableHours,
      customerChargeNgn: data.customerChargeNgn,
      completionNotes: data.completionNotes,
    });
  };

  if (!job) return null;

  const watchedRevenue = form.watch("revenueNgn");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Complete Job
          </DialogTitle>
          <DialogDescription>
            Record financial details for job completion and P&L tracking.
          </DialogDescription>
        </DialogHeader>

        {/* Job Summary */}
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-mono">
                {job.reference}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Quoted: {formatCurrency(job.amountNgn)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="truncate">From: {job.pickupAddress}</p>
              <p className="truncate">To: {job.deliveryAddress}</p>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Revenue Section */}
            <div className="p-4 rounded-lg bg-success/5 border border-success/20 space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2 text-success">
                <DollarSign className="h-4 w-4" />
                Revenue Details
              </h4>
              
              <FormField
                control={form.control}
                name="revenueNgn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Revenue (NGN) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100" 
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The actual revenue earned from this job
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerChargeNgn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Charge (NGN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100" 
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Amount invoiced to customer (if different from revenue)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trip Metrics */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Trip Metrics
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billableKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billableHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.5" 
                          placeholder="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="completionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Completion Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about the delivery..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Revenue Preview */}
            {watchedRevenue > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-sm font-medium">Revenue to Record:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(watchedRevenue)}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
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
                variant="gradient"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing..." : "Complete Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
