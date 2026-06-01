import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Textarea } from '@/components/shadcn/textarea';
import { Card, CardContent } from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import { ConfigQueueDevice } from '@/hooks/useInstallerConfig';
import { DeviceCatalogEntry } from '@/hooks/useDeviceCatalog';
import { DeviceLifecycleBadge } from '@/components/devices/DeviceLifecycleBadge';
import { DeviceLifecycleStatus } from '@/hooks/useDeviceLifecycle';
import {
  CheckCircle2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Wifi,
  Server,
  FileText,
  Radio,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface DeviceSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: ConfigQueueDevice;
  catalogEntry?: DeviceCatalogEntry;
  onMarkConfigured: (deviceId: string, notes?: string) => Promise<{ success: boolean }>;
  onComplete: () => void;
  canConfigure: boolean;
}

const INGEST_SERVER = 'ingest.fleetpro.com';

export function DeviceSetupWizard({
  open,
  onOpenChange,
  device,
  catalogEntry,
  onMarkConfigured,
  onComplete,
  canConfigure,
}: DeviceSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 'details', title: 'Device Details', icon: Cpu },
    { id: 'sim', title: 'SIM & Connectivity', icon: Wifi },
    { id: 'server', title: 'Server Settings', icon: Server },
    { id: 'instructions', title: 'Vendor Instructions', icon: FileText },
    { id: 'configure', title: 'Mark Configured', icon: CheckCircle2 },
    { id: 'verify', title: 'Verify Signal', icon: Radio },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleMarkConfigured = async () => {
    setIsSubmitting(true);
    const result = await onMarkConfigured(device.id, notes);
    setIsSubmitting(false);
    if (result.success) {
      setCurrentStep(5); // Move to verify step
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Device Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{device.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{device.model || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IMEI / Serial</p>
                <p className="font-mono text-sm">{device.imei}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <DeviceLifecycleBadge status={device.lifecycle_status as DeviceLifecycleStatus} />
              </div>
            </div>
            
            {catalogEntry?.status === 'deprecated' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">This device model is deprecated. Consider upgrading.</span>
              </div>
            )}
            
            {catalogEntry?.status === 'blocked' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">This device model is blocked and cannot be used.</span>
              </div>
            )}
          </div>
        );

      case 1: // SIM & Connectivity
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ensure the following connectivity requirements are met before proceeding:
            </p>
            <div className="space-y-3">
              {[
                { label: 'SIM card inserted (or eSIM activated)', hint: 'Check SIM slot for proper seating' },
                { label: 'Active data plan confirmed', hint: 'Verify with carrier if unsure' },
                { label: 'APN settings configured', hint: 'Contact carrier for correct APN values' },
                { label: 'Signal strength adequate', hint: 'Move to area with better coverage if weak' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </div>
              ))}
            </div>
            {device.fonu_sim_id && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Powered by Fonu</p>
                <p className="text-sm font-mono">{device.fonu_sim_id}</p>
              </div>
            )}
          </div>
        );

      case 2: // Server Settings
        const protocol = catalogEntry?.protocol_type || device.protocol || 'http';
        const port = catalogEntry?.default_port || (protocol === 'mqtt' ? 1883 : protocol === 'tcp' ? 5001 : 443);
        
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure the device to send data to FleetPro's ingestion server:
            </p>
            
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Protocol</p>
                    <Badge variant="outline" className="uppercase mt-1">{protocol}</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Server Address</p>
                      <p className="font-mono text-sm">{INGEST_SERVER}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(INGEST_SERVER, 'Server address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Port</p>
                      <p className="font-mono text-sm">{port}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(String(port), 'Port')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {protocol === 'http' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Endpoint URL</p>
                        <p className="font-mono text-xs break-all">
                          https://{INGEST_SERVER}/api/v1/telemetry/{device.imei}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(
                          `https://${INGEST_SERVER}/api/v1/telemetry/${device.imei}`,
                          'Endpoint URL'
                        )}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Vendor Instructions
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Follow these manufacturer-specific instructions for {device.manufacturer} {device.model}:
            </p>
            
            {catalogEntry?.config_instructions ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div 
                  className="p-4 rounded-lg border bg-muted/30"
                  dangerouslySetInnerHTML={{ 
                    __html: catalogEntry.config_instructions
                      .replace(/\n/g, '<br/>')
                      .replace(/#{3}\s(.+)/g, '<h3>$1</h3>')
                      .replace(/#{2}\s(.+)/g, '<h2>$1</h2>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  }} 
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No specific instructions available for this model.</p>
                <p className="text-sm mt-2">
                  Refer to the manufacturer's documentation for configuration steps.
                </p>
              </div>
            )}
          </div>
        );

      case 4: // Mark Configured
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm that the device has been configured with the correct server settings 
              and is ready to send telemetry data.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Configuration Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the configuration..."
                  className="mt-1"
                />
              </div>
            </div>
            
            {canConfigure && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleMarkConfigured}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Marking as Configured...' : 'Mark as Configured'}
              </Button>
            )}
          </div>
        );

      case 5: // Verify Signal
        const isVerified = device.lifecycle_status === 'verified_online' || device.lifecycle_status === 'assignable';
        
        return (
          <div className="space-y-4">
            {isVerified ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-success">Device Verified!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  First telemetry received successfully. Device is ready for assignment.
                </p>
                <Button className="mt-6" onClick={onComplete}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Radio className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Waiting for Signal...</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  The device should start sending telemetry within a few minutes.
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  If no signal is received within 10 minutes, check the Troubleshooting guide.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">Device Setup Wizard</span>
              <span className="text-sm font-normal text-muted-foreground">
                {device.manufacturer} {device.model} • {device.imei}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Step-by-step device configuration wizard
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="grid grid-cols-6 gap-1 px-1 py-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex flex-col items-center gap-1.5 text-center px-1 ${
                index === currentStep
                  ? 'text-primary'
                  : index < currentStep
                    ? 'text-success'
                    : 'text-muted-foreground'
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                index === currentStep
                  ? 'border-primary bg-primary/10'
                  : index < currentStep
                    ? 'border-success bg-success/10'
                    : 'border-muted'
              }`}>
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-[10px] sm:text-xs leading-tight font-medium">
                {step.title}
              </span>
            </button>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="py-4 min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onComplete}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



