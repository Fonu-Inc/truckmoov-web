import { createContext } from "react";

/** Set by the apply page while a form step is showing; null hides "Save and continue later". */
export const ApplicationSaveContext = createContext<(() => void) | null>(null);
