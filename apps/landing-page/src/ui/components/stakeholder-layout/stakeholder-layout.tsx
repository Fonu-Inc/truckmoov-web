import type {
  BandClassNames,
  StakeholderBand,
  StakeholderPageData,
} from "./stakeholder-types";
import { cn } from "@/lib/utils";
import ContentSheet from "../content-sheet";
import PageHero from "../page-hero";
import CheckList from "./check-list";
import NumberedCards from "./numbered-cards";
import RoleCards from "./role-cards";
import RoleDefinition from "./role-definition";

type StakeholderLayoutProps = { data: StakeholderPageData };

/**
 * Band geometry shared by every `lg` frame (Enterprise, Owner Operator and the seven role
 * pages). The Figma bands are not on the 1200 column: responsibilities sit at x=100 (1220 wide),
 * permissions at x=138 and limitations at x=127, so those insets apply at 1440+ only.
 * Bottom paddings default to the most common frame; pages override them via `data.bands`.
 */
const LG_BANDS: Partial<Record<StakeholderBand, BandClassNames>> = {
  responsibilities: {
    title: "md:max-w-[700px]",
    container: "min-[1440px]:-translate-x-5",
    content: "lg:mt-[62px] min-[1440px]:-mr-5",
    // Figma text boxes run to 15px from the card edge, so items keep their 2-line wraps.
    grid: "lg:gap-x-8 lg:[&_li]:py-[17.5px] lg:[&_li]:pr-5 lg:[&_p]:max-w-[268px]",
  },
  permissions: {
    section: "lg:pt-[42px] lg:pb-[87px]",
    title: "md:max-w-[720px] lg:-mt-2",
    container: "min-[1440px]:px-[34px]",
    content: "lg:mt-[58px]",
  },
  limitations: {
    section: "lg:border-b-0 lg:pt-[42px] lg:pb-[41px]",
    title: "md:max-w-[700px] lg:-mt-2",
    container: "min-[1440px]:px-[23px]",
    content: "lg:mt-[60px]",
  },
};

function mergeBand(
  ...parts: Array<BandClassNames | undefined>
): BandClassNames {
  const keys = [
    "section",
    "container",
    "title",
    "content",
    "grid",
  ] as const;
  return Object.fromEntries(keys.map(key => [
    key,
    cn(...parts.map(part => part?.[key])) || undefined,
  ]));
}

/**
 * Template for every stakeholder (/stalkholder/*) and role (/roles/*) page.
 * Pages pass one data object; a section renders only when its data is present.
 * The CTA band and footer come from the shared <Layout>.
 */
export default function StakeholderLayout({ data }: StakeholderLayoutProps) {
  const {
    headingSize = "md",
    hero,
    definition,
    responsibilities,
    permissions,
    limitations,
    invites,
    bands,
  } = data;
  const band = (key: StakeholderBand) => mergeBand(
    headingSize === "lg" ? LG_BANDS[key] : undefined,
    bands?.[key],
  );

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
        icon={hero.icon}
        // Figma: the sheet starts 350px below the nav whatever the description's line count.
        className="lg:h-[410px] lg:pb-0"
        descriptionClassName={cn(
          headingSize === "lg" && "lg:text-[20px]",
          hero.descriptionClassName,
        )}
      />
      <ContentSheet>
        {definition && (
          <RoleDefinition
            title={definition.title}
            body={definition.body}
            headingSize={headingSize}
            classNames={bands?.definition}
          />
        )}
        {responsibilities?.length
          ? (
              <NumberedCards
                items={responsibilities}
                headingSize={headingSize}
                classNames={band("responsibilities")}
              />
            )
          : null}
        {permissions?.length
          ? (
              <CheckList
                variant="permissions"
                items={permissions}
                headingSize={headingSize}
                classNames={band("permissions")}
              />
            )
          : null}
        {limitations?.length
          ? (
              <CheckList
                variant="limitations"
                items={limitations}
                headingSize={headingSize}
                classNames={band("limitations")}
              />
            )
          : null}
        {invites?.length
          ? (
              <RoleCards
                roles={invites}
                headingSize={headingSize}
                classNames={bands?.invites}
              />
            )
          : null}
      </ContentSheet>
    </>
  );
}
