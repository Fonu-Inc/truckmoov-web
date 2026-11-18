import Image from "next/image";
import { hero } from "@/features/home/utils/homeContent";
import { CtaButtons } from "@/shared/components/sections/CtaButtons";

/**
 * Home hero (Figma "Frame 8", 642px tall at 1440). The photo is stretched over a
 * 1440x840 box that starts 152px above the hero, darkened by the "Rectangle 6" overlay.
 * The white <ContentSheet> overlaps its bottom 60px.
 */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink-gradient pt-16 pb-[124px] lg:pt-[89px] lg:pb-[131px]">
      {/* LCP image: preloaded, served as AVIF/WebP by next/image. */}
      <div className="pointer-events-none absolute inset-0 lg:top-[-152px] lg:left-[3px] lg:h-[840px] lg:w-[calc(100%-3px)]">
        <Image
          src={hero.image}
          alt=""
          aria-hidden="true"
          fill
          preload
          sizes="100vw"
          className="object-cover lg:object-fill"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ink)_60%,transparent)_17%,color-mix(in_srgb,var(--ink-800)_30%,transparent)_36%,transparent_61%,transparent_88%,color-mix(in_srgb,var(--ink)_50%,transparent)_100%)] lg:top-[-4px] lg:bottom-auto lg:h-[603px]"
      />
      <div className="page-container relative">
        <div className="max-w-[664px] xl:-ml-[3px]">
          <h1 className="max-w-[583px] text-4xl max-md:leading-tight font-bold text-on-ink md:text-display">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-[538px] text-lg leading-[25px] text-on-ink-muted md:text-lead">
            {hero.description}
          </p>
          <CtaButtons className="mt-[31px]" />
          <ul className="mt-[31px] flex flex-wrap gap-x-[15px] gap-y-3">
            {hero.highlights.map(highlight => (
              <li
                key={highlight}
                className="flex items-center gap-1 text-sm leading-[14px] text-on-ink"
              >
                <span
                  aria-hidden="true"
                  className="size-[9px] shrink-0 rounded-full bg-brand shadow-button"
                />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
