import { useState } from "react";
import NoResults from "@/ui/components/resources/no-results";
import ResourceCategoryCard from "@/ui/components/resources/resource-category-card";
import ResourcePage from "@/ui/components/resources/resource-page";
import {
  matchesQuery,
  normalizeQuery,
} from "@/ui/components/resources/search";
import SearchField from "@/ui/components/resources/search-field";
import {
  DOC_CATEGORIES,
  DOCUMENTATION_HERO,
} from "./resources-data";

/** Figma "Landing Page (EDocumentation)". */
export default function Documentation() {
  const [
    query,
    setQuery,
  ] = useState("");
  const needle = normalizeQuery(query);

  // A category-title match keeps the whole card; otherwise only matching documents.
  const categories = DOC_CATEGORIES
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
    <ResourcePage
      hero={DOCUMENTATION_HERO}
      className="pt-[60px] pb-[60px]"
    >
      <SearchField
        value={query}
        onChange={setQuery}
        label="Search documentation"
      />
      <div className="mt-7 grid grid-cols-1 gap-[30px] lg:grid-cols-2 lg:gap-x-[34px]">
        {categories.map(category => (
          <ResourceCategoryCard
            key={category.title}
            category={category}
          />
        ))}
      </div>
      {categories.length === 0 && <NoResults query={query} />}
    </ResourcePage>
  );
}
