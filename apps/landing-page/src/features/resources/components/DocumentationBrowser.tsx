"use client";

import type { ResourceCategoryView } from "@/features/resources/utils/resourceTypes";
import { useState } from "react";
import { NoResults } from "@/features/resources/components/NoResults";
import { ResourceCategoryCard } from "@/features/resources/components/ResourceCategoryCard";
import { SearchField } from "@/features/resources/components/SearchField";
import {
  matchesQuery,
  normalizeQuery,
} from "@/features/resources/utils/search";

type DocumentationBrowserProps = { categories: ResourceCategoryView[] };

/** Search field + filtered category cards: the only client island on the Documentation page. */
export function DocumentationBrowser({ categories }: DocumentationBrowserProps) {
  const [
    query,
    setQuery,
  ] = useState("");
  const needle = normalizeQuery(query);

  // A category-title match keeps the whole card; otherwise only matching documents.
  const visible = categories
    .map(category => (matchesQuery(
      needle,
      category.title,
    )
      ? category
      : {
          ...category,
          docs: category.docs.filter(doc => matchesQuery(
            needle,
            doc.title,
            doc.description,
          )),
        }))
    .filter(category => category.docs.length > 0);

  return (
    <>
      <SearchField
        onChange={setQuery}
        label="Search documentation"
      />
      <div className="mt-7 grid grid-cols-1 gap-[30px] lg:grid-cols-2 lg:gap-x-[34px]">
        {visible.map(category => (
          <ResourceCategoryCard
            key={category.title}
            category={category}
          />
        ))}
      </div>
      {visible.length === 0 && <NoResults query={query} />}
    </>
  );
}
