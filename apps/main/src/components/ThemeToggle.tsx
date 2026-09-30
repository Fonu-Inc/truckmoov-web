import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/shadcn/button";
import { TooltipWrapper } from "@/components/shadcn/tooltip-wrapper";

export function ThemeToggle() {
  const {
    resolvedTheme, setTheme,
  } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <TooltipWrapper content={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="h-10 w-10 text-muted-foreground hover:text-foreground"
      >
        {isDark ? <Sun className="!h-5 !w-5" /> : <Moon className="!h-5 !w-5" />}
      </Button>
    </TooltipWrapper>
  );
}
