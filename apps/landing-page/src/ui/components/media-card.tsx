import type { ReactNode } from "react";
import type { IconType } from "@/lib/app-links";
import { cn } from "@/lib/utils";
import IconChip from "./icon-chip";

type MediaCardProps = {
  image: string;
  imageAlt?: string;
  icon?: IconType;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

/** Photo-topped card with an overlapping white icon circle (home "Industry use cases"). */
export default function MediaCard({
  image,
  imageAlt = "",
  icon,
  title,
  description,
  className,
}: MediaCardProps) {
  return (
    <article className={cn(
      "relative flex flex-col rounded-[30px] shadow-card",
      className,
    )}
    >
      <img
        src={image}
        alt={imageAlt}
        width={375}
        height={250}
        loading="lazy"
        className="h-[250px] w-full rounded-t-[30px] object-cover"
      />
      {icon && (
        <IconChip
          icon={icon}
          size="media"
          tone="white"
          className="absolute top-[211px] left-9"
        />
      )}
      <div className="-mt-2 flex min-h-[184px] flex-1 flex-col rounded-b-[30px] border border-border-soft bg-card-ghost px-[30px] pt-[54px] pb-6">
        <h3 className="min-h-[27px] text-base leading-6 font-medium text-heading">{title}</h3>
        {description && (
          <p className="mt-[5px] text-xs leading-[18px] text-muted-foreground">{description}</p>
        )}
      </div>
    </article>
  );
}
