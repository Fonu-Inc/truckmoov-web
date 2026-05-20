import { ReactNode } from "react";
import { useWritePermissions, type WritePermissions } from "@/hooks/useWritePermissions";

/**
 * Renders children only when the user has the required write permission.
 * Otherwise renders nothing — used to HIDE (not just disable) write CTAs
 * for read-only roles such as Viewer.
 *
 * Pattern intentionally avoids `disabled` so the UI stays uncluttered for
 * roles that have no possibility of performing the action.
 */
interface WritableActionProps {
  /** A boolean key from useWritePermissions, e.g. "canCreateJobs". */
  permission: keyof WritePermissions;
  children: ReactNode;
  /** Optional read-only fallback (e.g. an info badge). */
  fallback?: ReactNode;
}

export function WritableAction({ permission, children, fallback = null }: WritableActionProps) {
  const perms = useWritePermissions();
  if (!perms[permission]) return <>{fallback}</>;
  return <>{children}</>;
}
