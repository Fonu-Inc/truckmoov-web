import type { ResourceCategoryView } from "@/features/resources/utils/resourceTypes";
import { DocumentationBrowser } from "@/features/resources/components/DocumentationBrowser";
import { ResourcePage } from "@/features/resources/components/ResourcePage";
import {
  DOC_CATEGORIES,
  DOCUMENTATION_HERO,
} from "@/features/resources/utils/resourceContent";
import { IconChip } from "@/shared/components/IconChip";

/** Figma "Landing Page (EDocumentation)". */
export async function DocumentationPage() {
  // Icons are components (not serialisable): render each chip here and hand the browser the element.
  const categories: ResourceCategoryView[] = DOC_CATEGORIES.map(({
    icon,
    ...category
  }) => ({
    ...category,
    icon: <IconChip icon={icon} />,
  }));

  return (
    <ResourcePage
      hero={DOCUMENTATION_HERO}
      className="pt-[60px] pb-[60px]"
    >
      <DocumentationBrowser categories={categories} />
    </ResourcePage>
  );
}
