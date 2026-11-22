import { SolutionLayout } from "@/features/solutions/components/SolutionLayout";
import { getSolutionContent } from "@/features/solutions/utils/solutionContent";

type SolutionPageProps = { slug: string };

/** A /solutions/<slug> page. Takes only the slug so the cached output is keyed by it. */
export async function SolutionPage({ slug }: SolutionPageProps) {
  const content = getSolutionContent(slug);
  // The route calls notFound() for unknown slugs before rendering this.
  if (!content)
    return null;

  return <SolutionLayout data={content} />;
}
