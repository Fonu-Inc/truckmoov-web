import type { ReactElement } from "react";

export type FeatureRoute = {
  path: string;
  element: ReactElement;
  children?: FeatureRoute[];
};

export type ProtectRoute = (element: ReactElement) => ReactElement;
