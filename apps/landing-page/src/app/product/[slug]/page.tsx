import { notFound } from "next/navigation";
import { ProductPage } from "@/features/products/page/ProductPage";
import {
  getProductContent, PRODUCT_SLUGS,
} from "@/features/products/utils/productContent";
import { pageMetadata } from "@/shared/seo/metadata";

export async function generateStaticParams() {
  return PRODUCT_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const content = getProductContent(slug);
  if (!content)
    return {};
  return pageMetadata({
    title: content.hero.title,
    description: content.hero.description.join(" "),
    path: `/product/${slug}`,
  });
}

export default async function Page({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  if (!getProductContent(slug))
    notFound();
  return <ProductPage slug={slug} />;
}
