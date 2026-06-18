import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Palette, RotateCcw, Save, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  getOrganizationSettingsQueryOptions,
  useUpdateOrganizationSettings,
  useUploadMedia,
  type OrganizationBrandingSettings,
} from "@truckmoov/api/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";

type BrandingColorKey =
  | "primaryColor"
  | "secondaryColor"
  | "accentColor"
  | "successColor"
  | "warningColor"
  | "destructiveColor"
  | "sidebarBackground"
  | "sidebarText"
  | "sidebarAccent";

const DEFAULT_BRANDING: Record<BrandingColorKey, string> = {
  primaryColor: "#E6B800",
  secondaryColor: "#1F2937",
  accentColor: "#FFCC00",
  successColor: "#22C55E",
  warningColor: "#F59E0B",
  destructiveColor: "#EF4444",
  sidebarBackground: "#111827",
  sidebarText: "#F9FAFB",
  sidebarAccent: "#1F2937",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description: string;
};

function ColorField({ label, value, onChange, description }: ColorFieldProps) {
  const validColor = HEX_COLOR_PATTERN.test(value);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={validColor ? value : "#000000"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-10 cursor-pointer rounded-md border border-border bg-transparent p-0"
        />
        <Input
          aria-label={`${label} hex color`}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="w-28 font-mono text-xs uppercase"
          maxLength={7}
          aria-invalid={!validColor}
        />
      </div>
      {!validColor && <p className="text-xs text-destructive">Enter a 6-digit hex color.</p>}
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export function TenantBrandingPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsQuery = useQuery(getOrganizationSettingsQueryOptions());
  const uploadMutation = useUploadMedia();
  const updateMutation = useUpdateOrganizationSettings();
  const [localColors, setLocalColors] = useState<Partial<Record<BrandingColorKey, string>>>({});

  if (settingsQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>We could not load your organization branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{settingsQuery.error.message}</p>
          <Button variant="outline" onClick={() => settingsQuery.refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const branding = settingsQuery.data.data.branding ?? {};
  const getColor = (key: BrandingColorKey) => localColors[key] ?? branding[key] ?? DEFAULT_BRANDING[key];
  const hasChanges = Object.keys(localColors).length > 0;
  const hasInvalidColor = Object.values(localColors).some((color) => !color || !HEX_COLOR_PATTERN.test(color));

  function updateColor(key: BrandingColorKey, value: string) {
    setLocalColors((current) => ({ ...current, [key]: value }));
  }

  function saveBranding(
    changes: Partial<OrganizationBrandingSettings>,
    successMessage: string,
    clearColorChanges = false,
  ) {
    updateMutation.mutate(
      { data: { branding: changes } },
      {
        onSuccess: () => {
          if (clearColorChanges) setLocalColors({});
          toast.success(successMessage);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleSaveColors() {
    if (hasInvalidColor) {
      toast.error("Correct invalid color values before saving.");
      return;
    }
    saveBranding(localColors, "Brand colors saved successfully.", true);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Upload a PNG, JPG, SVG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must not exceed 2 MB.");
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (response) => saveBranding(
        { logoUrl: response.data.url },
        "Organization logo updated successfully.",
      ),
      onError: (error) => toast.error(getErrorMessage(error, "Unable to upload image.")),
    });
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Organization Logo</CardTitle>
          <CardDescription>Upload the logo shown in your organization's sidebar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage src={branding.logoUrl || undefined} className="object-contain" />
              <AvatarFallback className="rounded-lg bg-primary/20 text-xl text-primary">Logo</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept={IMAGE_TYPES.join(",")} className="hidden"
                aria-label="Upload organization logo" onChange={handleImageChange} />
              <Button variant="outline" size="sm" loading={uploadMutation.isPending || updateMutation.isPending}
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Color Palette</CardTitle>
              <CardDescription>Customize platform colors for everyone in your organization.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setLocalColors(DEFAULT_BRANDING)} disabled={updateMutation.isPending}>
                <RotateCcw className="h-4 w-4" />Reset
              </Button>
              <Button size="sm" onClick={handleSaveColors} loading={updateMutation.isPending}
                disabled={!hasChanges || hasInvalidColor}>
                <Save className="h-4 w-4" />Save Colors
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h4 className="mb-3 text-sm font-medium">Primary Colors</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <ColorField label="Primary" value={getColor("primaryColor")} onChange={(v) => updateColor("primaryColor", v)} description="Buttons and links" />
              <ColorField label="Secondary" value={getColor("secondaryColor")} onChange={(v) => updateColor("secondaryColor", v)} description="Secondary elements" />
              <ColorField label="Accent" value={getColor("accentColor")} onChange={(v) => updateColor("accentColor", v)} description="Highlights and accents" />
            </div>
          </section>
          <Separator />
          <section>
            <h4 className="mb-3 text-sm font-medium">Status Colors</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <ColorField label="Success" value={getColor("successColor")} onChange={(v) => updateColor("successColor", v)} description="Completed states" />
              <ColorField label="Warning" value={getColor("warningColor")} onChange={(v) => updateColor("warningColor", v)} description="Caution states" />
              <ColorField label="Destructive" value={getColor("destructiveColor")} onChange={(v) => updateColor("destructiveColor", v)} description="Errors and danger actions" />
            </div>
          </section>
          <Separator />
          <section>
            <h4 className="mb-3 text-sm font-medium">Sidebar Colors</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <ColorField label="Background" value={getColor("sidebarBackground")} onChange={(v) => updateColor("sidebarBackground", v)} description="Sidebar background" />
              <ColorField label="Text" value={getColor("sidebarText")} onChange={(v) => updateColor("sidebarText", v)} description="Sidebar text and icons" />
              <ColorField label="Accent" value={getColor("sidebarAccent")} onChange={(v) => updateColor("sidebarAccent", v)} description="Active item highlight" />
            </div>
          </section>
          <Separator />
          <section>
            <h4 className="mb-3 text-sm font-medium">Live Preview</h4>
            <div className="flex h-32 overflow-hidden rounded-lg border border-border">
              <div className="flex w-16 flex-col items-center gap-2 p-2" style={{ backgroundColor: getColor("sidebarBackground") }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: getColor("primaryColor") }}>T</div>
                <div className="h-1 w-8 rounded opacity-50" style={{ backgroundColor: getColor("sidebarText") }} />
                <div className="h-6 w-10 rounded" style={{ backgroundColor: getColor("sidebarAccent") }} />
              </div>
              <div className="flex-1 bg-background p-3">
                <div className="mb-3 flex gap-2">
                  <div className="rounded px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: getColor("primaryColor") }}>Primary</div>
                  <div className="rounded px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: getColor("accentColor") }}>Accent</div>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span style={{ color: getColor("successColor") }}>Success</span>
                  <span style={{ color: getColor("warningColor") }}>Warning</span>
                  <span style={{ color: getColor("destructiveColor") }}>Error</span>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
