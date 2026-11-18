import type {
  BandClassNames,
  RoleKey,
  StakeholderHeadingSize,
} from "./stakeholder-types";
import { Link } from "react-router";
import {
  roleLinks,
  routes,
} from "@/lib/app-links";
import { cn } from "@/lib/utils";
import IconChip from "../icon-chip";
import StakeholderSection from "./stakeholder-section";

type RoleCardsProps = {
  roles: RoleKey[];
  headingSize: StakeholderHeadingSize;
  classNames?: BandClassNames;
};

/**
 * "Roles this stakeholder can invite" band — Figma: 78px tall cards that hug their label,
 * 45px tinted icon tile, 20px gap, each linking to that role's page.
 * The heading is the 30px `md` size on every frame; on `lg` pages (Enterprise) the band sits
 * at x=127 (1440+ only), eyebrow at +42, 52px title→cards, 46px bottom.
 */
export default function RoleCards({
  roles,
  headingSize,
  classNames,
}: RoleCardsProps) {
  const lg = headingSize === "lg";

  const links = roles.flatMap((key) => {
    const link = roleLinks.find(role => role.href === routes.roles[key]);
    return link ? [link] : [];
  });

  return (
    <StakeholderSection
      eyebrow="Enterprise roles"
      title="Roles this stakeholder can invite into their workspace."
      headingSize="md"
      className={cn(
        lg
          ? "pt-12 pb-12 lg:pt-[42px] lg:pb-[46px]"
          : "border-b border-border pt-12 pb-12 lg:pt-11 lg:pb-[105px]",
        classNames?.section,
      )}
      titleClassName={classNames?.title}
      containerClassName={cn(
        lg && "min-[1440px]:px-[23px]",
        classNames?.container,
      ) || undefined}
      contentClassName={cn(
        lg && "lg:mt-[52px]",
        classNames?.content,
      ) || undefined}
    >
      <ul className={cn(
        "flex flex-wrap gap-5",
        classNames?.grid,
      )}
      >
        {links.map(({
          title,
          href,
          icon,
        }) => (
          <li
            key={href}
            className="w-full sm:w-auto sm:min-w-64"
          >
            <Link
              to={href}
              className="flex h-[78px] items-center gap-[13px] rounded-[25px] border border-border-soft bg-card-ghost pr-5 pl-[25px] transition-shadow hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IconChip
                icon={icon}
                tone="tintDeep"
                className="[&_svg]:size-5"
              />
              <span className="text-base leading-6 font-medium text-heading">
                {title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </StakeholderSection>
  );
}
