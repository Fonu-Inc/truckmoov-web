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
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { buildCoreRoutes } from "@/features/core/application/routes";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { buildAppRoutes } from "../routes/routes";
import { useMemo } from "react";
import { getRoleDefaultRoute } from "../composables/getRoleDefaultRoute";

function renderRoute(route: FeatureRoute): JSX.Element {
  return (
    <Route key={route.path} {...route}>
      {route.children?.map(renderRoute)}
    </Route>
  );
}

function AppRoutes() {
  const { isAuthenticated, isAuthReady, user } = useAuthStore();
  const { pathname } = useLocation();
  const protect: ProtectRoute = (element) => <OrgProtectedRoute>{element}</OrgProtectedRoute>;
  const demoProtect: ProtectRoute = (element) => element;

  const routes = useMemo(() => [
    ...buildAppRoutes(),
    ...buildPlatformRoutes(demoProtect),
    ...buildBusinessRoutes(demoProtect),
    ...buildOwnerOperatorRoutes(demoProtect),
    ...buildTenantAdminRoutes(demoProtect),
    ...buildSupervisorRoutes(demoProtect),
    ...buildDriverRoutes(demoProtect),
    ...buildSupportRoutes(demoProtect),
    ...buildDocumentationRoutes(),
    ...buildDebugRoutes(),
    ...buildCoreRoutes(),
  ], []);

  if (isAuthReady && !isAuthenticated && !pathname.startsWith("/auth") && !pathname.startsWith("/demo")) {
    return <Navigate to={APP_ROUTES.signIn} replace />;
  }

  if (isAuthReady && isAuthenticated && pathname === APP_ROUTES.main) {
    return <Navigate to={getRoleDefaultRoute(user?.role)} replace />;
  }

  return (
    <Routes>
      {routes.map(renderRoute)}
    </Routes>
  );
}

export default function RouterProvider() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
