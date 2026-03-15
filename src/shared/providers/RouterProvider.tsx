import { OrgProtectedRoute } from "@/components/layout/OrgProtectedRoute";
import { FeatureRoute, ProtectRoute } from "../routes/route-types";
import { buildPlatformRoutes } from "@/features/platform/application/routes";
import { buildBusinessRoutes } from "@/features/business/application/routes";
import { buildOwnerOperatorRoutes } from "@/features/owner-operator/application/routes";
import { buildTenantAdminRoutes } from "@/features/tenant-admin/application/routes";
import { buildSupervisorRoutes } from "@/features/supervisor/application/routes";
import { buildDriverRoutes } from "@/features/driver/application/routes";
import { buildSupportRoutes } from "@/features/support/application/routes";
import { buildDocumentationRoutes } from "@/features/docs/application/routes";
import { buildDebugRoutes } from "@/features/debug/application/routes";
import { useAuthStore } from "@/stores/authStore";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { buildCoreRoutes } from "@/features/core/application/routes";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { buildAppRoutes } from "../routes/routes";
import { getRoleDefaultRoute } from "../composables/getRoleDefaultRoute";

function renderRoute(route: FeatureRoute): JSX.Element {
  return (
    <Route key={route.path} path={route.path} element={route.element}>
      {route.children?.map(renderRoute)}
    </Route>
  );
}

export default function RouterProvider() {
  const { isAuthenticated, isAuthReady, user } = useAuthStore();
  const protect: ProtectRoute = (element) => <OrgProtectedRoute>{element}</OrgProtectedRoute>;


  const defaultRoute = !isAuthReady || !isAuthenticated
    ? APP_ROUTES.signIn
    : getRoleDefaultRoute(user.role);

  const routes: FeatureRoute[] = [
    ...buildAppRoutes(defaultRoute, isAuthenticated),
    ...buildPlatformRoutes(protect),
    ...buildBusinessRoutes(protect),
    ...buildOwnerOperatorRoutes(protect),
    ...buildTenantAdminRoutes(protect),
    ...buildSupervisorRoutes(protect),
    ...buildDriverRoutes(protect),
    ...buildSupportRoutes(protect),
    ...buildDocumentationRoutes(),
    ...buildDebugRoutes(),
    ...buildCoreRoutes(),
  ];
  return (
    <BrowserRouter>
      <Routes>
        {routes.map(renderRoute)}
      </Routes>
    </BrowserRouter>
  )
}
