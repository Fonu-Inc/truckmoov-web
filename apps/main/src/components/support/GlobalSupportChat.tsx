import { useLocation } from "react-router";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { SupportChatWidget } from "./SupportChatWidget";

/** Mounts the support chat bubble for signed-in users, except on the auth flow. */
export function GlobalSupportChat() {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  // The auth screens, the role-home redirect, the public tracking link and the live map have no support bubble.
  if (!isAuthenticated || pathname === "/" || pathname === "/map" || pathname.startsWith("/auth") || pathname.startsWith("/track/"))
    return null;

  return <SupportChatWidget />;
}
