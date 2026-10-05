import type React from "react";
import {
  lazy, Suspense,
} from "react";
import { RequirePermission } from "@/shared/components/RequirePermission";
import { permissionForPath } from "@/shared/lib/routePermissions";

type LazyImporter = () => Promise<{ default: React.ComponentType<unknown> }>;
type NamedLazyImporter<K extends string> = () => Promise<Record<K, React.ComponentType<unknown>>>;

const pageLoading = (
  <div
    className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
    aria-busy="true"
  >
    Loading…
  </div>
);

/**
 * Permission-gated route component for a lazily loaded page.
 *
 * The decision is made on every render by RequirePermission (capabilities
 * from /auth/capabilities), never inside the router's `lazy`: React Router
 * runs `lazy` once per route and caches its result, so a decision baked in
 * there would outlive the session it was made for (a denial made while
 * signed out, or for a previous user, would stick until a full reload).
 *
 * The page chunk is a React.lazy component that only mounts after the grant
 * is confirmed, so it is still not fetched for a caller who lacks it.
 * Server APIs remain the real authorization boundary.
 */
export function permissionGuardedPage(path: string, importer: LazyImporter): React.ComponentType {
  const permission = permissionForPath(path);
  const Page = lazy(importer);
  return function PermissionGuardedPage() {
    return (
      <RequirePermission permission={permission}>
        <Suspense fallback={pageLoading}>
          <Page />
        </Suspense>
      </RequirePermission>
    );
  };
}

/** Route `lazy` for a default-export page. */
export function guardedByPermission(path: string, importer: LazyImporter) {
  const Component = permissionGuardedPage(
    path,
    importer,
  );
  return async () => ({ Component });
}

/** Route `lazy` for a named-export page. */
export function guardedByPermissionNamed<K extends string>(path: string, importer: NamedLazyImporter<K>, key: K) {
  return guardedByPermission(
    path,
    async () => ({ default: (await importer())[key] }),
  );
}
