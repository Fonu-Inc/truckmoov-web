import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StakeholderPage } from "@/features/stakeholders/page/StakeholderPage";
import { getStakeholderContent } from "@/features/stakeholders/utils/stakeholderContent";
import { STAKEHOLDER_SLUGS } from "@/features/stakeholders/utils/stakeholderSlugs";
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

// Each slug is exported to its own HTML file; unknown slugs fall through to nginx's 404.
export default function Page({ params }: PageProps<"/stalkholder/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <StakeholderRoute params={params} />
    </Suspense>
  );
}

async function StakeholderRoute({ params }: Pick<PageProps<"/stalkholder/[slug]">, "params">) {
  const { slug } = await params;
  if (!getStakeholderContent(slug))
    notFound();
  return <StakeholderPage slug={slug} />;
}
