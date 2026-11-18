import { cacheLife } from "next/cache";
import { getRoleContent } from "@/features/roles/utils/roleContent";
import { StakeholderLayout } from "@/features/stakeholders/components/StakeholderLayout";

type RolePageProps = { slug: string };

/** Body of a /roles/<slug> page (same template as the stakeholder pages). The route validates the slug. */
export async function RolePage({ slug }: RolePageProps) {
  "use cache";
  cacheLife("max");

  const data = getRoleContent(slug);
  if (!data)
    return null;

  return <StakeholderLayout data={data} />;
}
