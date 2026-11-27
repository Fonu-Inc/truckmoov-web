import type { TestTelemetryResult } from "@truckmoov/api/auth";
import { useSendTestTelemetry } from "@truckmoov/api/auth";
import {
  CheckCircle2, ChevronDown, Info,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  IMEI_PATTERN, parseCoordinate,
} from "./testTelemetry";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Sends one test location report so a device waiting for verification can complete it. */
export function SendTestTelemetryDialog({
  open,
  onOpenChange,
}: Props) {
  const sendTelemetry = useSendTestTelemetry();
  const [
    imei,
    setImei,
  ] = useState("");
  const [
    latitude,
    setLatitude,
  ] = useState("");
  const [
    longitude,
    setLongitude,
  ] = useState("");
  const [
    error,
    setError,
  ] = useState("");
  const [
    result,
    setResult,
  ] = useState<TestTelemetryResult | null>(null);

  const reset = () => {
    setImei("");
    setLatitude("");
    setLongitude("");
    setError("");
    setResult(null);
  };

  const submit = () => {
    const cleanImei = imei.trim();
    if (!IMEI_PATTERN.test(cleanImei)) {
      setError("IMEI must be exactly 15 digits.");
      return;
    }
    const lat = parseCoordinate(
      latitude,
      90,
    );
    const lng = parseCoordinate(
      longitude,
      180,
    );
    if (!lat.valid || !lng.valid) {
      setError("Latitude must be between -90 and 90, and longitude between -180 and 180.");
      return;
    }
    setError("");
    sendTelemetry.mutate(
      {
        imei: cleanImei,
        latitude: lat.value,
        longitude: lng.value,
      },
      {
        onSuccess: res => setResult(res.data),
        onError: err => setError(err.message),
      },
    );
  };

  const close = (value: boolean) => {
    if (sendTelemetry.isPending)
      return;
    if (!value)
      reset();
    onOpenChange(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Test Telemetry</DialogTitle>
          <DialogDescription>
            Sends one test location report for a device, as if the tracker had reported in. Use it on test environments to finish device verification.
          </DialogDescription>
        </DialogHeader>

        {result
          ? (
              <div
                role="status"
                className="space-y-3"
              >
                <div className={`flex items-center gap-2 ${result.verificationStatusAfter === "verified" ? "text-success" : "text-muted-foreground"}`}>
                  {result.verificationStatusAfter === "verified"
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <Info className="h-5 w-5" />}
                  <p className="font-medium">
                    {result.verificationStatusAfter === "verified" ? "Device verified" : "Test telemetry sent"}
                  </p>
                </div>
                <p className="text-sm">{result.note}</p>
                <p className="text-xs text-muted-foreground">
                  {`Verification: ${result.verificationStatusBefore ?? "unknown"} → ${result.verificationStatusAfter ?? "unknown"}`}
                  {result.lifecycleStatusAfter ? ` · Device status: ${result.lifecycleStatusAfter}` : ""}
                </p>
              </div>
            )
          : (
              <form
                id="send-test-telemetry-form"
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <div className="space-y-1.5">
                  <Label
                    htmlFor="test-telemetry-imei"
                    required
                  >
                    IMEI
                  </Label>
                  <Input
                    id="test-telemetry-imei"
                    inputMode="numeric"
                    placeholder="15 digits"
                    className="font-mono"
                    value={imei}
                    disabled={sendTelemetry.isPending}
                    onChange={e => setImei(e.target.value.replace(
                      /\D/g,
                      "",
                    ).slice(
                      0,
                      15,
                    ))}
                  />
                </div>

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                    >
                      Advanced
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="test-telemetry-lat">Latitude (optional)</Label>
                      <Input
                        id="test-telemetry-lat"
                        inputMode="decimal"
                        placeholder="6.5244"
                        value={latitude}
                        disabled={sendTelemetry.isPending}
                        onChange={e => setLatitude(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="test-telemetry-lng">Longitude (optional)</Label>
                      <Input
                        id="test-telemetry-lng"
                        inputMode="decimal"
                        placeholder="3.3792"
                        value={longitude}
                        disabled={sendTelemetry.isPending}
                        onChange={e => setLongitude(e.target.value)}
                      />
                    </div>
                    <p className="col-span-2 text-xs text-muted-foreground">Leave blank to report from Lagos.</p>
                  </CollapsibleContent>
                </Collapsible>

                {error && (
                  <p
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </form>
            )}

        <DialogFooter>
          {result
            ? (
                <>
                  <Button
                    variant="outline"
                    onClick={reset}
                  >
                    Send another
                  </Button>
                  <Button onClick={() => close(false)}>Done</Button>
                </>
              )
            : (
                <>
                  <Button
                    variant="outline"
                    disabled={sendTelemetry.isPending}
                    onClick={() => close(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="send-test-telemetry-form"
                    variant="gradient"
                    loading={sendTelemetry.isPending}
                  >
                    Send test telemetry
                  </Button>
                </>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
