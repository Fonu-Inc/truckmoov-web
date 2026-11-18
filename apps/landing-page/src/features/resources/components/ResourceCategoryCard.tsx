import type { ResourceCategoryView } from "@/features/resources/utils/resourceTypes";
import { DownloadButton } from "@/features/resources/components/DownloadButton";

type ResourceCategoryCardProps = { category: ResourceCategoryView };

/** Documentation category: icon + title + "Download All", then one row per document. */
export function ResourceCategoryCard({ category }: ResourceCategoryCardProps) {
  return (
    <article className="rounded-[30px] border border-border-soft pt-[18px] pr-[27px] pb-[19px] pl-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-[15px]">
          {category.icon}
          <h2 className="text-lead font-medium text-heading">
            {category.title}
          </h2>
        </div>
        <DownloadButton
          label="Download All"
          variant="outline"
          href={category.downloadAllHref}
          ariaLabel={`Download all ${category.title} documents`}
          className="relative top-[5px]"
        />
      </header>
      <ul className="mt-[30px] flex flex-col gap-[5px] pr-2.5 pl-[13px]">
        {category.docs.map(doc => (
          <li
            key={doc.title}
            className="flex min-h-[102px] items-start gap-4 border-b border-border pt-3 pb-[11px] last:border-b-0 max-sm:flex-col"
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-base leading-5 font-medium text-heading">
                {doc.title}
              </h3>
              <p className="mt-[7px] max-w-[342px] text-xs leading-[17px] text-subtle-foreground">
                {doc.description}
              </p>
            </div>
            <DownloadButton
              label="Download"
              href={doc.href}
              ariaLabel={`Download ${doc.title}`}
              className="sm:mt-[18px]"
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
