import { useLocation } from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { useSupportAccess } from "@/features/help/hooks/useSupportAccess";
import { SupportChatWidget } from "./SupportChatWidget";

/**
 * Mounts the support chat bubble for signed-in users who can raise tickets (a chat
 * opens one), everywhere except the auth flow, the public tracking link and the live map.
 * `/` is the tenant overview here, unlike the design app's public landing, so it keeps the bubble.
 */
export function GlobalSupportChat() {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { canManage } = useSupportAccess();

  if (!isAuthenticated || !canManage || pathname === "/map" || pathname.startsWith("/auth") || pathname.startsWith("/track/"))
    return null;

  return <SupportChatWidget />;
}
