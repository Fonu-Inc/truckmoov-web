import type {
  AppLink,
  AppLinkGroup,
} from "@/lib/app-links";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import IconChip from "../icon-chip";

type MegaMenuProps = {
  group: AppLinkGroup;
  onNavigate: () => void;
};

function MenuItem({
  link,
  onNavigate,
  className,
}: {
  link: AppLink;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <Link
      to={link.href}
      onClick={onNavigate}
      className={cn(
        "group/item flex items-start gap-3 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <IconChip
        icon={link.icon}
        size="sm"
        tone="tint"
      />
      <span className="flex flex-col gap-[3px] pt-[3px]">
        <span className="text-[13px] leading-[13px] font-medium text-foreground group-hover/item:text-brand-deep">
          {link.title}
        </span>
        <span className="text-2xs leading-[14px] text-subtle-foreground">
          {link.description}
        </span>
      </span>
    </Link>
  );
}

/** Dropdown panel under the nav bar (Figma NavBar variants 2–7). */
export default function MegaMenu({
  group,
  onNavigate,
}: MegaMenuProps) {
  const isSplit = group.sections.length > 1;

  return (
    <div className="page-container flex gap-[50px] pt-[30px] pb-[34px] lg:pl-[47px]">
      {group.sections.map((section, index) => (
        <div
          key={section.label}
          className={cn(
            "flex flex-col gap-[30px]",
            isSplit && index === 0 && "w-[393px] shrink-0",
            !isSplit && "w-full",
          )}
        >
          <p className="text-2xs leading-[10px] font-medium text-subtle-foreground uppercase">
            {section.label}
          </p>
          <div className={cn(
            isSplit
              ? "flex flex-wrap gap-x-5 gap-y-4"
              : "grid grid-cols-3 gap-x-[100px] gap-y-[30px]",
          )}
          >
            {section.links.map(link => (
              <MenuItem
                key={link.href}
                link={link}
                onNavigate={onNavigate}
                className={isSplit ? "max-w-[194px]" : "max-w-[342px]"}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
