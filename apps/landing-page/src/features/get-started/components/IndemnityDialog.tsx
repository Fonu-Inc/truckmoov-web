"use client";

import type { PointerEvent } from "react";
import { CloudArrowUp } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingIndemnityAgreementQueryOptions } from "@truckmoov/api/auth";
import {
  useRef,
  useState,
} from "react";
import {
  Notice,
  Spinner,
} from "@/features/get-started/components/StepParts";
import { SubDialog } from "@/features/get-started/components/SubDialog";
import { companyNameMatches } from "@/features/get-started/schemas/applySchemas";
import {
  FIELD_CLASS,
  LABEL_CLASS,
  LINK_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/features/get-started/utils/getStartedContent";
import { cn } from "@/shared/utils";

type SignatureMode = "draw" | "upload";

/** The server takes PNG or JPG, at most 2MB. */
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

/**
 * The indemnity agreement with an electronic signature (main app: IndemnityDialog). The
 * wording and its `version` come from the server; the signature is recorded against the
 * version that was on screen. The pad is a plain `<canvas>`.
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
  /** Pre-fills the company-name field when re-opening an already signed form. */
  initialName?: string;
  /** The application's organizationName; the typed name must match it (server enforces the same rule). */
  companyName: string;
  /** Shown above the pad, e.g. after the agreement was superseded mid-signing. */
  notice?: string | null;
  onSigned: (result: {
    method: "drawn" | "uploaded";
    name: string;
    image: Blob;
    version: string;
  }) => void;
}) {
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
  ] = useState<{
    file: File; preview: string;
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
    reader.onload = () => setUploadedSignature({
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
    typedSignature,
    companyName,
  );

  async function confirmSignature() {
    if (!typedSignature.trim()) {
      setError("Enter your company name to sign the form.");
      return;
    }
    if (!nameMatches)
      return;
    const image = signatureMode === "draw" ? await drawnImage() : (uploadedSignature?.file ?? null);
    if (!image) {
      setError(signatureMode === "draw" ? "Draw your signature to sign the form." : "Upload an image of your signature to sign the form.");
      return;
    }
    if (!agreement) {
      setError("The agreement hasn't loaded yet. Try again in a moment.");
      return;
    }
    setError(null);
    onSigned({
      method: signatureMode === "draw" ? "drawn" : "uploaded",
      name: typedSignature.trim(),
      image,
      version: agreement.version,
    });
    onOpenChange(false);
  }

  return (
    <SubDialog
      open={open}
      onOpenChange={onOpenChange}
      title={agreement?.title ?? "Fleet Pro Indemnity Form"}
      description={agreement ? `Version ${agreement.version}. Read the complete document, then sign electronically below.` : "Read the complete document, then sign electronically below."}
      className="h-[calc(100dvh-2rem)] sm:max-w-[720px]"
      footer={(
        <>
          <button
            type="button"
            className={cn(
              SECONDARY_BUTTON_CLASS,
              "h-[45px] px-6 text-sm",
            )}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            disabled={!agreement || !nameMatches}
            onClick={() => void confirmSignature()}
          >
            Confirm Signature
          </button>
        </>
      )}
    >
      <article className="rounded-[20px] bg-surface p-5 sm:p-8">
        <p className="text-center text-2xs font-bold tracking-widest text-brand-deep uppercase">Fleet Pro</p>
        <h3 className="mt-2 text-center text-lg font-semibold text-heading">{agreement?.title ?? "Indemnity Agreement"}</h3>
        <div className="mt-6 text-sm leading-7 text-heading">
          {agreementQuery.isLoading && (
            <div className="flex justify-center py-8">
              <Spinner className="size-8 border-[3px]" />
            </div>
          )}
          {agreementQuery.isError && (
            <p className="text-center text-destructive">
              The agreement couldn't be loaded.
              {" "}
              <button
                type="button"
                className={LINK_CLASS}
                onClick={() => void agreementQuery.refetch()}
              >
                Try again
              </button>
            </p>
          )}
          {agreement && <p className="whitespace-pre-line">{agreement.body}</p>}
        </div>
      </article>

      <div className="mt-6 space-y-4">
        {notice && <Notice>{notice}</Notice>}
        <p className="text-sm text-heading">
          By signing below, I confirm that I have read and understood the Fleet Pro Indemnity
          terms and agreements.
        </p>

        <label className="block space-y-1.5">
          <span className={LABEL_CLASS}>
            Company Name
            <span
              aria-hidden="true"
              className="ml-0.5 text-destructive"
            >
              *
            </span>
          </span>
          <input
            value={typedSignature}
            placeholder="Enter your company name"
            className={FIELD_CLASS}
            aria-invalid={Boolean(typedSignature.trim()) && !nameMatches}
            onChange={event => setTypedSignature(event.target.value)}
          />
          {typedSignature.trim() && !nameMatches && (
            <span className="block text-xs text-destructive">{`This must match your company name: ${companyName}`}</span>
          )}
        </label>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={LABEL_CLASS}>
              Signature
              <span
                aria-hidden="true"
                className="ml-0.5 text-destructive"
              >
                *
              </span>
            </span>
            <div className="inline-flex rounded-[12px] border-[0.5px] border-border p-0.5">
              {([
                "draw",
                "upload",
              ] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSignatureMode(mode)}
                  className={cn(
                    "cursor-pointer rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors",
                    signatureMode === mode ? "bg-primary text-heading" : "text-muted-foreground hover:text-heading",
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
                    height={160}
                    aria-label="Draw your signature"
                    className="h-24 w-full touch-none rounded-[15px] border border-border-field bg-background"
                    onPointerDown={startDraw}
                    onPointerMove={moveDraw}
                    onPointerUp={endDraw}
                    onPointerLeave={endDraw}
                    onPointerCancel={endDraw}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Draw your signature in the box above.</p>
                    <button
                      type="button"
                      className={cn(
                        LINK_CLASS,
                        "text-xs",
                      )}
                      onClick={clearSignature}
                    >
                      Clear signature
                    </button>
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
                        <div className="flex flex-wrap items-center gap-4 rounded-[15px] border border-border-field bg-background p-3">
                          <img
                            src={uploadedSignature.preview}
                            alt="Uploaded signature"
                            className="h-16 object-contain"
                          />
                          <button
                            type="button"
                            className={SECONDARY_BUTTON_CLASS}
                            onClick={() => fileRef.current?.click()}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            className={cn(
                              LINK_CLASS,
                              "text-xs",
                            )}
                            onClick={() => setUploadedSignature(null)}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    : (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[15px] border border-dashed border-border-field bg-background text-xs text-muted-foreground hover:border-border-deep"
                        >
                          <CloudArrowUp className="size-5" />
                          Upload an image of your signature (PNG or JPG)
                        </button>
                      )}
                </>
              )}
        </div>
        {error && <Notice>{error}</Notice>}
      </div>
    </SubDialog>
  );
}
