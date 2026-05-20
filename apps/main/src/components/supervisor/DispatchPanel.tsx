import { useState } from "react";
import { Send, MapPin, Package, Clock, User, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  registrationNumber: string;
  status: string;
  currentDriver?: string;
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

interface DispatchPanelProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicleId?: string | null;
}

export function DispatchPanel({
  vehicles,
  drivers,
  open,
  onOpenChange,
  selectedVehicleId,
}: DispatchPanelProps) {
  const [formData, setFormData] = useState({
    vehicleId: selectedVehicleId || "",
    driverId: "",
    pickupLocation: "",
    deliveryLocation: "",
    cargoDescription: "",
    priority: "normal",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableVehicles = vehicles.filter(
    (v) => v.status === "active" || v.status === "idle"
  );
  const availableDrivers = drivers.filter((d) => d.status === "available" || d.status === "active");

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.pickupLocation || !formData.deliveryLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Dispatch created successfully", {
      description: `Job assigned to ${
        availableVehicles.find((v) => v.id === formData.vehicleId)?.registrationNumber
      }`,
    });
    
    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({
      vehicleId: "",
      driverId: "",
      pickupLocation: "",
      deliveryLocation: "",
      cargoDescription: "",
      priority: "normal",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Create New Dispatch
          </DialogTitle>
          <DialogDescription>
            Assign a job to a vehicle and driver for immediate dispatch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="flex items-center gap-1">
                <Truck className="h-3 w-3" /> Vehicle *
              </Label>
              <Select
                value={formData.vehicleId}
                onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        {vehicle.registrationNumber}
                        <Badge variant="outline" className="text-xs">
                          {vehicle.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver" className="flex items-center gap-1">
                <User className="h-3 w-3" /> Driver
              </Label>
              <Select
                value={formData.driverId}
                onValueChange={(value) => setFormData({ ...formData, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center gap-2">
                        {driver.name}
                        <Badge
                          variant={driver.status === "available" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {driver.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Pickup Location *
            </Label>
            <Input
              id="pickup"
              placeholder="Enter pickup address"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Delivery Location *
            </Label>
            <Input
              id="delivery"
              placeholder="Enter delivery address"
              value={formData.deliveryLocation}
              onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo" className="flex items-center gap-1">
                <Package className="h-3 w-3" /> Cargo Description
              </Label>
              <Input
                id="cargo"
                placeholder="e.g., Electronics, 50kg"
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
