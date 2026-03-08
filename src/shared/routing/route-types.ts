import type { ReactElement } from "react";

export type FeatureRoute = {
  path: string;
  element: ReactElement;
};

export type ProtectRoute = (element: ReactElement) => ReactElement;
