import Image from "next/image";

type LogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export default function Logo({
  width = 210,
  height = 77,
  className,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Truckmoov"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
