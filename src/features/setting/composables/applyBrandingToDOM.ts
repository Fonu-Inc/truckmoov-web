import { Branding } from "@/features/auth/api/types";
import { hexToHSL } from "./hexToHsl";

export function applyBrandingToDOM(b: Branding) {
  const root = document.documentElement;

  const setRaw = (name: string, hex: string | null | undefined) => {
    if (hex) root.style.setProperty(name, hexToHSL(hex));
  };

  const setColor = (name: string, hex: string | null | undefined) => {
    if (hex) root.style.setProperty(name, `hsl(${hexToHSL(hex)})`);
  };

  // Raw HSL vars (referenced by @theme)
  setRaw('--primary', b.primaryColor);
  setRaw('--ring', b.primaryColor);
  setRaw('--sidebar-primary', b.primaryColor);
  setRaw('--sidebar-ring', b.primaryColor);

  setRaw('--accent', b.accentColor);

  setRaw('--success', b.successColor);
  setRaw('--warning', b.warningColor);
  setRaw('--destructive', b.destructiveColor);

  setRaw('--background', b.sidebarBackground);
  setRaw('--sidebar-foreground', b.sidebarText);
  setRaw('--sidebar-accent', b.sidebarAccent);
  setRaw('--sidebar-border', b.sidebarAccent);
}