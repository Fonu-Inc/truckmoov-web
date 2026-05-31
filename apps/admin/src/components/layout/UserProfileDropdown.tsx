import { LogOut, Settings, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserProfileDropdown() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSettingsClick = () => {
    if (user?.role === "platform_admin") {
      navigate("/settings");
    } else {
      navigate("/admin/settings");
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "platform_admin":
        return "Platform Admin";
      case "tenant_admin":
        return "Admin";
      case "operations_manager":
        return "Operations Manager";
      case "supervisor":
        return "Supervisor";
      case "dispatcher":
        return "Dispatcher";
      case "viewer_finance":
        return "Finance";
      case "driver":
        return "Driver";
      case "installer":
        return "Installer";
      default:
        return "User";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2.5 rounded-full bg-secondary/60 py-1 pl-1.5 pr-4 hover:bg-secondary"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
            {getInitials(user?.name)}
          </span>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] font-medium text-primary truncate max-w-[140px]">
              {getRoleLabel(user?.role)}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {getRoleLabel(user?.role)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
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
          {isDark ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
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



