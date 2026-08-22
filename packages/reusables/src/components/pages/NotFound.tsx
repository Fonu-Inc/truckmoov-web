import { useEffect } from "react";
import { useLocation } from "react-router";
import { GoBackButton } from "./GoBackButton";
import { StatusScreen } from "./StatusScreen";

/**
 * Catch-all route for both apps. Yellow rather than red: a wrong turn is not a
 * fault, and the requested path is shown because it is the one thing the reader
 * needs in order to spot the typo.
 */
export default function NotFound() {
  const location = useLocation();

  useEffect(
    () => {
      console.error(
        "404: no route for",
        location.pathname,
      );
    },
    [location.pathname],
  );

  return (
    <StatusScreen
      code="404"
      eyebrow="No route · HTTP 404"
      title="This page doesn’t exist"
      description="Nothing is mapped to this address. Check the link, or go back to where you were."
      tone="primary"
      detail={{
        label: "Requested", value: location.pathname,
      }}
    >
      <GoBackButton />
    </StatusScreen>
  );
}
