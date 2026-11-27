import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { AuthGuard } from "@/features/auth/components/providers/AuthGuard";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import { ThemeProvider } from "./components/ThemeProvider";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { BrandingProvider } from "./features/settings/branding/BrandingProvider";

/**
 * Root layout route (pathless). Owns the provider tower and the auth gate;
 * the route table lives in shared/lib/route.tsx.
 */
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
            <BrandingProvider>
              <Sonner />
              <AuthGuard>
                <ErrorBoundary variant="page">
                  <Outlet />
                </ErrorBoundary>
                <GlobalSupportChat />
              </AuthGuard>
            </BrandingProvider>
          </PreferencesProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
