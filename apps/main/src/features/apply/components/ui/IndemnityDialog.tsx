import { useQuery } from "@tanstack/react-query";
import { getOnboardingIndemnityAgreementQueryOptions } from "@truckmoov/api/auth";
import {
  Check,

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

/** The server takes PNG or JPG, at most 2MB. */
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

type IndemnityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the legal-name field when re-opening an already signed form. */
  initialName?: string;
  /** Shown above the pad, e.g. after the agreement was superseded mid-signing. */
  notice?: string | null;
  onSigned: (result: {
    method: "drawn" | "uploaded"; name: string; image: string; version: string;
  }) => void;
};

/**
 * The indemnity agreement, shown full-screen with an electronic signature.
 *
 * The wording and its `version` come from the server — the signature is recorded
 * against the version that was on screen (TRU-FE-11). The signature pad is a plain
 * `<canvas>`; the design app rolls its own rather than pulling in a library.
 */
export function IndemnityDialog({
  open,
  onOpenChange,
  initialName,
  notice,
  onSigned,
}: IndemnityDialogProps) {
  const agreementQuery = useQuery({
    ...getOnboardingIndemnityAgreementQueryOptions(),
    enabled: open,
  });
  const agreement = agreementQuery.data?.data;
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
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast.error("Signature must be a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_SIGNATURE_BYTES) {
      toast.error("Signature image must be 2 MB or smaller.");
      return;
    }
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
    if (!image) {
      toast.error(signatureMode === "draw" ? "Draw your signature in the box." : "Upload an image of your signature.");
      return;
    }
    if (!agreement) {
      toast.error("The agreement hasn't loaded yet. Try again in a moment.");
      return;
    }

    onSigned({
      method: signatureMode === "draw" ? "drawn" : "uploaded",
      name: typedSignature.trim(),
      image,
      version: agreement.version,
    });
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
            <DialogTitle>{agreement?.title ?? "Fleet Pro Indemnity Form"}</DialogTitle>
            <DialogDescription>
              Read the complete document, then sign electronically below.
            </DialogDescription>
          </div>
          {agreement && (
            <span className="shrink-0 text-xs text-muted-foreground">{`Version ${agreement.version}`}</span>
          )}
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto bg-muted p-4 sm:p-8">
          <article className="mx-auto max-w-3xl bg-card p-6 shadow-sm sm:p-12">
            <div className="border-b border-border pb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Fleet Pro</p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{agreement?.title ?? "Indemnity Agreement"}</h3>
            </div>

            <div className="py-8 text-sm leading-7 text-muted-foreground">
              {agreementQuery.isLoading && <p className="text-center">Loading the agreement…</p>}
              {agreementQuery.isError && (
                <p className="text-center text-destructive">
                  The agreement couldn't be loaded.
                  {" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => agreementQuery.refetch()}
                  >
                    Try again
                  </button>
                </p>
              )}
              {agreement && <p className="whitespace-pre-line">{agreement.body}</p>}
            </div>
          </article>
        </div>

        <div className="border-t border-border bg-card px-6 py-3">
          <div className="mx-auto max-w-3xl space-y-3">
            {notice && <p className="text-sm text-destructive">{notice}</p>}
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
                        accept="image/png,image/jpeg"
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
                disabled={!agreement}
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
