import type { FaqCategory } from "@/features/resources/utils/resourceTypes";
import { IconChip } from "@/shared/components/IconChip";
import { FaqAccordion } from "@/shared/components/sections/FaqAccordion";

type FaqCategorySectionProps = { category: FaqCategory };

/** FAQ group: icon + category title, then its questions as accordions (all closed). */
export function FaqCategorySection({ category }: FaqCategorySectionProps) {
  return (
    <section>
      <h2 className="flex items-center gap-5 text-lead font-medium text-heading">
        <IconChip icon={category.icon} />
        {category.title}
      </h2>
      <FaqAccordion
        items={category.items}
        defaultOpen={null}
        className="mt-[30px] gap-2.5"
      />
    </section>
  );
}
