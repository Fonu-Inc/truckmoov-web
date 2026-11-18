import type {
  AppLink,
  AppLinkGroup,
} from "@/shared/utils/routes";
import Link from "next/link";
import { IconChip } from "@/shared/components/IconChip";

type MegaMenuProps = { group: AppLinkGroup };

type Section = AppLinkGroup["sections"][number];

/** One menu entry: 32px icon tile, 12px gap, title + description (Figma NavBar variants). */
function MenuItem({ link }: { link: AppLink }) {
  return (
    <Link
      href={link.href}
      className="group/item flex shrink-0 items-start gap-3 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <IconChip
        icon={link.icon}
        size="sm"
        tone="tint"
      />
      <span
        className="flex flex-col gap-[3px] pt-[3px]"
        style={link.menuTextWidth ? { width: link.menuTextWidth } : undefined}
      >
        <span className="text-[13px] leading-[13px] font-medium whitespace-nowrap text-foreground group-hover/item:text-brand-deep">
          {link.title}
        </span>
        <span className="text-2xs leading-[14px] text-subtle-foreground">
          {link.description}
        </span>
      </span>
    </Link>
  );
}

/** Links laid out as Figma draws them: an even grid (`columns`) or explicit rows (`rowSizes`). */
function SectionLinks({ section }: { section: Section }) {
  if (section.columns) {
    return (
      <div
        className="grid gap-y-[30px]"
        style={{ gridTemplateColumns: section.columns }}
      >
        {section.links.map(link => (
          <MenuItem
            key={link.href}
            link={link}
          />
        ))}
      </div>
    );
  }

  const rowSizes = section.rowSizes ?? [section.links.length];
  let start = 0;
  return (
    <div className="flex flex-col gap-4">
      {rowSizes.map((size, row) => {
        const links = section.links.slice(
          start,
          start + size,
        );
        start += size;
        return (
          <div
            key={links[0].href}
            className="flex"
            style={{ columnGap: section.rowGaps?.[row] ?? 20 }}
          >
            {links.map(link => (
              <MenuItem
                key={link.href}
                link={link}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Dropdown panel under the nav bar (Figma NavBar variants 2–7). Server-rendered, opened with CSS. */
export function MegaMenu({ group }: MegaMenuProps) {
  return (
    <div
      className="page-container flex gap-[50px] pt-[30px] lg:pl-[29px]"
      style={{ height: group.menuHeight }}
    >
      {group.sections.map(section => (
        <div
          key={section.label}
          className="flex shrink-0 flex-col gap-[30px]"
          style={section.width ? { width: section.width } : { flex: 1 }}
        >
          <p className="text-2xs leading-[10px] font-medium text-subtle-foreground uppercase">
            {section.label}
          </p>
          <SectionLinks section={section} />
        </div>
      ))}
    </div>
  );
}
