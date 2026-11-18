import { cacheLife } from "next/cache";
import { ProductLayout } from "@/features/products/components/ProductLayout";
import { getProductContent } from "@/features/products/utils/productContent";

type ProductPageProps = { slug: string };

/** A /product/<slug> page. Takes only the slug so the cached output is keyed by it. */
export async function ProductPage({ slug }: ProductPageProps) {
  "use cache";
  cacheLife("max");

  const content = getProductContent(slug);
  // The route calls notFound() for unknown slugs before rendering this.
  if (!content)
    return null;

  return <ProductLayout data={content} />;
}
