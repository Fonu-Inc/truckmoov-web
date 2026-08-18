import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import React, { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import { ThemeProvider } from "./components/ThemeProvider";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import AuthPage from "./pages/AuthPage";
import NotAuthorized from "./pages/NotAuthorized";
import NotFound from "./pages/NotFound";
import DeviceSimulator from "./pages/platform/DeviceSimulator";
import PlatformBilling from "./pages/platform/PlatformBilling";
import PlatformCommunications from "./pages/platform/PlatformCommunications";
import PlatformComplianceAudit from "./pages/platform/PlatformComplianceAudit";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformDataBundles from "./pages/platform/PlatformDataBundles";
import PlatformDevices from "./pages/platform/PlatformDevices";
import PlatformMessagingCenter from "./pages/platform/PlatformMessagingCenter";
import PlatformSecurity from "./pages/platform/PlatformSecurity";
import PlatformSettings from "./pages/platform/PlatformSettings";
import PlatformSIMs from "./pages/platform/PlatformSIMs";
import PlatformSupport from "./pages/platform/PlatformSupport";
import PlatformTenants from "./pages/platform/PlatformTenants";
import { useAuthStore } from "./stores/authStore";

function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const {
    isAuthenticated,
    isAuthReady,
  } = useAuthStore();

  if (!isAuthReady) {
    return null;
  }

  if (isAuthenticated && location.pathname === "/auth") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (!isAuthenticated && location.pathname !== "/auth") {
    return (
      <Navigate
        to="/auth"
        replace
      />
    );
  }

  return <>{children}</>;
}

function AuthenticatedSupportChat() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return isAuthenticated ? <GlobalSupportChat /> : null;
}

function App() {
  useEffect(
    () => {
      void useAuthStore.getState().bootstrapFromSession();
    },
    [],
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <PreferencesProvider>
            <TenantBrandingProvider>
              <Sonner />
              <FonuCallProvider>
                <BrowserRouter>
                  <AuthGate>
                    <ErrorBoundary>
                      <Routes>
                        <Route
                          path="/auth"
                          element={<AuthPage />}
                        />
                        <Route
                          path="/not-authorized"
                          element={<NotAuthorized />}
                        />
                        <Route
                          path="/"
                          element={<PlatformDashboard />}
                        />
                        <Route
                          path="/tenants"
                          element={<PlatformTenants />}
                        />
                        <Route
                          path="/devices"
                          element={<PlatformDevices />}
                        />
                        <Route
                          path="/sims"
                          element={<PlatformSIMs />}
                        />
                        <Route
                          path="/data-bundles"
                          element={<PlatformDataBundles />}
                        />
                        <Route
                          path="/simulator"
                          element={<DeviceSimulator />}
                        />
                        <Route
                          path="/communications"
                          element={<PlatformCommunications />}
                        />
                        <Route
                          path="/messaging"
                          element={<PlatformMessagingCenter />}
                        />
                        <Route
                          path="/billing"
                          element={<PlatformBilling />}
                        />
                        <Route
                          path="/security"
                          element={<PlatformSecurity />}
                        />
                        <Route
                          path="/compliance-audit"
                          element={<PlatformComplianceAudit />}
                        />
                        <Route
                          path="/settings"
                          element={<PlatformSettings />}
                        />
                        <Route
                          path="/support"
                          element={<PlatformSupport />}
                        />
                        <Route
                          path="*"
                          element={<NotFound />}
                        />
                      </Routes>
                    </ErrorBoundary>
                    <AuthenticatedSupportChat />
                  </AuthGate>
                </BrowserRouter>
              </FonuCallProvider>
            </TenantBrandingProvider>
          </PreferencesProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
