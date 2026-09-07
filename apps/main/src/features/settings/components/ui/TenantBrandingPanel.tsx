import type { OrganizationBrandingSettings } from "@truckmoov/api/auth";
import type { BrandingColorKey } from "../../branding/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationSettingsQueryOptions,
  useUpdateOrganizationSettings,
  useUploadMedia,
} from "@truckmoov/api/auth";
import {
  Bell, Home, Image as ImageIcon, Moon, Palette, RotateCcw, Save, Search, Settings2, Sun, Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
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
  BRANDING_DEFAULTS,
  BRANDING_TOKENS,
  clearBrandingFromDocument,
  formatColorPair,
  HEX_COLOR_PATTERN,
  hexToHslTriplet,
  parseColorPair,
  readableTextOn,
  type ThemeMode,
} from "../../branding/tokens";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

function HexInput({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const valid = HEX_COLOR_PATTERN.test(value);
  return (
    <div className="flex items-center gap-1.5">
      <input
        aria-label={`${label} picker`}
        type="color"
        value={valid ? value : "#000000"}
        onChange={event => onChange(event.target.value.toUpperCase())}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
      />
      <Input
        aria-label={`${label} hex`}
        value={value}
        onChange={event => onChange(event.target.value.toUpperCase())}
        className="w-24 font-mono text-xs uppercase"
        maxLength={7}
        aria-invalid={!valid}
      />
    </div>
  );
}

function ColorField({
  label, dark, light, onChange, description,
}: {
  label: string;
  dark: string;
  light: string;
  onChange: (mode: ThemeMode, value: string) => void;
  description: string;
}) {
  const darkValid = HEX_COLOR_PATTERN.test(dark);
  const lightValid = HEX_COLOR_PATTERN.test(light);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Moon
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
          <HexInput
            label={`${label} dark`}
            value={dark}
            onChange={v => onChange("dark", v)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Sun
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
          <HexInput
            label={`${label} light`}
            value={light}
            onChange={v => onChange("light", v)}
          />
        </div>
      </div>
      {(!darkValid || !lightValid) && <p className="text-xs text-destructive">Enter a 6-digit hex color.</p>}
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function LivePreview({ colors }: { colors: Record<BrandingColorKey, string> }) {
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
                backgroundColor: colors.primaryColor, color: readableTextOn(colors.primaryColor),
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
                backgroundColor: colors.primaryColor, color: readableTextOn(colors.primaryColor),
              }}
            >
              New trip
            </button>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: colors.accentColor, color: readableTextOn(colors.accentColor),
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
                  backgroundColor: colors.successColor, color: readableTextOn(colors.successColor),
                }}
              >
                On time
              </span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: colors.warningColor, color: readableTextOn(colors.warningColor),
                }}
              >
                Idle 3
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: colors.destructiveColor, color: readableTextOn(colors.destructiveColor),
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
  const { resolvedTheme, setTheme } = useTheme();
  const currentTheme: ThemeMode = resolvedTheme === "light" ? "light" : "dark";
  const [
    localColors,
    setLocalColors,
  ] = useState<Partial<Record<BrandingColorKey, { dark: string; light: string }>>>({});

  const savedBranding = settingsQuery.data?.data?.branding;
  useEffect(
    () => () => {
      applyBrandingToDocument(
        savedBranding,
        {
          theme: currentTheme,
          includeSidebar: currentTheme === "dark",
        },
      );
    },
    [savedBranding, currentTheme],
  );

  const branding = savedBranding ?? {};
  const getPair = (key: BrandingColorKey) => {
    if (localColors[key])
      return localColors[key]!;
    const saved = parseColorPair(branding[key]);
    const fallback = BRANDING_DEFAULTS[key];
    return {
      dark: (saved.dark || fallback.dark).toUpperCase(),
      light: (saved.light || fallback.light).toUpperCase(),
    };
  };

  const previewColors = useMemo(
    () => Object.fromEntries(BRANDING_TOKENS.map(t => [
      t.key,
      getPair(t.key)[currentTheme],
    ])) as Record<BrandingColorKey, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      localColors,
      branding,
      currentTheme,
    ],
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

  const hasChanges = Object.keys(localColors).length > 0;
  const hasInvalidColor = Object.values(localColors).some(
    p => !p || !HEX_COLOR_PATTERN.test(p.dark) || !HEX_COLOR_PATTERN.test(p.light),
  );

  function updateColor(key: BrandingColorKey, mode: ThemeMode, value: string) {
    setLocalColors((current) => {
      const existing = current[key] ?? getPair(key);
      return {
        ...current,
        [key]: { ...existing, [mode]: value },
      };
    });
    if (mode !== currentTheme)
      return;
    const cssVar = BRANDING_TOKENS.find(t => t.key === key)!.cssVar;
    const hsl = hexToHslTriplet(value);
    if (hsl)
      document.documentElement.style.setProperty(cssVar, hsl);
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
    const changes: Partial<OrganizationBrandingSettings> = Object.fromEntries(
      Object.entries(localColors).map(([
        key,
        pair,
      ]) => [
        key,
        formatColorPair(pair!.dark, pair!.light),
      ]),
    );
    saveBranding(
      changes,
      "Brand colors saved successfully.",
      true,
    );
  }

  function handleReset() {
    clearBrandingFromDocument();
    setLocalColors(BRANDING_DEFAULTS);
    for (const {
      key, cssVar,
    } of BRANDING_TOKENS) {
      const hsl = hexToHslTriplet(BRANDING_DEFAULTS[key][currentTheme]);
      if (hsl)
        document.documentElement.style.setProperty(cssVar, hsl);
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border border-border p-0.5">
                <Button
                  variant={currentTheme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="h-7 px-2"
                >
                  <Moon className="h-3.5 w-3.5" />
                  Dark
                </Button>
                <Button
                  variant={currentTheme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="h-7 px-2"
                >
                  <Sun className="h-3.5 w-3.5" />
                  Light
                </Button>
              </div>
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
                    sidebar stays dark in both themes
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BRANDING_TOKENS.filter(t => t.group === group.id).map((t) => {
                  const pair = getPair(t.key);
                  return (
                    <ColorField
                      key={t.key}
                      label={t.label}
                      dark={pair.dark}
                      light={pair.light}
                      onChange={(mode, v) => updateColor(t.key, mode, v)}
                      description={t.description}
                    />
                  );
                })}
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
