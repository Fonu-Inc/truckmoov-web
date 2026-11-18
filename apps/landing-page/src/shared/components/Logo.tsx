import Image from "next/image";

type LogoProps = {
  alt?: string;
  className?: string;
  /** Preload it (above the fold: the header). */
  priority?: boolean;
};

/** FleetPro wordmark (Figma 210x77). */
export function Logo({
  alt = "FleetPro Enterprise",
  className,
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt={alt}
      width={210}
      height={77}
      preload={priority}
      className={className}
    />
  );
}
