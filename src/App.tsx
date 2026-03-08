import React, { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { OrgProtectedRoute } from "./components/layout/OrgProtectedRoute";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import type { FeatureRoute, ProtectRoute } from "@/shared/routing/route-types";
import { buildAuthRoutes } from "@/features/auth/application/routes";
import { buildPlatformRoutes } from "@/features/platform/application/routes";
import { buildBusinessRoutes } from "@/features/business/application/routes";
import { buildOwnerOperatorRoutes } from "@/features/owner-operator/application/routes";
import { buildTenantAdminRoutes } from "@/features/tenant-admin/application/routes";
import { buildSupervisorRoutes } from "@/features/supervisor/application/routes";
import { buildDriverRoutes } from "@/features/driver/application/routes";
import { buildSupportRoutes } from "@/features/support/application/routes";
import { buildDocumentationRoutes } from "@/features/docs/application/routes";
import { buildDebugRoutes } from "@/features/debug/application/routes";
import { buildCoreRoutes } from "@/features/core/application/routes";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated, isAuthReady, user } = useAuthStore();

  useEffect(() => {
    void useAuthStore.getState().bootstrapFromSession();
  }, []);

  const defaultRoute = !isAuthReady
    ? "/auth"
    : isAuthenticated
      ? user?.role === "platform_admin"
        ? "/platform"
        : "/admin"
      : "/auth";

  // Centralized route protection keeps every feature route builder pure and framework-agnostic.
  const protect: ProtectRoute = (element) => <OrgProtectedRoute>{element}</OrgProtectedRoute>;

  const routes: FeatureRoute[] = [
    ...buildAuthRoutes(defaultRoute),
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <TenantBrandingProvider>
            <Sonner />
            <KeyboardShortcutsDialog />
            <FonuCallProvider>
              <BrowserRouter>
                <Routes>
                  {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Routes>
              </BrowserRouter>
            </FonuCallProvider>
          </TenantBrandingProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
