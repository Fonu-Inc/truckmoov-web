import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useActiveOrgStore } from '@/stores/activeOrgStore';
import { canAccessRoute, resolveOrgHomeRoute } from '@/lib/orgPermissions';
import { toast } from 'sonner';
import { useRef } from 'react';

interface OrgProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route-level gating: checks authentication AND org-type access.
 * Unauthorized users are redirected to their org home with a toast notification.
 */
export function OrgProtectedRoute({ children }: OrgProtectedRouteProps) {
  const { user, isAuthenticated, isAuthReady } = useAuthStore();
  const orgCtx = useOrgContext();
  const location = useLocation();
  const { resolveActiveOrg } = useActiveOrgStore();
  const { enabled: flagEnabled } = useFeatureFlag(
    'enable_multi_stakeholder_model',
    user?.tenantId
  );
  const multiStakeholderEnabled = flagEnabled;

  // Prevent duplicate toasts on the same denied path
  const lastDeniedPath = useRef<string | null>(null);

  // Wait for auth to be ready
  if (!isAuthReady) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  // Platform admins always have access — skip org context loading
  if (user?.role === 'platform_admin') return <>{children}</>;

  // Wait for org context to load for non-platform-admin users
  if (orgCtx.isLoading) return null;

  // Resolve active org for multi-org users
  const activeOrg = resolveActiveOrg(orgCtx.memberships);

  // When multi-stakeholder is on, use only the active org's membership for route checks
  const effectiveMemberships = multiStakeholderEnabled && activeOrg
    ? [activeOrg]
    : orgCtx.memberships;

  const hasAccess = canAccessRoute(
    location.pathname,
    effectiveMemberships,
    user?.role,
    multiStakeholderEnabled
  );

  if (!hasAccess) {
    const redirectPath = resolveOrgHomeRoute(
      effectiveMemberships,
      user?.role,
      multiStakeholderEnabled
    );

    // Show toast only once per denied path
    if (lastDeniedPath.current !== location.pathname) {
      lastDeniedPath.current = location.pathname;
      // Use setTimeout to avoid React state update during render
      setTimeout(() => {
        toast.error('Access denied', {
          description: 'You do not have permission to access this page.',
        });
      }, 0);
    }

    // If the redirect would send them to the same path, show not-authorized to avoid loops
    if (redirectPath === location.pathname) {
      return <Navigate to="/not-authorized" replace />;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}



