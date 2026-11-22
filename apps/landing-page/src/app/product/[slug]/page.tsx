import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductPage } from "@/features/products/page/ProductPage";
import { getProductContent } from "@/features/products/utils/productContent";
import { PRODUCT_SLUGS } from "@/features/products/utils/productSlugs";
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

// Each slug is exported to its own HTML file; unknown slugs fall through to nginx's 404.
export default function Page({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProductRoute params={params} />
    </Suspense>
  );
}

async function ProductRoute({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  if (!getProductContent(slug))
    notFound();
  return <ProductPage slug={slug} />;
}
