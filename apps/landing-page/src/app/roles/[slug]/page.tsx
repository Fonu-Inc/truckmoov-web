import { notFound } from "next/navigation";
import { RolePage } from "@/features/roles/page/RolePage";
import {
  getRoleContent,
  ROLE_SLUGS,
} from "@/features/roles/utils/roleContent";
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

export default async function Page({ params }: PageProps<"/roles/[slug]">) {
  const { slug } = await params;
  if (!getRoleContent(slug))
    notFound();
  return <RolePage slug={slug} />;
}
