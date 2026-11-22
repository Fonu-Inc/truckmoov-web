import type { OrganizationBrandingSettings } from "@truckmoov/api/auth";

export type BrandingColorKey
  = | "primaryColor"
    | "secondaryColor"
    | "accentColor"
    | "successColor"
    | "warningColor"
    | "destructiveColor"
    | "sidebarBackground"
    | "sidebarText"
    | "sidebarAccent";

export const BRANDING_TOKENS: readonly {
  key: BrandingColorKey;
  cssVar: string;
  label: string;
  description: string;
  group: "primary" | "status" | "sidebar";
}[] = [
  {
    key: "primaryColor", cssVar: "--primary", label: "Primary", description: "Buttons, links, focus rings", group: "primary",
  },
  {
    key: "secondaryColor", cssVar: "--secondary", label: "Secondary", description: "Subtle fills and hover states", group: "primary",
  },
  {
    key: "accentColor", cssVar: "--accent", label: "Accent", description: "Highlights and secondary CTAs", group: "primary",
  },
  {
    key: "successColor", cssVar: "--success", label: "Success", description: "Completed and healthy states", group: "status",
  },
  {
    key: "warningColor", cssVar: "--warning", label: "Warning", description: "Caution and idle states", group: "status",
  },
  {
    key: "destructiveColor", cssVar: "--destructive", label: "Destructive", description: "Errors and danger actions", group: "status",
  },
  {
    key: "sidebarBackground", cssVar: "--sidebar-background", label: "Background", description: "Sidebar surface", group: "sidebar",
  },
  {
    key: "sidebarText", cssVar: "--sidebar-foreground", label: "Text", description: "Sidebar text and icons", group: "sidebar",
  },
  {
    key: "sidebarAccent", cssVar: "--sidebar-accent", label: "Accent", description: "Active item highlight", group: "sidebar",
  },
];

export const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export type ThemeMode = "dark" | "light";

// ponytail: pair encoded as "dark:light" in one string; keeps the backend
// schema untouched. Legacy single-hex values parse as { dark: X, light: X }.
export function parseColorPair(v: unknown): {
  dark: string; light: string;
} {
  // API has returned non-strings here (e.g. { dark, light } objects); never crash the app shell.
  if (v && typeof v === "object") {
    const o = v as {
      dark?: unknown; light?: unknown;
    };
    const dark = typeof o.dark === "string" ? o.dark : "";
    const light = typeof o.light === "string" ? o.light : dark;
    return {
      dark, light,
    };
  }
  if (typeof v !== "string" || !v) {
    return {
      dark: "", light: "",
    };
  }
  const [
    dark,
    light,
  ] = v.split(":");
  return {
    dark: dark ?? "", light: light ?? dark ?? "",
  };
}

export function formatColorPair(dark: string, light: string): string {
  return `${dark}:${light}`;
}

export function pickForTheme(v: unknown, theme: ThemeMode): string | undefined {
  const p = parseColorPair(v);
  const primary = theme === "dark" ? p.dark : p.light;
  const fallback = theme === "dark" ? p.light : p.dark;
  return primary || fallback || undefined;
}

// From docs/design.md "Core tokens" table. Sidebar values match the
// dark-charcoal-in-both-themes rule.
export const BRANDING_DEFAULTS: Record<BrandingColorKey, {
  dark: string; light: string;
}> = {
  primaryColor: {
    dark: "#FFD400", light: "#E6B800",
  },
  secondaryColor: {
    dark: "#262A33", light: "#F1F3F5",
  },
  accentColor: {
    dark: "#E0A806", light: "#E0A806",
  },
  successColor: {
    dark: "#22C55E", light: "#16A34A",
  },
  warningColor: {
    dark: "#F5A524", light: "#EAB308",
  },
  destructiveColor: {
    dark: "#EF4444", light: "#DC2626",
  },
  sidebarBackground: {
    dark: "#0F1115", light: "#0F1115",
  },
  sidebarText: {
    dark: "#E5E7EB", light: "#E5E7EB",
  },
  sidebarAccent: {
    dark: "#1F2430", light: "#1F2430",
  },
};

// Perceived-luminance check; returns near-black or white for max contrast.
export function readableTextOn(hex: string): string {
  if (!HEX_COLOR_PATTERN.test(hex))
    return "#111";
  const r = Number.parseInt(
    hex.slice(
      1,
      3,
    ),
    16,
  ) / 255;
  const g = Number.parseInt(
    hex.slice(
      3,
      5,
    ),
    16,
  ) / 255;
  const b = Number.parseInt(
    hex.slice(
      5,
      7,
    ),
    16,
  ) / 255;
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.55 ? "#111" : "#fff";
}

export function hexToHslTriplet(hex: string): string | null {
  if (!HEX_COLOR_PATTERN.test(hex))
    return null;
  const r = Number.parseInt(
    hex.slice(
      1,
      3,
    ),
    16,
  ) / 255;
  const g = Number.parseInt(
    hex.slice(
      3,
      5,
    ),
    16,
  ) / 255;
  const b = Number.parseInt(
    hex.slice(
      5,
      7,
    ),
    16,
  ) / 255;
  const max = Math.max(
    r,
    g,
    b,
  );
  const min = Math.min(
    r,
    g,
    b,
  );
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(
    l,
    1 - l,
  );
  const f = (n: number) => {
    const c = l - a * Math.max(
      -1,
      Math.min(
        k(n) - 3,
        Math.min(
          9 - k(n),
          1,
        ),
      ),
    );
    return Math.round(c * 255).toString(16).padStart(
      2,
      "0",
    );
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function hslTripletToHex(triplet: string): string | null {
  const m = triplet.trim().match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m)
    return null;
  return hslToHex(
    Number.parseFloat(m[1]),
    Number.parseFloat(m[2]),
    Number.parseFloat(m[3]),
  );
}

export function readTokenAsHex(cssVar: string): string {
  if (typeof window === "undefined")
    return "#000000";
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return hslTripletToHex(raw) ?? "#000000";
}

export function applyBrandingToDocument(
  branding: Partial<OrganizationBrandingSettings> | null | undefined,
  {
    theme = "dark",
    includeSidebar = true,
  }: {
    theme?: ThemeMode; includeSidebar?: boolean;
  } = {},
) {
  if (typeof window === "undefined")
    return;
  const root = document.documentElement;
  for (const {
    key, cssVar, group,
  } of BRANDING_TOKENS) {
    if (group === "sidebar" && !includeSidebar) {
      root.style.removeProperty(cssVar);
      continue;
    }
    const hex = pickForTheme(
      branding?.[key],
      theme,
    );
    const hsl = hex ? hexToHslTriplet(hex) : null;
    if (hsl) {
      root.style.setProperty(
        cssVar,
        hsl,
      );
    }
    else {
      root.style.removeProperty(cssVar);
    }
  }
}

export function clearBrandingFromDocument() {
  if (typeof window === "undefined")
    return;
  const root = document.documentElement;
  for (const { cssVar } of BRANDING_TOKENS) root.style.removeProperty(cssVar);
}
