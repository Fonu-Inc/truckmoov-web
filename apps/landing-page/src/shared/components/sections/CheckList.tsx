import type {
  BandClassNames,
  StakeholderHeadingSize,
} from "@/shared/components/sections/BandSection";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { BandSection } from "@/shared/components/sections/BandSection";
import { cn } from "@/shared/utils";

const VARIANTS = {
  /** "Role permissions" — grey band, yellow ✓, 20px gaps. */
  permissions: {
    eyebrow: "Role permissions",
    title: "Permissions granted to this role within the tenant workspace.",
    section: {
      md: "border-y border-border bg-surface pt-12 pb-12 lg:pt-11 lg:pb-[108px]",
      lg: "border-y border-border bg-surface pt-12 pb-12 lg:pt-11 lg:pb-[75px]",
    },
    titleLg: "md:max-w-[810px]",
    grid: "gap-5",
    container: "",
    content: "",
    mark: "check",
    srPrefix: "Allowed: ",
  },
  /** "Role limitations" — white band, red ✗, 40px column / 27px row gaps. */
  limitations: {
    eyebrow: "Role limitations",
    title: "Actions outside this role's authority.",
    section: {
      md: "border-b border-border pt-12 pb-12 lg:pt-11 lg:pb-[106px]",
      lg: "border-b border-border pt-12 pb-12 lg:pt-11 lg:pb-[46px]",
    },
    titleLg: "md:max-w-[649px]",
    grid: "gap-5 md:gap-x-10 md:gap-y-[27px]",
    container: "",
    content: "",
    mark: "cross",
    srPrefix: "Not allowed: ",
  },
  /** "Feature capabilities" (product pages) — white band, yellow ✓, 11px gaps, content x=138–1295, 12px eyebrow→title gap. */
  capabilities: {
    eyebrow: "Feature capabilities",
    title: "What Is Included In This Feature",
    section: {
      md: "pt-12 pb-12 lg:pt-[43px] lg:pb-[73px]",
      lg: "pt-12 pb-12 lg:pt-[43px] lg:pb-[73px]",
    },
    titleLg: "md:max-w-none lg:-mt-2",
    grid: "gap-[11px]",
    container: "lg:pr-[42px] lg:pl-[34px]",
    content: "lg:mt-[42px]",
    mark: "check",
    srPrefix: "",
  },
  /**
   * "Intelligence layer" (solution pages) — white band, yellow ✓, 572px cards with 21px gaps,
   * inset 7px (x=127); 10px eyebrow→title gap, 73px title→cards.
   */
  intelligence: {
    eyebrow: "Intelligence layer",
    title: "AI Baked Into The Workflow, Not Bolted On Top.",
    section: {
      md: "pt-12 pb-12 lg:pt-[41px] lg:pb-[30px]",
      lg: "pt-12 pb-12 lg:pt-[41px] lg:pb-[30px]",
    },
    titleLg: "lg:-mt-2.5",
    grid: "gap-5 md:gap-[21px]",
    container: "lg:pl-[23px]",
    content: "lg:mt-[73px] lg:max-w-[1165px]",
    mark: "check",
    srPrefix: "",
  },
} as const;

type CheckListProps = {
  variant: keyof typeof VARIANTS;
  items: string[];
  headingSize: StakeholderHeadingSize;
  /** Optional per-page overrides, merged after the variant's classes. */
  classNames?: BandClassNames;
};

/** Two-column list of 80px white cards, each led by a ✓ (permissions, capabilities) or ✗ (limitations). */
export function CheckList({
  variant,
  items,
  headingSize,
  classNames,
}: CheckListProps) {
  const config = VARIANTS[variant];

  return (
    <BandSection
      eyebrow={config.eyebrow}
      title={config.title}
      headingSize={headingSize}
      className={cn(
        config.section[headingSize],
        classNames?.section,
      )}
      titleClassName={cn(
        headingSize === "lg" && config.titleLg,
        classNames?.title,
      ) || undefined}
      contentClassName={cn(
        config.content,
        classNames?.content,
      )}
      containerClassName={cn(
        config.container,
        classNames?.container,
      )}
    >
      <ul className={cn(
        "grid md:grid-cols-2",
        config.grid,
        classNames?.grid,
      )}
      >
        {items.map(item => (
          <li
            key={item}
            className={cn(
              "flex min-h-20 items-center rounded-[25px] border border-border-soft bg-card px-[30px] py-4",
              config.mark === "check" ? "gap-5" : "gap-[22px]",
            )}
          >
            {config.mark === "check"
              ? (
                  <Check
                    aria-hidden="true"
                    className="size-[26px] shrink-0 text-brand-bright"
                  />
                )
              : (
                  <span
                    aria-hidden="true"
                    className="w-6 shrink-0 text-[40px] leading-none font-semibold text-destructive"
                  >
                    ✗
                  </span>
                )}
            <span className="text-base leading-6 font-medium text-heading">
              {config.srPrefix && (
                <span className="sr-only">{config.srPrefix}</span>
              )}
              {item}
            </span>
          </li>
        ))}
      </ul>
    </BandSection>
  );
}
