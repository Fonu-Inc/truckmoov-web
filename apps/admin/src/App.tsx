import React, { Component, ReactNode, useEffect } from "react";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setToken, clearToken } from "@/lib/backendApi";
import { useAuthStore } from "./stores/authStore";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
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

function PlatformAdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAuthReady } = useAuthStore();
  const location = useLocation();

  if (!isAuthReady) return null;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (user?.role !== "platform_admin") return <Navigate to="/not-authorized" replace />;

  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}

const App = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demoRole") === "platform_admin") {
      useAuthStore.getState().setRole("platform_admin");
      window.history.replaceState({}, "", window.location.pathname || "/");
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const demoRole = sessionStorage.getItem("fleetpro_demo_role");
      if (demoRole) return;

      if (session?.access_token) {
        setToken(session.access_token);
      } else if (_event === "SIGNED_OUT") {
        clearToken();
      }

      void useAuthStore.getState().bootstrapFromSession();
    });

    void useAuthStore.getState().bootstrapFromSession();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <PreferencesProvider>
            <TenantBrandingProvider>
              <Sonner />
              {/* <KeyboardShortcutsDialog /> */}
              <FonuCallProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/not-authorized" element={<NotAuthorized />} />
                    <Route path="/" element={<PlatformAdminRoute><PlatformDashboard /></PlatformAdminRoute>} />
                    <Route path="/tenants" element={<PlatformAdminRoute><PlatformTenants /></PlatformAdminRoute>} />
                    <Route path="/devices" element={<PlatformAdminRoute><PlatformDevices /></PlatformAdminRoute>} />
                    <Route path="/sims" element={<PlatformAdminRoute><PlatformSIMs /></PlatformAdminRoute>} />
                    <Route path="/data-bundles" element={<PlatformAdminRoute><PlatformDataBundles /></PlatformAdminRoute>} />
                    <Route path="/simulator" element={<PlatformAdminRoute><DeviceSimulator /></PlatformAdminRoute>} />
                    <Route path="/communications" element={<PlatformAdminRoute><PlatformCommunications /></PlatformAdminRoute>} />
                    <Route path="/messaging" element={<PlatformAdminRoute><PlatformMessagingCenter /></PlatformAdminRoute>} />
                    <Route path="/billing" element={<PlatformAdminRoute><PlatformBilling /></PlatformAdminRoute>} />
                    <Route path="/security" element={<PlatformAdminRoute><PlatformSecurity /></PlatformAdminRoute>} />
                    <Route path="/compliance-audit" element={<PlatformAdminRoute><PlatformComplianceAudit /></PlatformAdminRoute>} />
                    <Route path="/settings" element={<PlatformAdminRoute><PlatformSettings /></PlatformAdminRoute>} />
                    <Route path="/support" element={<PlatformAdminRoute><PlatformSupport /></PlatformAdminRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <GlobalSupportChat />
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



