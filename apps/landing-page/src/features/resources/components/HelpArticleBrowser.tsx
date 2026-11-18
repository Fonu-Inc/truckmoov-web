"use client";

import type { HelpArticle } from "@/features/resources/utils/resourceTypes";
import { useState } from "react";
import { HelpArticleList } from "@/features/resources/components/HelpArticleList";
import { NoResults } from "@/features/resources/components/NoResults";
import { SearchField } from "@/features/resources/components/SearchField";
import {
  matchesQuery,
  normalizeQuery,
} from "@/features/resources/utils/search";

type HelpArticleBrowserProps = { articles: HelpArticle[] };

/** Search field + filtered article accordion: the only client island on the Help Articles page. */
export function HelpArticleBrowser({ articles }: HelpArticleBrowserProps) {
  const [
    query,
    setQuery,
  ] = useState("");
  const needle = normalizeQuery(query);
  const visible = articles.filter(article => matchesQuery(
    needle,
    article.title,
    article.topic,
    article.summary,
  ));

  return (
    <>
      <SearchField
        onChange={setQuery}
        variant="outlined"
        label="Search help articles"
      />
      <div className="mt-[30px] max-w-[1070px]">
        {visible.length > 0
          ? <HelpArticleList articles={visible} />
          : <NoResults query={query} />}
      </div>
    </>
  );
}
