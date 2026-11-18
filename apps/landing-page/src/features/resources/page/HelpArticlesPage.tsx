import { cacheLife } from "next/cache";
import { HelpArticleBrowser } from "@/features/resources/components/HelpArticleBrowser";
import { ResourcePage } from "@/features/resources/components/ResourcePage";
import {
  HELP_ARTICLES,
  HELP_ARTICLES_HERO,
} from "@/features/resources/utils/resourceContent";

/** Figma "Landing Page (Help Articles)". */
export async function HelpArticlesPage() {
  "use cache";
  cacheLife("max");

  return (
    <ResourcePage
      hero={HELP_ARTICLES_HERO}
      className="pt-20 pb-[39px]"
    >
      <HelpArticleBrowser articles={HELP_ARTICLES} />
    </ResourcePage>
  );
}
