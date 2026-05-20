import { useLocation } from "react-router-dom";
import { SupportChatWidget } from "./SupportChatWidget";

/**
 * Mounts the support chat bubble on every screen except routes that
 * already render their own controlled instance (e.g. AuthPage).
 */
export function GlobalSupportChat() {
  const { pathname } = useLocation();

  // AuthPage renders its own controlled SupportChatWidget tied to the help dialog.
  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  return <SupportChatWidget />;
}
