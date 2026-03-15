import { Toaster as Sonner } from "@/components/ui/sonner";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import TanstackQueryProvider from "./shared/providers/TanstackQueryProvider";
import RouterProvider from "./shared/providers/RouterProvider";

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <Sonner />
      <TanstackQueryProvider>
        <CurrencyProvider>
          <TenantBrandingProvider>
            <KeyboardShortcutsDialog />
            <FonuCallProvider>
              <RouterProvider />
            </FonuCallProvider>
          </TenantBrandingProvider>
        </CurrencyProvider>
      </TanstackQueryProvider>
    </ThemeProvider>
  );
};

export default App;
