import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Cpu,
  Smartphone,
  Plus,
  Upload,
  Send,
  Check,
  Truck,
  Settings as SettingsIcon,
  AlertTriangle,
  ArrowRight,
  Info,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Input } from "@/components/shadcn/input";
import { Switch } from "@/components/shadcn/switch";
import { Badge } from "@/components/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Progress } from "@/components/shadcn/progress";
import { cn } from "@/lib/utils";

import { DeviceFormDialog } from "@/components/devices/DeviceFormDialog";
import { SIMFormDialog } from "@/components/sims/SIMFormDialog";
import { DeviceSetupRequestDialogMinimal } from "@/components/devices/DeviceSetupRequestDialogMinimal";
import { SIMRequestFormDialogMinimal } from "@/components/sims/SIMRequestFormDialogMinimal";
import { useDeviceSetupRequests } from "@/hooks/useDeviceSetupRequests";
import { useSIMRequestSubmit } from "@/hooks/useSIMRequestSubmit";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore, readDemoStakeholder } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve dashboard route based on stakeholder/role (mirrors WelcomeDashboard).
 */
async function resolvePostActivationRoute(
  userId: string | undefined,
  legacyRole: string | undefined,
): Promise<string> {
  if (legacyRole === "platform_admin") return "/platform";
  const demoStakeholder = readDemoStakeholder();
  if (demoStakeholder === "ENTERPRISE") return "/enterprise";
  if (demoStakeholder === "AGGREGATOR") return "/aggregator";
  if (demoStakeholder === "OWNER_OPERATOR") return "/owner-operator";
  if (userId) {
    try {
      const { data: memberships } = await supabase
        .from("user_org_memberships")
        .select("organizations!user_org_memberships_org_id_fkey(organization_type)")
        .eq("user_id", userId)
        .eq("membership_status", "active");
      if (memberships && memberships.length > 0) {
        const orgTypes = memberships.map((m: { organizations?: { organization_type?: string } }) => m.organizations?.organization_type);
        if (orgTypes.includes("ENTERPRISE")) return "/enterprise";
        if (orgTypes.includes("AGGREGATOR")) return "/aggregator";
        if (orgTypes.includes("OWNER_OPERATOR")) return "/owner-operator";
      }
    } catch (err) {
      console.warn("Failed to resolve dashboard route:", err);
    }
  }
  switch (legacyRole) {
    case "supervisor":
    case "dispatcher": return "/supervisor";
    case "viewer_finance": return "/admin/fleet?tab=analytics";
    case "installer": return "/admin/installation";
    case "driver": return "/driver";
    default: return "/admin";
  }
}

/**
 * Onboarding Step 3 — "Activate Your System"
 *
 * Reuses the same patterns as the platform New Tenant Onboarding wizard
 * (Device Provisioning, SIM Assignment, Features) so the experience is
 * consistent across the platform.
 *
 * Three pathways for both Devices and SIMs:
 *   1. Add individually        → opens reused form dialog
 *   2. Bulk import (drag/drop) → CSV upload zone with validation
 *   3. Request from Platform   → toggle + counts/options for downstream provisioning
 *
 * Plan-based caps are surfaced up-front so users do not upload 500 devices
 * only to be rejected after the fact.
 */

// --- Plan-based caps -------------------------------------------------------
// In a real backend this would come from the tenant's subscription record.
// We map the marketing plan id (stored in onboardingStore by the Subscription
// step) to a sensible default cap so this UI behaves correctly even before
// the server-side limits are wired up.
const PLAN_CAPS: Record<string, { devices: number; sims: number; label: string }> = {
  "prepaid-starter":     { devices: 25,  sims: 25,  label: "Starter" },
  "prepaid-professional":{ devices: 100, sims: 100, label: "Professional" },
  "prepaid-enterprise":  { devices: 1000,sims: 1000,label: "Enterprise" },
  "postpaid-business":   { devices: 50,  sims: 50,  label: "Business" },
  "postpaid-corporate":  { devices: 200, sims: 200, label: "Corporate" },
  "postpaid-enterprise": { devices: 1000,sims: 1000,label: "Enterprise" },
};
const DEFAULT_CAP = { devices: 25, sims: 25, label: "Trial" };

// --- Dropzone --------------------------------------------------------------
interface DropZoneProps {
  accept: string;
  helperText: string;
  files: { name: string; size: number; rows: number; valid: number; invalid: number }[];
  onFiles: (files: FileList) => void;
}
function DropZone({ accept, helperText, files, onFiles }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/60"
        )}
      >
        <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={(e) => e.target.files && onFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="font-medium">{f.name}</span>
                <span className="text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {f.valid} valid
                </Badge>
                {f.invalid > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {f.invalid} errors
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---------------------------------------------------------------
function parseCsvCount(text: string): { rows: number; valid: number; invalid: number } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dataLines = lines.length > 1 ? lines.slice(1) : []; // skip header if present
  let valid = 0;
  let invalid = 0;
  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim());
    // Loose validation: at least 2 non-empty columns
    if (cells.filter(Boolean).length >= 2) valid += 1;
    else invalid += 1;
  }
  return { rows: dataLines.length, valid, invalid };
}

// =========================================================================
//  PAGE
// =========================================================================
export default function ActivationOnboarding() {
  const navigate = useNavigate();
  const { selectedPlan, completeOnboarding } = useOnboardingStore();
  const { user } = useAuthStore();
  const { createRequest } = useDeviceSetupRequests();
  const { submitRequest: submitSimRequest } = useSIMRequestSubmit();

  const caps = useMemo(() => {
    if (selectedPlan && PLAN_CAPS[selectedPlan]) return PLAN_CAPS[selectedPlan];
    return DEFAULT_CAP;
  }, [selectedPlan]);

  // --- Devices state -------------------------------------------------------
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceRequestDialogOpen, setDeviceRequestDialogOpen] = useState(false);
  const [addedDevices, setAddedDevices] = useState<{ imei: string; manufacturer: string; model: string }[]>([]);
  const [deviceFiles, setDeviceFiles] = useState<DropZoneProps["files"]>([]);
  const [deviceRequests, setDeviceRequests] = useState<
    { manufacturer: string; model?: string; quantity: number }[]
  >([{ manufacturer: "Teltonika", model: "FMC130", quantity: 10 }]);

  // --- SIMs state ----------------------------------------------------------
  const [simDialogOpen, setSimDialogOpen] = useState(false);
  const [simRequestDialogOpen, setSimRequestDialogOpen] = useState(false);
  const [addedSims, setAddedSims] = useState<{ iccid: string; mobileNumber: string; networkOperator: string }[]>([]);
  const [simFiles, setSimFiles] = useState<DropZoneProps["files"]>([]);
  const [simRequests, setSimRequests] = useState<
    { carrier: string; quantity: number }[]
  >([{ carrier: "MTN", quantity: 10 }]);

  // --- Features state (defaults mirror the wizard) -------------------------
  const [features, setFeatures] = useState({
    liveTracking: true,
    geofencing: false,
    routeOptimization: false,
    messaging: true,
    analytics: false,
    apiAccess: false,
  });

  // --- Counters / cap enforcement ------------------------------------------
  const deviceRequestedQty = useMemo(
    () => deviceRequests.reduce((acc, r) => acc + r.quantity, 0),
    [deviceRequests],
  );
  const simRequestedQty = useMemo(
    () => simRequests.reduce((acc, r) => acc + r.quantity, 0),
    [simRequests],
  );

  const totalDevices = useMemo(() => {
    const fromUploads = deviceFiles.reduce((acc, f) => acc + f.valid, 0);
    return addedDevices.length + fromUploads + deviceRequestedQty;
  }, [addedDevices, deviceFiles, deviceRequestedQty]);

  const totalSims = useMemo(() => {
    const fromUploads = simFiles.reduce((acc, f) => acc + f.valid, 0);
    return addedSims.length + fromUploads + simRequestedQty;
  }, [addedSims, simFiles, simRequestedQty]);

  const deviceOver = totalDevices > caps.devices;
  const simOver = totalSims > caps.sims;

  // --- Handlers ------------------------------------------------------------
  const handleAddDevice = (data: any) => {
    if (totalDevices + 1 > caps.devices) {
      toast.error(`Your ${caps.label} plan allows ${caps.devices} devices. Upgrade to add more.`);
      return;
    }
    setAddedDevices((prev) => [...prev, { imei: data.imei, manufacturer: data.manufacturer, model: data.model }]);
    setDeviceDialogOpen(false);
    toast.success(`Device ${data.imei} added`);
  };

  const handleAddSim = (data: any) => {
    if (totalSims + 1 > caps.sims) {
      toast.error(`Your ${caps.label} plan allows ${caps.sims} SIMs. Upgrade to add more.`);
      return;
    }
    setAddedSims((prev) => [
      ...prev,
      { iccid: data.iccid, mobileNumber: data.mobileNumber, networkOperator: data.networkOperator },
    ]);
    setSimDialogOpen(false);
    toast.success(`SIM ${data.iccid} added`);
  };

  const handleDeviceFiles = async (list: FileList) => {
    const next: DropZoneProps["files"] = [...deviceFiles];
    for (const file of Array.from(list)) {
      if (!file.name.endsWith(".csv")) {
        toast.error(`${file.name}: only CSV is supported`);
        continue;
      }
      const text = await file.text();
      const counts = parseCsvCount(text);
      next.push({ name: file.name, size: file.size, ...counts });
    }
    setDeviceFiles(next);
    toast.success("File parsed — review row counts before continuing");
  };

  const handleSimFiles = async (list: FileList) => {
    const next: DropZoneProps["files"] = [...simFiles];
    for (const file of Array.from(list)) {
      if (!file.name.endsWith(".csv")) {
        toast.error(`${file.name}: only CSV is supported`);
        continue;
      }
      const text = await file.text();
      const counts = parseCsvCount(text);
      next.push({ name: file.name, size: file.size, ...counts });
    }
    setSimFiles(next);
    toast.success("File parsed — review row counts before continuing");
  };

  const goToQuickAccess = () => {
    navigate("/onboarding/quick-access");
  };

  const handleSkip = () => {
    toast.info("Activation skipped — you can configure devices, SIMs and features later from Settings.");
    goToQuickAccess();
  };

  const handleContinue = () => {
    if (deviceOver || simOver) {
      toast.error("Reduce your selection to fit within your plan limits before continuing.");
      return;
    }
    toast.success("System activated — almost there.");
    goToQuickAccess();
  };

  // --- Render --------------------------------------------------------------
  return (
    <OnboardingLayout
      step={3}
      wide
      title="Let's activate your system"
      subtitle="Add the devices, SIMs and features you need to start operating. You can do this now or come back to it from Settings — your choice."
    >
      <div className="space-y-6">
        {/* Plan cap banner */}
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium">{caps.label} plan limits</p>
              <p className="text-xs text-muted-foreground">
                Up to <span className="font-semibold text-foreground">{caps.devices}</span> devices and{" "}
                <span className="font-semibold text-foreground">{caps.sims}</span> SIMs included.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Plan: {caps.label}
          </Badge>
        </div>

        {/* ===================== DEVICES ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>IoT Devices</CardTitle>
                  <CardDescription>Add your trackers, request new ones, or both.</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Selected</p>
                <p className={cn("text-sm font-semibold", deviceOver && "text-destructive")}>
                  {totalDevices} / {caps.devices}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(100, (totalDevices / caps.devices) * 100)}
              className={cn("mt-3 h-1.5", deviceOver && "[&>div]:bg-destructive")}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceOver && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                You're over your plan cap. Reduce by {totalDevices - caps.devices} or upgrade your plan.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {/* 1. Individual */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Already have devices?</p>
                <p className="mt-1 text-sm font-medium">Add one device</p>
                <p className="mt-1 text-xs text-muted-foreground">Enter IMEI, manufacturer, model and firmware.</p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={() => setDeviceDialogOpen(true)}
                  disabled={totalDevices >= caps.devices}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Device
                </Button>
                {addedDevices.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {addedDevices.length} device{addedDevices.length === 1 ? "" : "s"} added
                  </p>
                )}
              </div>

              {/* 2. Bulk */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bulk import</p>
                <p className="mt-1 text-sm font-medium">Upload CSV</p>
                <p className="mt-1 text-xs text-muted-foreground">Drag & drop a CSV with IMEI, manufacturer, model.</p>
                <div className="mt-3">
                  <DropZone
                    accept=".csv"
                    helperText="CSV — max 500 rows per file"
                    files={deviceFiles}
                    onFiles={handleDeviceFiles}
                  />
                </div>
              </div>

              {/* 3. Request */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Need devices?</p>
                <p className="mt-1 text-sm font-medium">Request from Platform</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a provisioning request. Our team will configure and ship trackers based on your use case.
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={() => setDeviceRequestDialogOpen(true)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Request Devices
                </Button>
                {deviceRequests.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      {deviceRequests.length} request{deviceRequests.length === 1 ? "" : "s"} submitted ({deviceRequestedQty} device{deviceRequestedQty === 1 ? "" : "s"})
                    </p>
                    {deviceRequests.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-border/60 bg-secondary/30 px-2 py-1 text-[11px]"
                      >
                        <span className="truncate">
                          <span className="font-medium text-foreground">{r.manufacturer}</span>
                          {r.model ? <span className="text-muted-foreground"> · {r.model}</span> : null}
                        </span>
                        <span className="text-muted-foreground">×{r.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== SIMS ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>IoT SIMs</CardTitle>
                  <CardDescription>Add your SIMs, request new ones, or both.</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Selected</p>
                <p className={cn("text-sm font-semibold", simOver && "text-destructive")}>
                  {totalSims} / {caps.sims}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(100, (totalSims / caps.sims) * 100)}
              className={cn("mt-3 h-1.5", simOver && "[&>div]:bg-destructive")}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {simOver && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                You're over your plan cap. Reduce by {totalSims - caps.sims} or upgrade your plan.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {/* 1. Individual */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Already have SIMs?</p>
                <p className="mt-1 text-sm font-medium">Add one SIM</p>
                <p className="mt-1 text-xs text-muted-foreground">Enter ICCID, IMSI, MSISDN, carrier and use case.</p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={() => setSimDialogOpen(true)}
                  disabled={totalSims >= caps.sims}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add SIM
                </Button>
                {addedSims.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {addedSims.length} SIM{addedSims.length === 1 ? "" : "s"} added
                  </p>
                )}
              </div>

              {/* 2. Bulk */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bulk import</p>
                <p className="mt-1 text-sm font-medium">Upload CSV</p>
                <p className="mt-1 text-xs text-muted-foreground">Drag & drop a CSV with ICCID, MSISDN, carrier.</p>
                <div className="mt-3">
                  <DropZone
                    accept=".csv"
                    helperText="CSV — max 500 rows per file"
                    files={simFiles}
                    onFiles={handleSimFiles}
                  />
                </div>
              </div>

              {/* 3. Request */}
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Need SIMs?</p>
                <p className="mt-1 text-sm font-medium">Request from Platform</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submit a provisioning request. We'll provision MTN MVNO SIMs based on your stated use case.
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={() => setSimRequestDialogOpen(true)}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Request SIMs
                </Button>
                {simRequests.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      {simRequests.length} request{simRequests.length === 1 ? "" : "s"} submitted ({simRequestedQty} SIM{simRequestedQty === 1 ? "" : "s"})
                    </p>
                    {simRequests.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-border/60 bg-secondary/30 px-2 py-1 text-[11px]"
                      >
                        <span className="font-medium text-foreground truncate">{r.carrier}</span>
                        <span className="text-muted-foreground">×{r.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===================== FEATURES ===================== */}
        <Card>
          <CardHeader>
            <CardTitle>Enable Features</CardTitle>
            <CardDescription>
              Available features depend on your subscription plan. Toggle on the ones you want active from day one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "liveTracking", label: "Live Tracking", desc: "Real-time GPS tracking" },
                { key: "geofencing", label: "Geofencing", desc: "Zone alerts & monitoring" },
                { key: "routeOptimization", label: "Route Optimization", desc: "AI-powered route planning" },
                { key: "messaging", label: "Messaging", desc: "WhatsApp & SMS integration" },
                { key: "analytics", label: "Advanced Analytics", desc: "Reports & insights" },
                { key: "apiAccess", label: "API Access", desc: "REST API integration" },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3"
                >
                  <div>
                    <Label className="text-sm">{feature.label}</Label>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={features[feature.key as keyof typeof features]}
                    onCheckedChange={(checked) =>
                      setFeatures((prev) => ({ ...prev, [feature.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ===================== ACTIONS ===================== */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            You can revisit this from Settings → Devices, SIMs and Features at any time.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleContinue} disabled={deviceOver || simOver}>
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Reused dialogs */}
      <DeviceFormDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        onSubmit={handleAddDevice}
        title="Register New Device"
      />
      <SIMFormDialog
        open={simDialogOpen}
        onOpenChange={setSimDialogOpen}
        onSubmit={handleAddSim}
        title="Add New SIM"
      />
      <DeviceSetupRequestDialogMinimal
        open={deviceRequestDialogOpen}
        onOpenChange={setDeviceRequestDialogOpen}
        quotaRemaining={Math.max(0, caps.devices - totalDevices)}
        quotaLabel={caps.label}
        onSubmit={async (data) => {
          const res = await createRequest({
            manufacturer: data.manufacturer,
            model: data.model,
            quantity: data.quantity,
            use_case: data.use_case,
            requester_notes: data.notes,
          });
          if (res) {
            setDeviceRequests((prev) => [
              ...prev,
              { manufacturer: data.manufacturer, model: data.model, quantity: data.quantity },
            ]);
            setDeviceRequestDialogOpen(false);
          }
          return res;
        }}
      />
      <SIMRequestFormDialogMinimal
        open={simRequestDialogOpen}
        onOpenChange={setSimRequestDialogOpen}
        quotaRemaining={Math.max(0, caps.sims - totalSims)}
        quotaLabel={caps.label}
        onSubmit={async (data) => {
          const res = await submitSimRequest({
            numberOfSims: data.numberOfSims,
            dataLimitGb: data.dataLimitGb,
            preferredOperator: data.carrier,
            useCase: data.useCase,
            notes: data.notes,
            deviceMappingEnabled: false,
          });
          if (res) {
            setSimRequests((prev) => [
              ...prev,
              { carrier: data.carrier || "MTN", quantity: data.numberOfSims },
            ]);
            setSimRequestDialogOpen(false);
          }
          return res;
        }}
      />
    </OnboardingLayout>
  );
}
