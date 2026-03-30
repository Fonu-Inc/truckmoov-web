import { Moon, Settings, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SignOutButton from "./SignOutButton";
import { useMemo } from "react";
import { getOrgLabel } from "../composables/getOrgLabel";
import AppAvatar from "./AppAvatar";
import { siderbarList } from "@/shared/lib/sidebarListItem";

export function UserProfileDropdown() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const org = useMemo(() => ({
    label: getOrgLabel(user?.role),
    userName: user.profile?.fullName ?? "N/A",
    email: user.email ?? "N/A",
  }), [user])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSettingsClick = () => {
    const settingsItem = siderbarList(user.role).find(item => item.icon === Settings)
    navigate(settingsItem?.to ?? "/setting")
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <AppAvatar value={org.userName} imgUrl={user.profile?.profilePictureUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate text-ellipsis">{org.userName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate text-ellipsis">
              {org.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {org.label}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
        >
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
