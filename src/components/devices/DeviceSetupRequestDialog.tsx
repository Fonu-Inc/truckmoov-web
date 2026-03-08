import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeviceCatalog } from '@/hooks/useDeviceCatalog';
import { useVehicles } from '@/hooks/useVehicles';
import { CreateDeviceSetupRequest } from '@/hooks/useDeviceSetupRequests';
import { Cpu, Upload, Loader2 } from 'lucide-react';

interface DeviceSetupRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDeviceSetupRequest) => Promise<unknown>;
  onUploadFile?: (file: File, requestId: string, type: 'device_photo' | 'receipt') => Promise<string | null>;
}

export function DeviceSetupRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  onUploadFile,
}: DeviceSetupRequestDialogProps) {
  const { getManufacturers, getModelsForManufacturer, catalog } = useDeviceCatalog();
  const { vehicles } = useVehicles();

  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [catalogId, setCatalogId] = useState<string | undefined>();
  const [imei, setImei] = useState('');
  const [trackerType, setTrackerType] = useState('hardwired');
  const [simIccid, setSimIccid] = useState('');
  const [needsSim, setNeedsSim] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [installationState, setInstallationState] = useState('');
  const [installationCity, setInstallationCity] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [devicePhoto, setDevicePhoto] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const manufacturers = getManufacturers();
  const models = manufacturer ? getModelsForManufacturer(manufacturer) : [];

  // Auto-select vehicle if only one
  useEffect(() => {
    if (vehicles.length === 1 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [vehicles, vehicleId]);

  // Auto-set catalog ID when model is selected
  useEffect(() => {
    if (manufacturer && model) {
      const entry = catalog.find(c => c.manufacturer === manufacturer && c.model === model);
      setCatalogId(entry?.id);
    }
  }, [manufacturer, model, catalog]);

  const resetForm = () => {
    setManufacturer('');
    setModel('');
    setCatalogId(undefined);
    setImei('');
    setTrackerType('hardwired');
    setSimIccid('');
    setNeedsSim(false);
    setVehicleId('');
    setInstallationState('');
    setInstallationCity('');
    setPreferredDate('');
    setPreferredTime('');
    setNotes('');
    setDevicePhoto(null);
    setReceiptFile(null);
  };

  const handleSubmit = async () => {
    if (!manufacturer || !imei) return;
    setSubmitting(true);

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);

    const data: CreateDeviceSetupRequest = {
      manufacturer,
      model: model || undefined,
      catalog_id: catalogId,
      imei: imei.trim(),
      tracker_type: trackerType,
      sim_iccid: simIccid.trim() || undefined,
      needs_sim: needsSim,
      vehicle_id: vehicleId || undefined,
      vehicle_name: selectedVehicle?.registrationNumber || undefined,
      installation_state: installationState || undefined,
      installation_city: installationCity || undefined,
      preferred_date: preferredDate || undefined,
      preferred_time: preferredTime || undefined,
      requester_notes: notes || undefined,
    };

    const result = await onSubmit(data);
    
    // Upload files after request is created
    if (result && onUploadFile && typeof result === 'object' && 'id' in (result as any)) {
      const requestId = (result as any).id;
      if (devicePhoto) {
        await onUploadFile(devicePhoto, requestId, 'device_photo');
      }
      if (receiptFile) {
        await onUploadFile(receiptFile, requestId, 'receipt');
      }
    }
    
    setSubmitting(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {/* Manufacturer + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Manufacturer *</Label>
              <Select value={manufacturer} onValueChange={(v) => { setManufacturer(v); setModel(''); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {manufacturers.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel} disabled={!manufacturer}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.id} value={m.model}>{m.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* IMEI */}
          <div className="space-y-1.5">
            <Label>IMEI / Serial Number *</Label>
            <Input
              value={imei}
              onChange={e => setImei(e.target.value)}
              placeholder="e.g. 353456789012345"
              className="font-mono"
            />
          </div>

          {/* Tracker Type */}
          <div className="space-y-1.5">
            <Label>Tracker Type *</Label>
            <Select value={trackerType} onValueChange={setTrackerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="obd">OBD-II Plug & Play</SelectItem>
                <SelectItem value="hardwired">Hardwired</SelectItem>
                <SelectItem value="battery">Battery / Portable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SIM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>I need a SIM card</Label>
              <Switch checked={needsSim} onCheckedChange={setNeedsSim} />
            </div>
            {!needsSim && (
              <div className="space-y-1.5">
                <Label>SIM ICCID (optional)</Label>
                <Input
                  value={simIccid}
                  onChange={e => setSimIccid(e.target.value)}
                  placeholder="e.g. 8923410012345678901"
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-1.5">
            <Label>Attach to Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installation Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={installationState}
                onChange={e => setInstallationState(e.target.value)}
                placeholder="e.g. Lagos"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={installationCity}
                onChange={e => setInstallationCity(e.target.value)}
                placeholder="e.g. Ikeja"
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
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger><SelectValue placeholder="Any time" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am–12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm–8pm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          {/* File Uploads */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Device Photo (optional)</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setDevicePhoto(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {devicePhoto && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Upload className="h-3 w-3" /> {devicePhoto.name}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Waybill / Receipt (optional)</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {receiptFile && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Upload className="h-3 w-3" /> {receiptFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !manufacturer || !imei}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
