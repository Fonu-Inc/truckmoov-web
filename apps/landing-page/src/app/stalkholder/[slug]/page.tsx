import { notFound } from "next/navigation";
import { StakeholderPage } from "@/features/stakeholders/page/StakeholderPage";
import {
  getStakeholderContent,
  STAKEHOLDER_SLUGS,
} from "@/features/stakeholders/utils/stakeholderContent";
import { pageMetadata } from "@/shared/seo/metadata";

export async function generateStaticParams() {
  return STAKEHOLDER_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/stalkholder/[slug]">) {
  const { slug } = await params;
  const content = getStakeholderContent(slug);
  if (!content)
    return {};
  return pageMetadata({
    title: content.hero.title,
    description: content.hero.description,
    path: `/stalkholder/${slug}`,
  });
}

export default async function Page({ params }: PageProps<"/stalkholder/[slug]">) {
  const { slug } = await params;
  if (!getStakeholderContent(slug))
    notFound();
  return <StakeholderPage slug={slug} />;
}
