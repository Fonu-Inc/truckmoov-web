import { getInitials } from "@truckmoov/app-core/utils/general-utils";
import {
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { getRoleLabel } from "@/features/auth/utils/role-label";
import { useProfileName } from "@/features/dashboard/hooks/useProfileName";
import { useAuthStore } from "@/stores/authStore";

/**
 * The top-bar profile pill and menu — fleetflow's
 * `components/layout/UserProfileDropdown.tsx`. The name comes from
 * `GET /auth/profile` (the session has none); role and email are live.
 */
export function UserProfileDropdown() {
  const {
    user,
    logout,
  } = useAuthStore();
  const name = useProfileName();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
  } = useTheme();
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const roleLabel = getRoleLabel(
    user?.role,
    "User",
  );

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2.5 rounded-full bg-secondary/60 py-1 pl-1.5 pr-4 hover:bg-secondary"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
            {getInitials(name || "User")}
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
              {name || "User"}
            </span>
            <span className="text-[10px] font-medium text-primary truncate max-w-[140px]">
              {roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-popover border-border"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {roleLabel}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSettingsClick}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className="cursor-pointer"
        >
          {isDark
            ? (
                <Sun className="mr-2 h-4 w-4" />
              )
            : (
                <Moon className="mr-2 h-4 w-4" />
              )}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
