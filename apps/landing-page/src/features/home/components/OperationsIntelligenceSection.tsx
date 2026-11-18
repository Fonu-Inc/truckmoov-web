import { operationsIntelligence } from "@/features/home/utils/homeContent";
import { DarkBackdrop } from "@/shared/components/DarkBackdrop";

/**
 * "How Businesses and operations Think" — a 1286x564 black panel with 100px radius
 * (Figma "Frame 1160464627", 688px tall at 1440).
 */
export function OperationsIntelligenceSection() {
  return (
    <section className="px-4 py-10 lg:px-[77px] lg:py-[62px]">
      <div className="relative mx-auto max-w-[1286px] overflow-hidden rounded-[40px] bg-ink px-6 py-14 shadow-button sm:px-12 lg:min-h-[564px] lg:rounded-[100px] lg:pt-[78px] lg:pr-[100px] lg:pb-[78px] lg:pl-[122px]">
        <DarkBackdrop fill="solid" />
        <div className="relative">
          <h2 className="max-w-[840px] text-3xl max-md:leading-tight font-semibold text-on-ink capitalize md:text-heading-md">
            {operationsIntelligence.title}
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-[63px] lg:grid-cols-4 lg:gap-x-[50px] xl:grid-cols-[215px_206px_268px_224px]">
            {operationsIntelligence.items.map(({
              title,
              description,
              icon: Icon,
            }) => (
              <li
                key={title}
                className="flex flex-col gap-5"
              >
                <span
                  aria-hidden="true"
                  className="text-primary [&_svg]:size-[60px]"
                >
                  <Icon />
                </span>
                <div>
                  <h3 className="text-subtitle font-semibold text-on-ink">
                    {title}
                  </h3>
                  <p className="mt-2.5 text-base leading-6 text-on-ink">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
