import { GoBackButton } from "./GoBackButton";
import { StatusScreen } from "./StatusScreen";

/**
 * Shown when a route is out of reach for the signed-in account.
 *
 * Deliberately says nothing about the user's role: the copy has to be true in
 * the admin app too, where staff are never role-gated, and reading the role
 * would tie this page to each app's authStore.
 */
export default function NotAuthorized() {
  return (
    <StatusScreen
      code="403"
      eyebrow="Restricted · HTTP 403"
      title="You don’t have access"
      description="Your account can’t open this page. Ask an administrator to change your access."
    >
      <GoBackButton />
    </StatusScreen>
  );
}
