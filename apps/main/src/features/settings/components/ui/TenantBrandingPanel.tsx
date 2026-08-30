import type { OrganizationBrandingSettings } from "@truckmoov/api/auth";
import type { BrandingColorKey } from "../../branding/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationSettingsQueryOptions,
  useUpdateOrganizationSettings,
  useUploadMedia,
} from "@truckmoov/api/auth";
import {
  Bell, Home, Image as ImageIcon, Palette, RotateCcw, Save, Search, Settings2, Upload,
} from "lucide-react";
import {
  useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  applyBrandingToDocument,
  BRANDING_TOKENS,

  clearBrandingFromDocument,
  HEX_COLOR_PATTERN,
  hexToHslTriplet,
  readTokenAsHex,
} from "../../branding/tokens";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

function ColorField({
  label, value, onChange, description,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description: string;
}) {
  const validColor = HEX_COLOR_PATTERN.test(value);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={validColor ? value : "#000000"}
          onChange={event => onChange(event.target.value.toUpperCase())}
          className="h-10 w-10 cursor-pointer rounded-md border border-border bg-transparent p-0"
        />
        <Input
          aria-label={`${label} hex color`}
          value={value}
          onChange={event => onChange(event.target.value.toUpperCase())}
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

function LivePreview({ colors }: { colors: Record<BrandingColorKey, string> }) {
  const swatch = (key: BrandingColorKey) => ({ backgroundColor: colors[key] });
  const text = (key: BrandingColorKey) => ({ color: colors[key] });
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[9rem_1fr]">
        <aside
          className="flex flex-col gap-1 p-3 text-xs"
          style={{
            backgroundColor: colors.sidebarBackground, color: colors.sidebarText,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold"
              style={{
                backgroundColor: colors.primaryColor, color: colors.sidebarBackground,
              }}
            >
              T
            </div>
            <span className="font-semibold tracking-tight">TruckMoov</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{ backgroundColor: colors.sidebarAccent }}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-80">
            <Bell className="h-3.5 w-3.5" />
            <span>Alerts</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-80">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Settings</span>
          </div>
        </aside>
        <div className="space-y-3 bg-background p-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span>Search fleet…</span>
            </div>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: colors.primaryColor, color: colors.sidebarBackground,
              }}
            >
              New trip
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: colors.accentColor, color: colors.sidebarBackground,
              }}
            >
              Assign
            </button>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold">Active trip #4821</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: colors.successColor, color: "#fff",
                }}
              >
                On time
              </span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: colors.warningColor, color: "#111",
                }}
              >
                Idle 3
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: colors.destructiveColor, color: "#fff",
                }}
              >
                Alert 1
              </span>
              <span
                className="ml-auto font-medium"
                style={text("primaryColor")}
              >
                View
              </span>
            </div>
          </div>
        </div>
      </div>
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
  const [
    localColors,
    setLocalColors,
  ] = useState<Partial<Record<BrandingColorKey, string>>>({});

  const savedBranding = settingsQuery.data?.data?.branding;
  useEffect(
    () => () => {
      applyBrandingToDocument(savedBranding);
    },
    [savedBranding],
  );

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
          <Button
            variant="outline"
            onClick={() => settingsQuery.refetch()}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const branding = settingsQuery.data.data.branding ?? {};
  const getColor = (key: BrandingColorKey) => {
    const cssVar = BRANDING_TOKENS.find(t => t.key === key)!.cssVar;
    return (localColors[key] ?? branding[key] ?? readTokenAsHex(cssVar)).toUpperCase();
  };

  const previewColors = useMemo(
    () => Object.fromEntries(BRANDING_TOKENS.map(t => [
      t.key,
      getColor(t.key),
    ])) as Record<BrandingColorKey, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      localColors,
      branding,
    ],
  );

  const hasChanges = Object.keys(localColors).length > 0;
  const hasInvalidColor = Object.values(localColors).some(c => !c || !HEX_COLOR_PATTERN.test(c));

  function updateColor(key: BrandingColorKey, value: string) {
    setLocalColors(current => ({
      ...current, [key]: value,
    }));
    const cssVar = BRANDING_TOKENS.find(t => t.key === key)!.cssVar;
    const hsl = hexToHslTriplet(value);
    if (hsl) {
      document.documentElement.style.setProperty(
        cssVar,
        hsl,
      );
    }
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
          if (clearColorChanges)
            setLocalColors({});
          toast.success(successMessage);
        },
        onError: error => toast.error(error.message),
      },
    );
  }

  function handleSaveColors() {
    if (hasInvalidColor) {
      toast.error("Correct invalid color values before saving.");
      return;
    }
    saveBranding(
      localColors,
      "Brand colors saved successfully.",
      true,
    );
  }

  function handleReset() {
    clearBrandingFromDocument();
    const defaults = Object.fromEntries(
      BRANDING_TOKENS.map(t => [
        t.key,
        readTokenAsHex(t.cssVar),
      ]),
    ) as Record<BrandingColorKey, string>;
    setLocalColors(defaults);
    for (const {
      key, cssVar,
    } of BRANDING_TOKENS) {
      const hsl = hexToHslTriplet(defaults[key]);
      if (hsl) {
        document.documentElement.style.setProperty(
          cssVar,
          hsl,
        );
      }
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file)
      return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Upload a PNG, JPG, SVG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must not exceed 2 MB.");
      return;
    }
    uploadMutation.mutate(
      file,
      {
        onSuccess: response => saveBranding(
          { logoUrl: response.data.url },
          "Organization logo updated successfully.",
        ),
        onError: error => toast.error(getErrorMessage(
          error,
          "Unable to upload image.",
        )),
      },
    );
  }

  const groups: Array<{
    id: "primary" | "status" | "sidebar"; title: string;
  }> = [
    {
      id: "primary", title: "Primary Colors",
    },
    {
      id: "status", title: "Status Colors",
    },
    {
      id: "sidebar", title: "Sidebar Colors",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Organization Logo
          </CardTitle>
          <CardDescription>Upload the logo shown in your organization's sidebar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage
                src={branding.logoUrl || undefined}
                className="object-contain"
              />
              <AvatarFallback className="rounded-lg bg-primary/20 text-xl text-primary">Logo</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="hidden"
                aria-label="Upload organization logo"
                onChange={handleImageChange}
              />
              <Button
                variant="outline"
                size="sm"
                loading={uploadMutation.isPending || updateMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Logo
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
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>Customize platform colors for everyone in your organization.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSaveColors}
                loading={updateMutation.isPending}
                disabled={!hasChanges || hasInvalidColor}
              >
                <Save className="h-4 w-4" />
                Save Colors
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.map((group, i) => (
            <section key={group.id}>
              {i > 0 && <Separator className="mb-6" />}
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-sm font-medium">{group.title}</h4>
                {group.id === "sidebar" && (
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    applied in both themes
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {BRANDING_TOKENS.filter(t => t.group === group.id).map(t => (
                  <ColorField
                    key={t.key}
                    label={t.label}
                    value={getColor(t.key)}
                    onChange={v => updateColor(
                      t.key,
                      v,
                    )}
                    description={t.description}
                  />
                ))}
              </div>
            </section>
          ))}

          <Separator />
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Live Preview</h4>
              <p className="text-xs text-muted-foreground">The rest of the app also updates live.</p>
            </div>
            <LivePreview colors={previewColors} />
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
