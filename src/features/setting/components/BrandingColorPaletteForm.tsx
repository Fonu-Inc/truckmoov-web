import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Palette, RotateCcw, Save } from "lucide-react";
import ColorField from "./ColorField";
import { DEFAULT_BRANDING } from "../variables";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationsSettingsQueryOptions } from "@/features/auth/api";
import { useMemo } from "react";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color");

const brandingColorSchema = z.object({
 primary_color: hexColor,
 secondary_color: hexColor,
 accent_color: hexColor,
 success_color: hexColor,
 warning_color: hexColor,
 destructive_color: hexColor,
 sidebar_bg_color: hexColor,
 sidebar_text_color: hexColor,
 sidebar_accent_color: hexColor,
});

type BrandingColorFormValues = z.infer<typeof brandingColorSchema>;

export default function BrandingColorPaletteForm() {
 const { data } = useQuery(getOrganizationsSettingsQueryOptions())

 const organizationSetting = useMemo<BrandingColorFormValues>(() => ({
  primary_color: data?.data?.branding?.primaryColor ?? DEFAULT_BRANDING.primary_color,
  secondary_color: data?.data?.branding?.secondaryColor ?? DEFAULT_BRANDING.secondary_color,
  accent_color: data?.data?.branding?.accentColor ?? DEFAULT_BRANDING.accent_color,
  success_color: data?.data?.branding?.successColor ?? DEFAULT_BRANDING.success_color,
  warning_color: data?.data?.branding?.warningColor ?? DEFAULT_BRANDING.warning_color,
  destructive_color: data?.data?.branding?.destructiveColor ?? DEFAULT_BRANDING.destructive_color,
  sidebar_bg_color: data?.data?.branding?.sidebarBackground ?? DEFAULT_BRANDING.sidebar_bg_color,
  sidebar_text_color: data?.data?.branding?.sidebarText ?? DEFAULT_BRANDING.sidebar_text_color,
  sidebar_accent_color: data?.data?.branding?.sidebarAccent ?? DEFAULT_BRANDING.sidebar_accent_color,
 }), [data])

 const { control, handleSubmit, watch, reset } = useForm<BrandingColorFormValues>({
  resolver: zodResolver(brandingColorSchema),
  values: organizationSetting,
 });

 const colors = watch();

 function onSubmit(values: BrandingColorFormValues) {
  console.log(values);
 }

 return (
  <Card>
   <CardHeader>
    <div className="flex items-center justify-between">
     <div>
      <CardTitle className="flex items-center gap-2">
       <Palette className="h-5 w-5" />
       Color Palette
      </CardTitle>
      <CardDescription>
       Customize your platform colors. Changes apply to all users in your organization.
      </CardDescription>
     </div>
     <div className="flex gap-2">
      <Button variant="outline" size="sm" type="button" onClick={() => reset(organizationSetting)}>
       <RotateCcw className="h-4 w-4" />
       Reset
      </Button>
      <Button size="sm" type="button" onClick={handleSubmit(onSubmit)}>
       <Save className="h-4 w-4" />
       Save Colors
      </Button>
     </div>
    </div>
   </CardHeader>
   <CardContent className="space-y-6">
    {/* Primary Colors */}
    <div>
     <h4 className="text-sm font-medium mb-3">Primary Colors</h4>
     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Controller
       control={control}
       name="primary_color"
       render={({ field }) => (
        <ColorField
         label="Primary"
         value={field.value}
         onChange={field.onChange}
         description="Main brand color for buttons and links"
        />
       )}
      />
      <Controller
       control={control}
       name="secondary_color"
       render={({ field }) => (
        <ColorField
         label="Secondary"
         value={field.value}
         onChange={field.onChange}
         description="Used for secondary UI elements"
        />
       )}
      />
      <Controller
       control={control}
       name="accent_color"
       render={({ field }) => (
        <ColorField
         label="Accent"
         value={field.value}
         onChange={field.onChange}
         description="Highlights and subtle accents"
        />
       )}
      />
     </div>
    </div>

    <Separator />

    {/* Status Colors */}
    <div>
     <h4 className="text-sm font-medium mb-3">Status Colors</h4>
     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Controller
       control={control}
       name="success_color"
       render={({ field }) => (
        <ColorField
         label="Success"
         value={field.value}
         onChange={field.onChange}
         description="Online, completed states"
        />
       )}
      />
      <Controller
       control={control}
       name="warning_color"
       render={({ field }) => (
        <ColorField
         label="Warning"
         value={field.value}
         onChange={field.onChange}
         description="Caution, idle states"
        />
       )}
      />
      <Controller
       control={control}
       name="destructive_color"
       render={({ field }) => (
        <ColorField
         label="Destructive"
         value={field.value}
         onChange={field.onChange}
         description="Errors, danger actions"
        />
       )}
      />
     </div>
    </div>

    <Separator />

    {/* Sidebar Colors */}
    <div>
     <h4 className="text-sm font-medium mb-3">Sidebar Colors</h4>
     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Controller
       control={control}
       name="sidebar_bg_color"
       render={({ field }) => (
        <ColorField
         label="Background"
         value={field.value}
         onChange={field.onChange}
         description="Sidebar background"
        />
       )}
      />
      <Controller
       control={control}
       name="sidebar_text_color"
       render={({ field }) => (
        <ColorField
         label="Text"
         value={field.value}
         onChange={field.onChange}
         description="Sidebar text and icons"
        />
       )}
      />
      <Controller
       control={control}
       name="sidebar_accent_color"
       render={({ field }) => (
        <ColorField
         label="Accent"
         value={field.value}
         onChange={field.onChange}
         description="Active item highlight"
        />
       )}
      />
     </div>
    </div>

    {/* Live Preview */}
    <Separator />
    <div>
     <h4 className="text-sm font-medium mb-3">Live Preview</h4>
     <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex h-32">
       {/* Mini sidebar preview */}
       <div
        className="w-16 p-2 flex flex-col items-center gap-2"
        style={{ backgroundColor: colors.sidebar_bg_color }}
       >
        <div
         className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
         style={{ backgroundColor: colors.primary_color }}
        >
         T
        </div>
        <div
         className="w-8 h-1 rounded"
         style={{ backgroundColor: colors.sidebar_text_color }}
        />
        <div
         className="w-10 h-6 rounded"
         style={{ backgroundColor: colors.sidebar_accent_color }}
        />
        <div
         className="w-8 h-1 rounded"
         style={{ backgroundColor: colors.sidebar_text_color }}
        />
       </div>
       {/* Mini content preview */}
       <div className="flex-1 p-3 bg-background">
        <div className="flex gap-2 mb-2">
         <div
          className="px-3 py-1 rounded text-xs text-white font-medium"
          style={{ backgroundColor: colors.primary_color }}
         >
          Primary
         </div>
         <div
          className="px-3 py-1 rounded text-xs text-white font-medium"
          style={{ backgroundColor: colors.accent_color }}
         >
          Accent
         </div>
        </div>
        <div className="flex gap-2">
         <div className="flex items-center gap-1">
          <div
           className="w-2 h-2 rounded-full"
           style={{ backgroundColor: colors.success_color }}
          />
          <span className="text-[10px] text-muted-foreground">Online</span>
         </div>
         <div className="flex items-center gap-1">
          <div
           className="w-2 h-2 rounded-full"
           style={{ backgroundColor: colors.warning_color }}
          />
          <span className="text-[10px] text-muted-foreground">Idle</span>
         </div>
         <div className="flex items-center gap-1">
          <div
           className="w-2 h-2 rounded-full"
           style={{ backgroundColor: colors.destructive_color }}
          />
          <span className="text-[10px] text-muted-foreground">Error</span>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </CardContent>
  </Card>
 )
}
