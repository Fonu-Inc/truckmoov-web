import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/shadcn/button";
import { isChunkLoadError, reloadForNewVersion } from "../../lib/chunkError";
import { AppError } from "./AppError";
import { StatusScreen } from "./StatusScreen";

/**
 * Error page for the router's root route. React Router renders the default
 * "Unexpected Application Error" developer page for anything a route throws
 * while loading, which is not something a customer should ever see.
 *
 * A page that fails because a deploy replaced its files reloads once on its
 * own; if that didn't help, the reload button is left for the reader.
 */
export default function RouteError() {
  const thrown = useRouteError();
  const error = thrown instanceof Error
    ? thrown
    : new Error(isRouteErrorResponse(thrown) ? `${thrown.status} ${thrown.statusText}` : String(thrown));
  const outdated = isChunkLoadError(error);

  useEffect(
    () => {
      console.error(
        "[RouteError]",
        thrown,
      );
      if (outdated)
        reloadForNewVersion();
    },
    [thrown, outdated],
  );

  if (!outdated)
    return <AppError error={error} />;

  return (
    <StatusScreen
      code="UPDATE"
      eyebrow="New version · reload needed"
      title="A new version is available"
      description="This page has been updated since you opened it. Reload to continue where you left off."
      tone="primary"
    >
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
      >
        <RotateCw className="mr-2 h-4 w-4" />
        Reload
      </Button>
    </StatusScreen>
  );
}
