import type { Job } from "@/types";
import {
  useDrivers, useVehicles,
} from "@truckmoov/api/fleet";
import {
  AlertCircle, CheckCircle, ListChecks, Loader2, MapPin, Truck, User,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { toast } from "sonner";
import {
  Alert, AlertDescription,
} from "@/components/shadcn/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useCurrency } from "@/contexts/CurrencyContext";

type JobMatchingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onAssign: (vehicleId: string, driverId: string, driverPhone?: string) => void | Promise<void>;
  onRecommend?: (vehicleId: string, driverId: string) => void;
  /**
   * When true, the dialog only allows recommending a driver (no live dispatch).
   *  Used by Enterprise admins — only Fleet Providers and Dispatchers can assign.
   */
  recommendOnly?: boolean;
};

/** Manual dispatch: pick a vehicle and a driver from the tenant's roster. */
export function JobMatchingDialog({
  open, onOpenChange, job, onAssign, onRecommend, recommendOnly = false,
}: JobMatchingDialogProps) {
  const [
    confirmRecommendOpen,
    setConfirmRecommendOpen,
  ] = useState(false);
  const [
    vehicleId,
    setVehicleId,
  ] = useState<string>("");
  const [
    driverId,
    setDriverId,
  ] = useState<string>("");
  const [
    isAssigning,
    setIsAssigning,
  ] = useState(false);
  const vehiclesQuery = useVehicles();
  const driversQuery = useDrivers();
  const { format: formatCurrency } = useCurrency();

  const availableVehicles = vehiclesQuery.data?.data ?? [];
  const availableDrivers = driversQuery.data?.data ?? [];
  const selectedVehicle = availableVehicles.find(v => v.id === vehicleId);
  const selectedDriver = availableDrivers.find(d => d.id === driverId);
  const isRosterLoading = vehiclesQuery.isLoading || driversQuery.isLoading;

  useEffect(
    () => {
      if (open) {
        setVehicleId("");
        setDriverId("");
      }
    },
    [
      open,
      job,
    ],
  );

  const handleAssign = async () => {
    if (!vehicleId || !driverId) {
      toast.error("Please select both a vehicle and driver");
      return;
    }
    if (!selectedVehicle || !selectedDriver)
      return;

    setIsAssigning(true);
    try {
      await onAssign(
        vehicleId,
        driverId,
        selectedDriver.phone,
      );
      onOpenChange(false);
    }
    catch {
      // The page-level mutation handler displays the API error and keeps the modal open.
    }
    finally {
      setIsAssigning(false);
    }
  };

  const handleRecommend = () => {
    if (!vehicleId || !driverId || !onRecommend)
      return;
    onRecommend(
      vehicleId,
      driverId,
    );
    toast.success(
      selectedDriver
        ? `${selectedDriver.name} recommended for job ${job?.reference}`
        : "Driver recommended for job",
    );
    setConfirmRecommendOpen(false);
    onOpenChange(false);
  };

  if (!job)
    return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            {recommendOnly ? "Recommend Driver" : "Dispatch Job"}
          </DialogTitle>
          <DialogDescription>
            Select a vehicle and driver for job
            {" "}
            {job.reference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job Summary */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{job.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span>{job.delivery.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(job.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.cargo.weight}
                    {" "}
                    tons
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Select Vehicle
                  </Label>
                  <Select
                    value={vehicleId}
                    onValueChange={setVehicleId}
                    disabled={vehiclesQuery.isLoading || vehiclesQuery.isError}
                  >
                    <SelectTrigger aria-label="Select vehicle">
                      <SelectValue placeholder="Choose a vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(v => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{v.registrationNumber || v.plateNumber}</span>
                            <span className="text-muted-foreground">
                              -
                              {" "}
                              {[
                                v.make,
                                v.model,
                              ].filter(Boolean).join(" ") || v.type}
                              {v.capacity != null ? ` (${v.capacity}t)` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Select Driver
                  </Label>
                  <Select
                    value={driverId}
                    onValueChange={setDriverId}
                    disabled={driversQuery.isLoading || driversQuery.isError}
                  >
                    <SelectTrigger aria-label="Select driver">
                      <SelectValue placeholder="Choose a driver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map(d => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.name}</span>
                            <span className="text-muted-foreground">{d.phone}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isRosterLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vehicles and drivers...
                </div>
              )}

              {(vehiclesQuery.isError || driversQuery.isError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Unable to load the vehicle and driver roster. Please try again.</AlertDescription>
                </Alert>
              )}

              {vehicleId && driverId && (
                <Alert className="bg-muted/30">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Ready to dispatch:
                    {" "}
                    {selectedVehicle?.registrationNumber || selectedVehicle?.plateNumber}
                    {" "}
                    with
                    {" "}
                    {selectedDriver?.name}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {recommendOnly
              ? (
                  <>
                    <Button
                      variant="gradient"
                      disabled={!vehicleId || !driverId}
                      onClick={() => setConfirmRecommendOpen(true)}
                    >
                      Recommend Driver
                    </Button>
                    <AlertDialog
                      open={confirmRecommendOpen}
                      onOpenChange={setConfirmRecommendOpen}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Recommend this driver?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {selectedDriver ? selectedDriver.name : "This driver"}
                            {" "}
                            will be recommended for job
                            {" "}
                            {job.reference}
                            . The fleet provider or dispatcher will make the final assignment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRecommend}>
                            Recommend Driver
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )
              : (
                  <Button
                    variant="gradient"
                    onClick={handleAssign}
                    loading={isAssigning}
                    disabled={!vehicleId || !driverId || isAssigning || isRosterLoading}
                  >
                    {isAssigning ? "Assigning..." : "Assign Driver"}
                  </Button>
                )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
