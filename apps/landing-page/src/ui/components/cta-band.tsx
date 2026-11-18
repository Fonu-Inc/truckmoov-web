import CtaButtons from "./cta-buttons";
import DarkBackdrop from "./dark-backdrop";

/** "Ready to Optimize your fleet management?" dark band with the truck image, shown above the footer on every page. */
export default function CtaBand() {
  return (
    <section className="relative mt-[119px]">
      <div className="relative h-auto overflow-hidden bg-ink lg:h-[460px]">
        <DarkBackdrop
          glows={[
            { className: "-top-[240px] -left-[305px] h-[640px] w-[1028px]" },
            { className: "top-[244px] left-[880px] h-[540px] w-[650px]" },
          ]}
        />
        <div className="page-container relative py-16 lg:py-0 lg:pt-[65px]">
          <h2 className="max-w-[529px] text-4xl max-md:leading-tight font-bold text-on-ink md:text-display">
            Ready to Optimize your fleet management?
          </h2>
          <CtaButtons className="mt-[41px] lg:-ml-2" />
        </div>
      </div>
      <img
        src="/truck-image.png"
        alt=""
        aria-hidden="true"
        width={881}
        height={520}
        decoding="async"
        className="pointer-events-none absolute -top-[109px] left-[calc(50%-127px)] hidden h-[520px] w-[881px] max-w-none object-cover object-[center_41.5%] lg:block"
      />
      {/* Figma paints the map-pin hole dark over the photo (#363636 vector). */}
      <svg
        aria-hidden="true"
        viewBox="1218 5670 62 96"
        className="pointer-events-none absolute -top-px left-[calc(50%+498px)] hidden h-24 w-[62px] fill-ink-600 lg:block"
      >
        <path d="M1279.7 5711.52C1282.01 5744.97 1258.53 5764.3 1250.29 5765.15C1227.8 5767.46 1218 5747.26 1218 5723.05C1218 5705.18 1228.38 5670 1256.06 5670C1264.34 5670 1279.7 5687.32 1279.7 5711.52Z" />
      </svg>
    </section>
  );
}
