import { useState } from "react";
import HelpArticleList from "@/ui/components/resources/help-article-list";
import NoResults from "@/ui/components/resources/no-results";
import ResourcePage from "@/ui/components/resources/resource-page";
import {
  matchesQuery,
  normalizeQuery,
} from "@/ui/components/resources/search";
import SearchField from "@/ui/components/resources/search-field";
import {
  HELP_ARTICLES,
  HELP_ARTICLES_HERO,
} from "./resources-data";

/** Figma "Landing Page (Help Articles)". */
export default function HelpArticles() {
  const [
    query,
    setQuery,
  ] = useState("");
  const needle = normalizeQuery(query);
  const articles = HELP_ARTICLES.filter(article => matchesQuery(
    needle,
    article.title,
    article.topic,
    article.summary,
  ));

  return (
    <ResourcePage
      hero={HELP_ARTICLES_HERO}
      className="pt-20 pb-[39px]"
    >
      <SearchField
        value={query}
        onChange={setQuery}
        variant="outlined"
        label="Search help articles"
      />
      <div className="mt-[30px] max-w-[1070px]">
        {articles.length > 0
          ? <HelpArticleList articles={articles} />
          : <NoResults query={query} />}
      </div>
    </ResourcePage>
  );
}
