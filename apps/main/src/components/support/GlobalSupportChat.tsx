import { useLocation } from "react-router";
import { SupportChatWidget } from "./SupportChatWidget";

/** Mounts the support chat bubble on every screen except the auth flow. */
export function GlobalSupportChat() {
  const { pathname } = useLocation();

  // The auth screens, the role-home redirect, the public tracking link and the live map have no support bubble.
  if (pathname === "/" || pathname === "/map" || pathname.startsWith("/auth") || pathname.startsWith("/track/"))
    return null;

  return <SupportChatWidget />;
}
