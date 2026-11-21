import { createContext } from "react";

/**
 * The page heading — fleetflow's shared `PageTitle`. DashboardLayout provides
 * the current nav entry's title/description and renders `<PageTitle />` above
 * the page itself, unless the entry is `manualTitle` (tabbed pages render it
 * below their tab bar, usually with a per-tab title).
 */
export const PageTitleContext = createContext<{
  title: string;
  description?: string;
}>({ title: "" });
export const PageActionsContext = createContext<{
  target: HTMLDivElement | null;
  setTarget: (target: HTMLDivElement | null) => void;
} | null>(null);
