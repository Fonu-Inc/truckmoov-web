import type { FeatureRoute } from "@/shared/routes/route-types";
import { ARCHITECTURE_DOC_PATH, TECHNICAL_ARCHITECTURE_DOC_PATH } from "../domain/docs-routes";
import { ArchitecturePageView, TechnicalArchitecturePageView } from "../ui/DocsPages";

export function buildDocumentationRoutes(): FeatureRoute[] {
  return [
    { path: ARCHITECTURE_DOC_PATH, element: <ArchitecturePageView /> },
    { path: TECHNICAL_ARCHITECTURE_DOC_PATH, element: <TechnicalArchitecturePageView /> },
  ];
}
