import { useLocation } from "react-router";
import { SupportChatWidget } from "./SupportChatWidget";

/** Mounts the support chat bubble on every screen except the auth flow. */
export function GlobalSupportChat() {
  const { pathname } = useLocation();

  // The auth screens and the role-home redirect have no support bubble.
  if (pathname === "/" || pathname.startsWith("/auth"))
    return null;

  return <SupportChatWidget />;
}
