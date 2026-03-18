import { Branding } from "../auth/api/types";

export type BrandingContextValue = {
 applyBrandingColors: (branding: Branding) => void;
}