import type { PointerEvent } from "react";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingIndemnityAgreementQueryOptions } from "@truckmoov/api/auth";
import {
  Check,
  Loader2,
  Upload,
} from "lucide-react";
import {
  useRef,
  useState,
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
import { companyNameMatches } from "@/features/apply/utils/applySchemas";
import { cn } from "@/lib/utils";

type SignatureMode = "draw" | "upload";

/** The server takes PNG or JPG, at most 2MB. */
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

export type SignedIndemnity = {
  method: "drawn" | "uploaded";
  name: string;
  image: Blob;
  version: string;
};

/**
 * The indemnity agreement with an electronic signature, laid out as the design's full-screen
 * form. The wording and its `version` come from the server; the signature is recorded against
 * the version that was on screen.
 */
export function IndemnityDialog({
  open,
  onOpenChange,
  initialName,
  companyName,
  notice,
  onSigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  /** The application's organizationName; the typed name must match it (server enforces the same rule). */
  companyName: string;
  /** Shown above the pad, e.g. after the agreement was superseded mid-signing. */
  notice?: string | null;
  onSigned: (result: SignedIndemnity) => void;
}) {
  const agreementQuery = useQuery({
    ...getOnboardingIndemnityAgreementQueryOptions(),
    enabled: open,
  });
  const agreement = agreementQuery.data?.data;
  const [
    mode,
    setMode,
  ] = useState<SignatureMode>("draw");
  const [
    name,
    setName,
  ] = useState(initialName ?? "");
  const [
    hasDrawn,
    setHasDrawn,
  ] = useState(false);
  const [
    uploaded,
    setUploaded,
  ] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [
    error,
    setError,
  ] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);

  function pointFrom(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas)
      return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const point = pointFrom(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context)
      return;
    canvas.setPointerCapture(event.pointerId);
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

  function moveDraw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current)
      return;
    const point = pointFrom(event);
    const context = canvasRef.current?.getContext("2d");
    if (!point || !context)
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
      setError("Signature must be a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_SIGNATURE_BYTES) {
      setError("Signature image must be 2 MB or smaller.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setUploaded({
      file,
      preview: String(reader.result),
    });
    reader.readAsDataURL(file);
  }

  function drawnImage() {
    return new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        resolve(null);
        return;
      }
      canvas.toBlob(
        resolve,
        "image/png",
      );
    });
  }

  const nameMatches = companyNameMatches(
    name,
    companyName,
  );

  async function confirmSignature() {
    if (!name.trim()) {
      setError("Enter your company name to sign the form.");
      return;
    }
    if (!nameMatches)
      return;
    const image = mode === "draw" ? await drawnImage() : (uploaded?.file ?? null);
    if (!image) {
      setError(mode === "draw" ? "Draw your signature to sign the form." : "Upload an image of your signature to sign the form.");
      return;
    }
    if (!agreement) {
      setError("The agreement hasn't loaded yet. Try again in a moment.");
      return;
    }
    setError(null);
    onSigned({
      method: mode === "draw" ? "drawn" : "uploaded",
      name: name.trim(),
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
        <DialogHeader className="space-y-1.5 border-b border-border px-6 py-5 pr-16">
          <DialogTitle>{agreement?.title ?? "Fleet Pro Indemnity Form"}</DialogTitle>
          <DialogDescription>
            {agreement ? `Version ${agreement.version}. ` : ""}
            Read the complete document, then sign electronically below.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto bg-muted p-4 sm:p-8">
          <article className="mx-auto max-w-3xl bg-card p-6 shadow-sm sm:p-12">
            <div className="border-b border-border pb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Fleet Pro</p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{agreement?.title ?? "Indemnity Agreement"}</h3>
            </div>
            <div className="py-8 text-sm leading-7 text-muted-foreground">
              {agreementQuery.isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {agreementQuery.isError && (
                <p className="text-center text-destructive">
                  The agreement couldn't be loaded.
                  {" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => void agreementQuery.refetch()}
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
            {notice && <p className="text-sm text-warning">{notice}</p>}
            <p className="text-sm text-foreground">
              By signing below, I confirm that I have read and understood the Fleet Pro Indemnity terms and agreements.
            </p>
            <div className="space-y-1.5">
              <Label
                htmlFor="indemnity-signer-name"
                className="text-sm"
                required
              >
                Company Name
              </Label>
              <Input
                id="indemnity-signer-name"
                value={name}
                placeholder="Enter your company name"
                aria-invalid={Boolean(name.trim()) && !nameMatches}
                onChange={event => setName(event.target.value)}
              />
              {name.trim() && !nameMatches && (
                <p className="text-sm text-destructive">{`This must match your company name: ${companyName}`}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label required>
                  Signature
                </Label>
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  {([
                    "draw",
                    "upload",
                  ] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition",
                        mode === option ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {option === "draw" ? "Draw signature" : "Upload signature"}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "draw"
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
                        onPointerCancel={endDraw}
                        onPointerLeave={endDraw}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Draw your signature in the box above.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
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
                      {uploaded
                        ? (
                            <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
                              <img
                                src={uploaded.preview}
                                alt="Uploaded signature"
                                className="h-16 object-contain"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fileRef.current?.click()}
                                >
                                  Replace
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setUploaded(null)}
                                >
                                  Remove
                                </Button>
                              </div>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
                disabled={!agreement || !nameMatches}
                onClick={() => void confirmSignature()}
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
