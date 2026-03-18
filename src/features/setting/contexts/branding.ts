import { createContext, useContext } from "react";
import { BrandingContextValue } from "../types";


const BrandingContext = createContext<BrandingContextValue>({ applyBrandingColors: () => {} });

const useBrandingContext = () => useContext(BrandingContext);

export {
 BrandingContext,
 useBrandingContext
}