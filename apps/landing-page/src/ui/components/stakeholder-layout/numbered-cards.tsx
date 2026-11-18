import type {
  BandClassNames,
  StakeholderHeadingSize,
} from "./stakeholder-types";
import { cn } from "@/lib/utils";
import StakeholderSection from "./stakeholder-section";

const VARIANTS = {
  /**
   * "Key responsibilities" (stakeholder / role pages) — Figma: 538px tall, 386x87 cards,
   * 31px column / 20px row gap, number tile centred on the text.
   */
  responsibilities: {
    eyebrow: "Key responsibilities",
    title: "What this role is accountable for day-to-day.",
    section: "pt-12 pb-12 lg:min-h-[538px] lg:pt-20 lg:pb-[75px]",
    titleMd: "md:max-w-[432px]",
    titleLg: undefined,
    container: "",
    content: "",
    grid: "lg:gap-x-[31px]",
    card: "min-h-[87px] items-center",
    text: "lg:max-w-[257px]",
  },
  /**
   * "Use cases" (solution pages) — Figma: 464px band, 385px cards from x=100 (20px left of the
   * column, nudged at 1440 only), 32px gap, min 90px tall, number tile top-aligned, 62px title→cards.
   */
  useCases: {
    eyebrow: "Use cases",
    title: "What This Role Is Accountable For Day-To-Day.",
    section: "pt-12 pb-12 lg:min-h-[464px] lg:pt-20 lg:pb-[50px]",
    titleMd: "md:max-w-[760px]",
    titleLg: "md:max-w-[760px]",
    container: "min-[1440px]:-translate-x-5",
    content: "lg:mt-[62px] min-[1440px]:-mr-5",
    grid: "lg:gap-x-8",
    card: "min-h-[90px] items-start pr-5 pb-[17px]",
    text: "lg:max-w-[270px]",
  },
} as const;

type NumberedCardsProps = {
  items: string[];
  headingSize: StakeholderHeadingSize;
  /** Copy and spacing preset; defaults to the stakeholder "Key responsibilities" band. */
  variant?: keyof typeof VARIANTS;
  /** Optional per-page overrides, merged after the variant's classes. */
  classNames?: BandClassNames;
};

/** Band of "01 …" cards, 3 per row, each led by a 45px tinted number tile. */
export default function NumberedCards({
  items,
  headingSize,
  variant = "responsibilities",
  classNames,
}: NumberedCardsProps) {
  const config = VARIANTS[variant];

  return (
    <StakeholderSection
      eyebrow={config.eyebrow}
      title={config.title}
      headingSize={headingSize}
      className={cn(
        config.section,
        classNames?.section,
      )}
      titleClassName={cn(
        headingSize === "md" ? config.titleMd : config.titleLg,
        classNames?.title,
      ) || undefined}
      containerClassName={cn(
        config.container,
        classNames?.container,
      ) || undefined}
      contentClassName={cn(
        config.content,
        classNames?.content,
      ) || undefined}
    >
      <ol className={cn(
        "grid gap-5 md:grid-cols-2 lg:grid-cols-3",
        config.grid,
        classNames?.grid,
      )}
      >
        {items.map((item, index) => (
          <li
            key={item}
            className={cn(
              "flex gap-5 rounded-[25px] border border-border-soft bg-card-ghost px-[30px] py-5",
              config.card,
            )}
          >
            <span
              aria-hidden="true"
              className="inline-flex size-[45px] shrink-0 items-center justify-center rounded-xl bg-brand-tint text-2xl leading-9 font-bold text-brand-deep"
            >
              {String(index + 1).padStart(
                2,
                "0",
              )}
            </span>
            <p className={cn(
              "text-base leading-6 font-medium text-heading",
              config.text,
            )}
            >
              {item}
            </p>
          </li>
        ))}
      </ol>
    </StakeholderSection>
  );
}
