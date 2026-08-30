import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { getPostLoginRedirectPath } from "@/features/auth/utils/authRedirect";

/**
 * The `/` route. AuthGuard has already established the user is authenticated,
 * so this only has to resolve where "home" is for their role.
 */
export function RoleHomeRedirect() {
  const user = useAuthStore(s => s.user);

  return (
    <Navigate
      to={getPostLoginRedirectPath(user!.role)}
      replace
    />
  );
}
