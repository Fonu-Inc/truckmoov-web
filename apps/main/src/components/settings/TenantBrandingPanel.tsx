import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn/avatar';
import { Upload, RotateCcw, Save, Palette, Image as ImageIcon } from 'lucide-react';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { Skeleton } from '@/components/shadcn/skeleton';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorField({ label, value, onChange, description }: ColorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-md border border-border cursor-pointer appearance-none bg-transparent p-0"
            style={{ WebkitAppearance: 'none' }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-xs uppercase"
          maxLength={7}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function TenantBrandingPanel() {
  const { branding, isLoading, isSaving, saveBranding, uploadLogo, resetToDefaults, DEFAULT_BRANDING } = useTenantBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!branding) return null;

  const getColor = (key: string) => localColors[key] ?? (branding as any)[key] ?? (DEFAULT_BRANDING as any)[key];

  const updateColor = (key: string, value: string) => {
    setLocalColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    await saveBranding(localColors);
    setLocalColors({});
  };

  const handleReset = async () => {
    setLocalColors({});
    await resetToDefaults();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    const url = await uploadLogo(file);
    if (url) {
      await saveBranding({ logo_url: url });
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasChanges = Object.keys(localColors).length > 0;

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Profile Image
          </CardTitle>
          <CardDescription>
            Upload your profile picture. It will appear in the sidebar and header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage src={branding.logo_url || undefined} className="object-contain" />
              <AvatarFallback className="bg-primary/20 text-primary text-xl rounded-lg">
                Photo
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2MB.</p>
              {branding.logo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => saveBranding({ logo_url: null })}
                >
                  Remove photo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card className="bg-card/50 border-border/50">
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
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={!hasChanges || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Colors'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Primary Colors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorField
                label="Primary"
                value={getColor('primary_color')}
                onChange={(v) => updateColor('primary_color', v)}
                description="Main brand color for buttons and links"
              />
              <ColorField
                label="Secondary"
                value={getColor('secondary_color')}
                onChange={(v) => updateColor('secondary_color', v)}
                description="Used for secondary UI elements"
              />
              <ColorField
                label="Accent"
                value={getColor('accent_color')}
                onChange={(v) => updateColor('accent_color', v)}
                description="Highlights and subtle accents"
              />
            </div>
          </div>

          <Separator />

          {/* Status Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Status Colors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorField
                label="Success"
                value={getColor('success_color')}
                onChange={(v) => updateColor('success_color', v)}
                description="Online, completed states"
              />
              <ColorField
                label="Warning"
                value={getColor('warning_color')}
                onChange={(v) => updateColor('warning_color', v)}
                description="Caution, idle states"
              />
              <ColorField
                label="Destructive"
                value={getColor('destructive_color')}
                onChange={(v) => updateColor('destructive_color', v)}
                description="Errors, danger actions"
              />
            </div>
          </div>

          <Separator />

          {/* Sidebar Colors */}
          <div>
            <h4 className="text-sm font-medium mb-3">Sidebar Colors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ColorField
                label="Background"
                value={getColor('sidebar_bg_color')}
                onChange={(v) => updateColor('sidebar_bg_color', v)}
                description="Sidebar background"
              />
              <ColorField
                label="Text"
                value={getColor('sidebar_text_color')}
                onChange={(v) => updateColor('sidebar_text_color', v)}
                description="Sidebar text and icons"
              />
              <ColorField
                label="Accent"
                value={getColor('sidebar_accent_color')}
                onChange={(v) => updateColor('sidebar_accent_color', v)}
                description="Active item highlight"
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
                  style={{ backgroundColor: getColor('sidebar_bg_color') }}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: getColor('primary_color'), color: '#fff' }}
                  >
                    T
                  </div>
                  <div className="w-8 h-1 rounded" style={{ backgroundColor: getColor('sidebar_text_color'), opacity: 0.5 }} />
                  <div
                    className="w-10 h-6 rounded"
                    style={{ backgroundColor: getColor('sidebar_accent_color') }}
                  />
                  <div className="w-8 h-1 rounded" style={{ backgroundColor: getColor('sidebar_text_color'), opacity: 0.3 }} />
                </div>
                {/* Mini content preview */}
                <div className="flex-1 p-3 bg-background">
                  <div className="flex gap-2 mb-2">
                    <div className="px-3 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: getColor('primary_color') }}>
                      Primary
                    </div>
                    <div className="px-3 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: getColor('accent_color') }}>
                      Accent
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('success_color') }} />
                      <span className="text-[10px] text-muted-foreground">Online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('warning_color') }} />
                      <span className="text-[10px] text-muted-foreground">Idle</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor('destructive_color') }} />
                      <span className="text-[10px] text-muted-foreground">Error</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
