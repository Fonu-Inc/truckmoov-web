import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";

/**
 * Wraps a route (or a subtree) so URL-typing a page the current role can't see
 * lands on `/not-authorized` instead of rendering. Kept generic so both apps
 * can use it: the caller passes its own `useRole` hook (each app has its own
 * auth store), and its own role type is checked against `allow`.
 *
 * Without `children`, renders `<Outlet />` — the usual react-router shape when
 * a `RequireRole` sits as an element route above a `children` array.
 */
export function RequireRole<Role extends string>({
  allow, useRole, children,
}: {
  allow: readonly Role[];
  useRole: () => Role | undefined;
  children?: ReactNode;
}) {
  const role = useRole();
  if (!role || !allow.includes(role)) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }
  return children ?? <Outlet />;
}
