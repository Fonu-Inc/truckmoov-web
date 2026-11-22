import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SolutionPage } from "@/features/solutions/page/SolutionPage";
import { getSolutionContent } from "@/features/solutions/utils/solutionContent";
import { SOLUTION_SLUGS } from "@/features/solutions/utils/solutionSlugs";
import { pageMetadata } from "@/shared/seo/metadata";

export async function generateStaticParams() {
  return SOLUTION_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const content = getSolutionContent(slug);
  if (!content)
    return {};
  return pageMetadata({
    title: content.hero.title,
    description: content.hero.description.replaceAll(
      "\n",
      " ",
    ),
    path: `/solutions/${slug}`,
  });
}

// Each slug is exported to its own HTML file; unknown slugs fall through to nginx's 404.
export default function Page({ params }: PageProps<"/solutions/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SolutionRoute params={params} />
    </Suspense>
  );
}

async function SolutionRoute({ params }: Pick<PageProps<"/solutions/[slug]">, "params">) {
  const { slug } = await params;
  if (!getSolutionContent(slug))
    notFound();
  return <SolutionPage slug={slug} />;
}
