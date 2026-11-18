import { notFound } from "next/navigation";
import { SolutionPage } from "@/features/solutions/page/SolutionPage";
import {
  getSolutionContent, SOLUTION_SLUGS,
} from "@/features/solutions/utils/solutionContent";
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

export default async function Page({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  if (!getSolutionContent(slug))
    notFound();
  return <SolutionPage slug={slug} />;
}
