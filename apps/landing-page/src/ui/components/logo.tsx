import type { ComponentProps } from "react";

type LogoProps = Omit<ComponentProps<"img">, "src" | "alt"> & { alt?: string };

export default function Logo({
  alt = "TruckMoov Logo",
  width = 210,
  height = 77,
  ...props
}: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={width}
      height={height}
      {...props}
    />
  );
}
