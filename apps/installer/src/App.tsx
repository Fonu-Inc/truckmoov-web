import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { ErrorBoundary } from "@truckmoov/reusables/components/ErrorBoundary";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { AuthGuard } from "@/features/auth/components/providers/AuthGuard";
import { ThemeProvider } from "./components/ThemeProvider";
import { useAuthStore } from "./stores/authStore";

/**
 * Root layout route (pathless). Owns the installer provider tower and auth gate;
 * the route table lives in shared/lib/route.tsx.
 *
 * ponytail: a slimmer tower than apps/admin — no Currency, Preferences, Fonu
 * softphone or global support chat. None of them have a caller in the
 * installer portal, so they stayed behind rather than arriving unused.
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
        <Sonner />
        <AuthGuard>
          <ErrorBoundary variant="page">
            <Outlet />
          </ErrorBoundary>
        </AuthGuard>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
