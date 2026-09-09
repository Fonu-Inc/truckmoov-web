/**
 * Placeholder body for a nav entry whose page isn't built yet — `/analytics`
 * and `/subscription` today.
 *
 * ponytail: no props. The heading is already in the top bar (DashboardLayout
 * titles the page from the sidebar entry), so repeating it here would just be a
 * second source of truth to keep in step. Delete the route's use of this when
 * the real page lands.
 */
export default function ComingSoon() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Coming soon
    </div>
  );
}
