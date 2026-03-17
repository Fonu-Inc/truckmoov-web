import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrandingProvider } from "./features/setting/providers/BrandingProvider";
import { CurrencyProvider } from "./contexts/CurrencyContext";
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
        <BrandingProvider>
          <CurrencyProvider>
            <KeyboardShortcutsDialog />
            <FonuCallProvider>
              <RouterProvider />
            </FonuCallProvider>
          </CurrencyProvider>
        </BrandingProvider>
      </TanstackQueryProvider>
    </ThemeProvider>
  );
};

export default App;
