import {
  Check,
  Download,
  Upload,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";

type SignatureMode = "draw" | "upload";
const CLAUSES = [
  {
    heading: "1. Definitions",
    body: "\"Services\" means the Fleet Pro telematics platform, licences, hardware devices, IoT SIM connectivity, installation, and any related support supplied to the Customer. \"Loss\" means any liability, claim, demand, penalty, fine, cost, or expense of any kind.",
  },
  {
    heading: "2. Indemnity",
    body: "The Customer shall indemnify, defend, and hold harmless the Service Provider, its affiliates, directors, employees, contractors, and agents from and against any and all Loss arising out of or connected with: (a) the Customer's use or misuse of the Services; (b) any act or omission of the Customer's drivers, employees, or agents; (c) damage to, loss of, tampering with, or unauthorised removal of devices or IoT SIMs installed in the Customer's vehicles; (d) any breach by the Customer of this Agreement or of applicable law.",
  },
  {
    heading: "3. Vehicles, Devices and Installation",
    body: "The Customer confirms that it owns or is lawfully entitled to operate each vehicle submitted for installation and that it has obtained all consents required to fit tracking devices and to process the resulting location and driver data. The Customer accepts responsibility for any damage to a vehicle that arises from pre-existing faults, unauthorised modification, or interference with installed equipment after handover.",
  },
  {
    heading: "4. Data Protection",
    body: "The Customer shall comply with the Nigeria Data Protection Act and all applicable regulations in relation to personal data captured through the Services, including notifying drivers of tracking, and shall indemnify the Service Provider against any claim by a data subject or regulator arising from the Customer's failure to do so.",
  },
  {
    heading: "5. Limitation of Liability",
    body: "The Service Provider shall not be liable for indirect or consequential loss, loss of profit, loss of cargo, or business interruption arising from service unavailability, network outages, device failure, or inaccurate telemetry. Nothing in this Agreement excludes liability that cannot lawfully be excluded.",
  },
  {
    heading: "6. Payment and Suspension",
    body: "The Customer remains responsible for all charges for hardware, licences, installation, connectivity, and subscription services. The Service Provider may suspend the Services where invoices remain unpaid, and the Customer indemnifies the Service Provider against any Loss resulting from such suspension.",
  },
  {
    heading: "7. Term and Survival",
    body: "This Agreement takes effect on the date of signature and continues for as long as the Customer uses the Services. The indemnities in this Agreement survive termination.",
  },
  {
    heading: "8. Governing Law",
    body: "This Agreement is governed by the laws of the Federal Republic of Nigeria, and the parties submit to the exclusive jurisdiction of the Nigerian courts.",
  },
];

type IndemnityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the legal-name field when re-opening an already signed form. */
  initialName?: string;
  onSigned: (result: {
    mode: SignatureMode; name: string; image: string | null;
  }) => void;
};

/**
 * The indemnity agreement, shown full-screen with an electronic signature.
 *
 * The signature pad is a plain `<canvas>` — the design app rolls its own rather
 * than pulling in a signature library, and so do we.
 */
export function IndemnityDialog({
  open,
  onOpenChange,
  initialName,
  onSigned,
}: IndemnityDialogProps) {
  const [
    signatureMode,
    setSignatureMode,
  ] = useState<SignatureMode>("draw");
  const [
    typedSignature,
    setTypedSignature,
  ] = useState(initialName ?? "");
  const [
    hasDrawn,
    setHasDrawn,
  ] = useState(false);
  const [
    uploadedSignature,
    setUploadedSignature,
  ] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas)
      return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const point = pointFrom(event);
    if (!canvas || !point)
      return;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context)
      return;
    context.strokeStyle = "#171717";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(
      point.x,
      point.y,
    );
    drawingRef.current = true;
  }

  function moveDraw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current)
      return;
    const canvas = canvasRef.current;
    const point = pointFrom(event);
    if (!canvas || !point)
      return;
    const context = canvas.getContext("2d");
    if (!context)
      return;
    context.lineTo(
      point.x,
      point.y,
    );
    context.stroke();
    setHasDrawn(true);
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setHasDrawn(false);
  }

  function handleUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => setUploadedSignature(String(reader.result));
    reader.readAsDataURL(file);
  }

  function confirmSignature() {
    if (!typedSignature.trim()) {
      toast.error("Enter your full legal name to sign the form.");
      return;
    }

    const image = signatureMode === "draw"
      ? (hasDrawn ? (canvasRef.current?.toDataURL("image/png") ?? null) : null)
      : uploadedSignature;

    onSigned({
      mode: signatureMode,
      name: typedSignature.trim(),
      image,
    });
    toast.success("Indemnity form signed successfully.");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="h-screen w-screen max-w-none grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-none p-0 sm:rounded-none">
        <DialogHeader className="flex-row items-start justify-between gap-4 space-y-0 border-b border-border px-6 py-5 pr-16">
          <div>
            <DialogTitle>Fleet Pro Indemnity Form</DialogTitle>
            <DialogDescription>
              Read the complete document, then sign electronically below.
            </DialogDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <a
              href="/documents/fleet-pro-indemnity-form-sample.pdf"
              download
            >
              <Download className="mr-2 h-4 w-4" />
              Download Form
            </a>
          </Button>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto bg-muted p-4 sm:p-8">
          <article className="mx-auto max-w-3xl bg-card p-6 shadow-sm sm:p-12">
            <div className="border-b border-border pb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Fleet Pro</p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">Indemnity Agreement</h3>
              <p className="mt-2 text-xs font-semibold uppercase text-destructive">
                Temporary sample — not legal advice
              </p>
            </div>

            <div className="space-y-6 py-8 text-sm leading-7 text-muted-foreground">
              <p>
                This Indemnity Agreement (the "Agreement") is entered into between Fleet Pro,
                operating in partnership with MTN Nigeria (the "Service Provider"), and the customer
                identified in the account creation application (the "Customer"). By signing this
                Agreement, the Customer agrees to assume responsibility for certain risks, losses,
                damages, costs, and claims that may arise from the supply, installation, activation,
                and use of Fleet Pro devices, connectivity, and platform services.
              </p>

              {CLAUSES.map(clause => (
                <div key={clause.heading}>
                  <h4 className="font-semibold text-foreground">{clause.heading}</h4>
                  <p className="mt-2">{clause.body}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-5 text-center text-xs font-semibold uppercase text-muted-foreground">
              Temporary sample — replace with the approved Fleet Pro indemnity form
            </div>
          </article>
        </div>

        <div className="border-t border-border bg-card px-6 py-3">
          <div className="mx-auto max-w-3xl space-y-3">
            <p className="text-sm text-foreground">
              By signing below, I confirm that I have read and understood the Fleet Pro Indemnity
              terms and agreements.
            </p>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Full Legal Name
                <span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                value={typedSignature}
                placeholder="Enter your full legal name"
                onChange={event => setTypedSignature(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  Signature
                </Label>
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  {([
                    "draw",
                    "upload",
                  ] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSignatureMode(mode)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition",
                        signatureMode === mode
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {mode === "draw" ? "Draw signature" : "Upload signature"}
                    </button>
                  ))}
                </div>
              </div>

              {signatureMode === "draw"
                ? (
                    <>
                      <canvas
                        ref={canvasRef}
                        width={900}
                        height={120}
                        aria-label="Draw your signature"
                        className="h-20 w-full touch-none rounded-xl border border-border bg-background"
                        onPointerDown={startDraw}
                        onPointerMove={moveDraw}
                        onPointerUp={endDraw}
                        onPointerLeave={endDraw}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Draw your signature in the box above.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSignature}
                        >
                          Clear signature
                        </Button>
                      </div>
                    </>
                  )
                : (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file)
                            handleUpload(file);
                          event.target.value = "";
                        }}
                      />
                      {uploadedSignature
                        ? (
                            <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                              <img
                                src={uploadedSignature}
                                alt="Uploaded signature"
                                className="h-16 object-contain"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileRef.current?.click()}
                              >
                                Replace
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedSignature(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          )
                        : (
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-background text-xs text-muted-foreground hover:border-primary"
                            >
                              <Upload className="h-4 w-4" />
                              Upload an image of your signature (PNG or JPG)
                            </button>
                          )}
                    </>
                  )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSignature}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Signature
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
