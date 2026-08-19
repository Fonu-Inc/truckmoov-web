import { useQuery } from "@tanstack/react-query";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@truckmoov/reusables/components/shadcn/avatar";
import {
  LogOut, Moon, Settings, Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";

const PLATFORM_ADMIN_URL = (import.meta.env.VITE_PLATFORM_ADMIN_URL || "http://localhost:3002").replace(
  /\/$/,
  "",
);

export function UserProfileDropdown() {
  const {
    user, logout,
  } = useAuthStore();
  const navigate = useNavigate();
  const {
    theme, setTheme,
  } = useTheme();
  const { data: orgSettings } = useQuery(getOrganizationSettingsQueryOptions());
  const branding = orgSettings?.data?.branding;
  const orgName = branding?.organizationName;
  const orgEmail = branding?.contactEmail ?? user?.email;
  const logoUrl = branding?.profilePictureUrl;
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSettingsClick = () => {
    if (user?.role === "PLATFORM_ADMIN") {
      window.location.assign(`${PLATFORM_ADMIN_URL}/settings`);
    }
    else {
      navigate("/settings");
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "Super Admin";
      case "SYSTEM_ADMIN": return "System Admin";
      case "PLATFORM_ADMIN": return "Platform Admin";
      case "ENTERPRISE_ADMIN": return "Enterprise Admin";
      case "AGGREGATOR_ADMIN": return "Aggregator Admin";
      case "OWNER_OPERATOR": return "Owner Operator";
      case "FLEET_ADMIN": return "Fleet Admin";
      case "OPERATIONS_MANAGER": return "Operations Manager";
      case "DISPATCHER": return "Dispatcher";
      case "FINANCE_VIEWER": return "Finance";
      default: return role ?? "User";
    }
  };

  const getInitials = (name?: string) => {
    if (!name)
      return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
      return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2.5 rounded-full bg-secondary/60 py-1 pl-1.5 pr-4 hover:bg-secondary"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={logoUrl}
              alt={orgName}
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
              {getInitials(orgName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
              {orgName || "Organization"}
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
            <p className="text-sm font-medium leading-none">{orgName || "Organization"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {orgEmail || "user@example.com"}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {getRoleLabel(user?.role)}
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
