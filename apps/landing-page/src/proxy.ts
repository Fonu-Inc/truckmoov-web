import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PRODUCT_SLUGS } from "@/features/products/utils/productSlugs";
import { ROLE_SLUGS } from "@/features/roles/utils/roleSlugs";
import { SOLUTION_SLUGS } from "@/features/solutions/utils/solutionSlugs";
import { STAKEHOLDER_SLUGS } from "@/features/stakeholders/utils/stakeholderSlugs";

/** Known slugs per templated route prefix. */
const SLUGS: Record<string, ReadonlySet<string>> = {
  product: new Set(PRODUCT_SLUGS),
  solutions: new Set(SOLUTION_SLUGS),
  stalkholder: new Set(STAKEHOLDER_SLUGS),
  roles: new Set(ROLE_SLUGS),
};

/** A path no route matches, so rendering it gives the root not-found page with a 404 status. */
const NOT_FOUND_PATH = "/__not-found";

/**
 * Dev-only 404 guard. In the static export, unknown slugs have no file under
 * `out/` and nginx answers 404 before this code would run. `next dev` still
 * renders dynamic params on demand, so rewrite unknown slugs to a path no
 * route matches.
 */
export function proxy(request: NextRequest) {
  const [
    , prefix,
    slug,
  ] = request.nextUrl.pathname.split("/");
  if (prefix && slug !== undefined && !SLUGS[prefix]?.has(slug)) {
    return NextResponse.rewrite(new URL(
      NOT_FOUND_PATH,
      request.url,
    ));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/product/:slug",
    "/solutions/:slug",
    "/stalkholder/:slug",
    "/roles/:slug",
  ],
};
