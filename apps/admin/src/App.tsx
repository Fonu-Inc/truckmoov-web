import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { AuthGuard } from "@/features/auth/components/providers/AuthGuard";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import { ThemeProvider } from "./components/ThemeProvider";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { useAuthStore } from "./stores/authStore";

function AuthenticatedSupportChat() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return isAuthenticated ? <GlobalSupportChat /> : null;
}

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
            <Sonner />
            <FonuCallProvider>
              <AuthGuard>
                <ErrorBoundary variant="page">
                  <Outlet />
                </ErrorBoundary>
                <AuthenticatedSupportChat />
              </AuthGuard>
            </FonuCallProvider>
          </PreferencesProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
