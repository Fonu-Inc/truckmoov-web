import React, { Component, ReactNode, useEffect } from "react";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import AuthPage from "./pages/AuthPage";
import NotAuthorized from "./pages/NotAuthorized";
import NotFound from "./pages/NotFound";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformDevices from "./pages/platform/PlatformDevices";
import PlatformSettings from "./pages/platform/PlatformSettings";
import DeviceSimulator from "./pages/platform/DeviceSimulator";
import PlatformTenants from "./pages/platform/PlatformTenants";
import PlatformSIMs from "./pages/platform/PlatformSIMs";
import PlatformDataBundles from "./pages/platform/PlatformDataBundles";
import PlatformBilling from "./pages/platform/PlatformBilling";
import PlatformSecurity from "./pages/platform/PlatformSecurity";
import PlatformComplianceAudit from "./pages/platform/PlatformComplianceAudit";
import PlatformCommunications from "./pages/platform/PlatformCommunications";
import PlatformMessagingCenter from "./pages/platform/PlatformMessagingCenter";
import PlatformSupport from "./pages/platform/PlatformSupport";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Admin app route failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The admin route failed to render. Refresh the page or choose another admin section.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isAuthReady } = useAuthStore();

  if (!isAuthReady) {
    return null;
  }

  if (isAuthenticated && location.pathname === "/auth") {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated && location.pathname !== "/auth") {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedSupportChat() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return isAuthenticated ? <GlobalSupportChat /> : null;
}

const App = () => {
  useEffect(() => {
    void useAuthStore.getState().bootstrapFromSession();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <PreferencesProvider>
            <TenantBrandingProvider>
              <Sonner />
              <FonuCallProvider>
                <BrowserRouter>
                  <AuthGate>
                    <AppErrorBoundary>
                      <Routes>
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/not-authorized" element={<NotAuthorized />} />
                        <Route path="/" element={<PlatformDashboard />} />
                        <Route path="/tenants" element={<PlatformTenants />} />
                        <Route path="/devices" element={<PlatformDevices />} />
                        <Route path="/sims" element={<PlatformSIMs />} />
                        <Route path="/data-bundles" element={<PlatformDataBundles />} />
                        <Route path="/simulator" element={<DeviceSimulator />} />
                        <Route path="/communications" element={<PlatformCommunications />} />
                        <Route path="/messaging" element={<PlatformMessagingCenter />} />
                        <Route path="/billing" element={<PlatformBilling />} />
                        <Route path="/security" element={<PlatformSecurity />} />
                        <Route path="/compliance-audit" element={<PlatformComplianceAudit />} />
                        <Route path="/settings" element={<PlatformSettings />} />
                        <Route path="/support" element={<PlatformSupport />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppErrorBoundary>
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
};

export default App;
