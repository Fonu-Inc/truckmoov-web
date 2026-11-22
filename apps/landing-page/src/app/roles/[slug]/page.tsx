import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RolePage } from "@/features/roles/page/RolePage";
import { getRoleContent } from "@/features/roles/utils/roleContent";
import { ROLE_SLUGS } from "@/features/roles/utils/roleSlugs";
import { pageMetadata } from "@/shared/seo/metadata";

export async function generateStaticParams() {
  return ROLE_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/roles/[slug]">) {
  const { slug } = await params;
  const content = getRoleContent(slug);
  if (!content)
    return {};
  return pageMetadata({
    title: content.hero.title,
    description: content.hero.description,
    path: `/roles/${slug}`,
  });
}

// Each slug is exported to its own HTML file; unknown slugs fall through to nginx's 404.
export default function Page({ params }: PageProps<"/roles/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <RoleRoute params={params} />
    </Suspense>
  );
}

async function RoleRoute({ params }: Pick<PageProps<"/roles/[slug]">, "params">) {
  const { slug } = await params;
  if (!getRoleContent(slug))
    notFound();
  return <RolePage slug={slug} />;
}
