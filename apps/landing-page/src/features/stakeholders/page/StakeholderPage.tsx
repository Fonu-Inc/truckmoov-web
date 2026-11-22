import { StakeholderLayout } from "@/features/stakeholders/components/StakeholderLayout";
import { getStakeholderContent } from "@/features/stakeholders/utils/stakeholderContent";

type StakeholderPageProps = { slug: string };

/** Body of a /stalkholder/<slug> page. The route validates the slug before rendering this. */
export async function StakeholderPage({ slug }: StakeholderPageProps) {
  const data = getStakeholderContent(slug);
  if (!data)
    return null;

  return <StakeholderLayout data={data} />;
}
