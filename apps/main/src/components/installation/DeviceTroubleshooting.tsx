import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle,
  Copy,
  Cpu,
  ExternalLink,
  RotateCcw,
  Server,
  Wifi,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeviceLifecycleBadge } from "@/components/devices/DeviceLifecycleBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shadcn/accordion";
import {
  Alert, AlertDescription, AlertTitle,
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
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

type ConfigQueueDevice = any;
type DeviceLifecycleStatus = string;

type DeviceTroubleshootingProps = {
  devices: ConfigQueueDevice[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  onReset?: (deviceId: string, reason: string) => Promise<{ success: boolean }>;
};

const COMMON_ISSUES = [
  {
    id: "wrong-endpoint",
    title: "Wrong Endpoint / Server Address",
    symptoms: [
      "No data received",
      "Connection timeout",
    ],
    solution: "Verify the device is configured to send data to ingest.fleetpro.com",
    action: "copy-endpoint",
  },
  {
    id: "wrong-port",
    title: "Incorrect Port Configuration",
    symptoms: [
      "Connection refused",
      "No data received",
    ],
    solution: "Ensure the port matches the protocol: HTTP (443), TCP (5001), MQTT (1883)",
    action: "copy-port",
  },
  {
    id: "wrong-protocol",
    title: "Protocol Mismatch",
    symptoms: [
      "Garbled data",
      "Parse errors",
    ],
    solution: "Check that the device protocol matches the catalog specification",
    action: null,
  },
  {
    id: "apn-config",
    title: "APN Misconfigured",
    symptoms: [
      "No network connection",
      "SIM errors",
    ],
    solution: "Contact the carrier for correct APN settings. Common formats: internet, web.gprs, data",
    action: null,
  },
  {
    id: "no-data-plan",
    title: "No Active Data Plan",
    symptoms: [
      "SIM registered but no data",
      "Connection drops",
    ],
    solution: "Verify with the carrier that the SIM has an active data plan",
    action: null,
  },
  {
    id: "sim-seating",
    title: "Poor SIM Card Seating",
    symptoms: [
      "Intermittent connection",
      "SIM not detected",
    ],
    solution: "Remove and re-insert the SIM card, ensure proper contact",
    action: null,
  },
  {
    id: "poor-signal",
    title: "Poor Cellular Signal",
    symptoms: [
      "Intermittent data",
      "High latency",
    ],
    solution: "Move device to area with better coverage, consider external antenna",
    action: null,
  },
  {
    id: "imei-mismatch",
    title: "IMEI Mismatch",
    symptoms: [
      "Data rejected",
      "Authentication failed",
    ],
    solution: "Verify the registered IMEI matches the physical device IMEI",
    action: "copy-imei",
  },
];

export function DeviceTroubleshooting({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onReset,
}: DeviceTroubleshootingProps) {
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const [
    resetConfirmOpen,
    setResetConfirmOpen,
  ] = useState(false);

  const handleReset = async () => {
    setResetConfirmOpen(false);
    if (!selectedDevice || !onReset)
      return;
    await onReset(
      selectedDevice.id,
      "Reset from Troubleshooting interface",
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Device Troubleshooting
        </CardTitle>
        <CardDescription>
          Diagnose and resolve device configuration issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Device</label>
          <Select
            value={selectedDeviceId || ""}
            onValueChange={value => onSelectDevice(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a device to troubleshoot..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem
                  key={device.id}
                  value={device.id}
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {device.manufacturer}
                      {" "}
                      {device.model}
                    </span>
                    <span className="text-muted-foreground">
                      (
                      {device.imei}
                      )
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDevice ? (
          <>
            {/* Device Status Card */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Device</p>
                    <p className="font-medium">
                      {selectedDevice.manufacturer}
                      {" "}
                      {selectedDevice.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <DeviceLifecycleBadge status={selectedDevice.lifecycle_status as DeviceLifecycleStatus} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="text-sm">
                      {selectedDevice.last_seen
                        ? formatRelative(selectedDevice.last_seen)
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Configured</p>
                    <p className="text-sm">
                      {(selectedDevice as any).configured_at
                        ? formatRelative((selectedDevice as any).configured_at)
                        : "Not yet"}
                    </p>
                  </div>
                </div>

                {/* Error State */}
                {(selectedDevice as any).verification_error_code && (
                  <Alert
                    variant="destructive"
                    className="mt-4"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verification Error</AlertTitle>
                    <AlertDescription>
                      <p>
                        <strong>Code:</strong>
                        {" "}
                        {(selectedDevice as any).verification_error_code}
                      </p>
                      <p>{(selectedDevice as any).verification_error_message}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Diagnostics Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Expected Endpoint</span>
                </div>
                <code className="text-xs break-all">ingest.fleetpro.com</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => handleCopy(
                    "ingest.fleetpro.com",
                    "Endpoint",
                  )}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Protocol / Port</span>
                </div>
                <code className="text-xs">
                  {selectedDevice.protocol?.toUpperCase() || "HTTP"}
                  {" "}
                  /
                  {selectedDevice.protocol === "mqtt" ? " 1883" : selectedDevice.protocol === "tcp" ? " 5001" : " 443"}
                </code>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Device IMEI</span>
                </div>
                <code className="text-xs">{selectedDevice.imei}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => handleCopy(
                    selectedDevice.imei,
                    "IMEI",
                  )}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Common Issues */}
            <div>
              <h3 className="font-medium mb-3">Common Issues & Solutions</h3>
              <Accordion
                type="single"
                collapsible
                className="space-y-2"
              >
                {COMMON_ISSUES.map(issue => (
                  <AccordionItem
                    key={issue.id}
                    value={issue.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span>{issue.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Symptoms:</p>
                          <ul className="list-disc list-inside text-sm">
                            {issue.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Solution:</p>
                          <p className="text-sm">{issue.solution}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => handleCopy(
                  `https://ingest.fleetpro.com/api/v1/telemetry/${selectedDevice.imei}`,
                  "Full endpoint URL",
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Re-send Setup Details
              </Button>

              {onReset && (
                <Button
                  variant="outline"
                  className="text-warning border-warning hover:bg-warning/10"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Config Pending
                </Button>
              )}

              <AlertDialog
                open={resetConfirmOpen}
                onOpenChange={setResetConfirmOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset device to Config Pending?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is audited. The device will need to be configured again before it can come online.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Reset device</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Support Ticket
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a device to view troubleshooting options</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
