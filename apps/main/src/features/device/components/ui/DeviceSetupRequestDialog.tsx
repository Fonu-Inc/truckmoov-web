import type { SimBundleValue } from "./SimBundlePicker";
import { NIGERIAN_STATES } from "@truckmoov/api/auth";
import {
  useDeviceCatalogManufacturers,
  useDeviceCatalogModels,
  useDeviceSetupRequestTrackerTypes,
} from "@truckmoov/api/fleet";
import { CityCombobox } from "@truckmoov/reusables/components/location/CityCombobox";
import {
  Cpu, Loader2,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Switch } from "@/components/shadcn/switch";
import { Textarea } from "@/components/shadcn/textarea";
import { formatSimBundle } from "./simBundle";
import { SimBundlePicker } from "./SimBundlePicker";

type RequestVehicleOption = {
  id: string;
  registrationNumber: string;
  make?: string | null;
  model?: string | null;
};

type DeviceSetupRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<unknown>;
  onUploadFile?: (file: File, requestId: string, type: "device_photo" | "receipt") => Promise<string | null>;
  manufacturers?: string[];
  vehicles?: RequestVehicleOption[];
};

const DEFAULT_MANUFACTURERS = [
  "Teltonika",
  "Queclink",
  "Meitrack",
  "CalAmp",
  "Digital Matter",
  "Geotab",
  "Concox",
  "Coban",
];

export function DeviceSetupRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  onUploadFile: _onUploadFile,
  manufacturers: manufacturerOptionsProp = DEFAULT_MANUFACTURERS,
  vehicles = [],
}: DeviceSetupRequestDialogProps) {
  // TRU-FE-4 § 7 / § 8 — pre-wired catalog + tracker types. Fall back to the
  // hardcoded defaults (prop + hardcoded SelectItems) when BE returns 400/404.
  const catalogManufacturersQuery = useDeviceCatalogManufacturers();
  const manufacturerOptions = catalogManufacturersQuery.data?.data?.manufacturers?.length
    ? catalogManufacturersQuery.data.data.manufacturers
    : manufacturerOptionsProp;
  const [
    manufacturer,
    setManufacturer,
  ] = useState("");
  const [
    model,
    setModel,
  ] = useState("");
  const [
    _catalogId,
    setCatalogId,
  ] = useState<string | undefined>();
  const [
    _imei,
    setImei,
  ] = useState("");
  const [
    trackerType,
    setTrackerType,
  ] = useState("hardwired");
  const [
    simIccid,
    setSimIccid,
  ] = useState("");
  const [
    needsSim,
    setNeedsSim,
  ] = useState(false);
  const [
    simCarrier,
    setSimCarrier,
  ] = useState("");
  const [
    simBundle,
    setSimBundle,
  ] = useState<SimBundleValue>({
    amount: 1, unit: "GB", cycle: "monthly",
  });
  const [
    vehicleId,
    setVehicleId,
  ] = useState("");
  const [
    installationState,
    setInstallationState,
  ] = useState("");
  const [
    installationCity,
    setInstallationCity,
  ] = useState("");
  const [
    preferredDate,
    setPreferredDate,
  ] = useState("");
  const [
    preferredTime,
    setPreferredTime,
  ] = useState("");
  const [
    useCase,
    setUseCase,
  ] = useState("");
  const [
    notes,
    setNotes,
  ] = useState("");
  const [
    quantity,
    setQuantity,
  ] = useState<number>(1);
  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const catalogModelsQuery = useDeviceCatalogModels(manufacturer || undefined);
  const catalogModels = catalogModelsQuery.data?.data?.models ?? [];
  const trackerTypesQuery = useDeviceSetupRequestTrackerTypes();
  const trackerTypes = trackerTypesQuery.data?.data?.trackerTypes ?? [];

  // Auto-select vehicle if only one
  useEffect(
    () => {
      if (vehicles.length === 1 && !vehicleId) {
        setVehicleId(vehicles[0].id);
      }
    },
    [
      vehicles,
      vehicleId,
    ],
  );

  const resetForm = () => {
    setManufacturer("");
    setModel("");
    setCatalogId(undefined);
    setImei("");
    setTrackerType("hardwired");
    setSimIccid("");
    setNeedsSim(false);
    setSimCarrier("");
    setSimBundle({
      amount: 1, unit: "GB", cycle: "monthly",
    });
    setVehicleId("");
    setInstallationState("");
    setInstallationCity("");
    setPreferredDate("");
    setPreferredTime("");
    setUseCase("");
    setNotes("");
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (!manufacturer || !useCase.trim())
      return;
    setSubmitting(true);

    const data: any = {
      manufacturer,
      quantity: Math.max(
        1,
        quantity,
      ),
      model: model || undefined,
      trackerType,
      simRequired: needsSim,
      carrierId: needsSim ? simCarrier || undefined : undefined,
      planType: needsSim ? simBundle.cycle : undefined,
      bundleId: needsSim ? formatSimBundle(simBundle) : undefined,
      vehicleId: vehicleId || undefined,
      state: installationState || undefined,
      city: installationCity || undefined,
      preferredDate: preferredDate || undefined,
      preferredTime: preferredTime || undefined,
      useCase,
      notes: notes || undefined,
    };

    const result = await onSubmit(data);

    setSubmitting(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            Request Device Setup
          </DialogTitle>
          <DialogDescription>
            Submit a request to have a tracking device configured and activated on your vehicle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quantity */}
          <div className="space-y-1.5">
            <Label required>Number of Devices</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(
                1,
                Number(e.target.value) || 1,
              ))}
            />
          </div>

          {/* Manufacturer + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Manufacturer</Label>
              <Select
                value={manufacturer}
                onValueChange={(v) => {
                  setManufacturer(v);
                  setModel("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {manufacturerOptions.map(m => (
                    <SelectItem
                      key={m}
                      value={m}
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              {/* TRU-FE-4 § 7 — catalog-driven when available, freeform Input as fallback. */}
              {catalogModels.length > 0
                ? (
                    <Select
                      value={model}
                      onValueChange={setModel}
                      disabled={!manufacturer}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {catalogModels.map(m => (
                          <SelectItem
                            key={`${m.manufacturer}-${m.model}`}
                            value={m.model}
                          >
                            {m.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                : (
                    <Input
                      value={model}
                      onChange={event => setModel(event.target.value)}
                      disabled={!manufacturer}
                      placeholder="e.g. FMC130"
                    />
                  )}
            </div>
          </div>

          {/* IMEI removed — assigned after provisioning */}

          {/* Tracker Type */}
          <div className="space-y-1.5">
            <Label required>Tracker Type</Label>
            <Select
              value={trackerType}
              onValueChange={setTrackerType}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {/* TRU-FE-4 § 8 — server-driven when available, hardcoded fallback covers the current 400. */}
                {trackerTypes.length > 0
                  ? trackerTypes.map(t => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                      >
                        {t.label}
                      </SelectItem>
                    ))
                  : (
                      <>
                        <SelectItem value="obd">OBD-II Plug & Play</SelectItem>
                        <SelectItem value="hardwired">Hardwired</SelectItem>
                        <SelectItem value="asset">Battery / Portable</SelectItem>
                      </>
                    )}
              </SelectContent>
            </Select>
          </div>

          {/* SIM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>I need a SIM card</Label>
              <Switch
                checked={needsSim}
                onCheckedChange={setNeedsSim}
              />
            </div>
            {needsSim && (
              <SimBundlePicker
                value={simBundle}
                onChange={setSimBundle}
                carrier={simCarrier}
                onCarrierChange={setSimCarrier}
                iccid={simIccid}
                onIccidChange={setSimIccid}
              />
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-1.5">
            <Label>Attach to Vehicle</Label>
            <Select
              value={vehicleId}
              onValueChange={setVehicleId}
            >
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem
                    key={v.id}
                    value={v.id}
                  >
                    {v.registrationNumber}
                    {" "}
                    -
                    {v.make}
                    {" "}
                    {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installation Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select
                value={installationState}
                onValueChange={(state) => {
                  setInstallationState(state);
                  setInstallationCity("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map(state => (
                    <SelectItem
                      key={state}
                      value={state}
                    >
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <CityCombobox
                state={installationState}
                value={installationCity}
                onChange={setInstallationCity}
              />
            </div>
          </div>

          {/* Preferred Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Time</Label>
              <Select
                value={preferredTime}
                onValueChange={setPreferredTime}
              >
                <SelectTrigger><SelectValue placeholder="Any time" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am–12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm–8pm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Use Case */}
          <div className="space-y-1.5">
            <Label required>Use Case</Label>
            <Input
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder="e.g. Long-haul GPS tracking, Fleet telematics, Driver behavior monitoring"
            />
            <p className="text-xs text-muted-foreground">
              Why do you need this device? Helps Platform Admin approve faster.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions or details..."
              rows={3}
            />
          </div>

        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !manufacturer || !useCase.trim()}
          >
            {submitting
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                )
              : (
                  "Submit Request"
                )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
