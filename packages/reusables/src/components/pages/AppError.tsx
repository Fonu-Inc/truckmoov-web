import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { canGoBack } from "../../utils/goBack";
import { ErrorDetails } from "./ErrorDetails";
import { StatusScreen } from "./StatusScreen";

type AppErrorProps = {
  error: Error;
  componentStack?: string;
};

/**
 * Full-page fallback for ErrorBoundary. Reached only after a render threw, so
 * it goes back through the History API rather than useNavigate — it must not
 * depend on router context it can't trust.
 */
export function AppError({ error, componentStack }: AppErrorProps) {
  const goBack = () => {
    if (canGoBack())
      window.history.back();
    else
      window.location.assign("/");
  };

  return (
    <StatusScreen
      code="500"
      eyebrow="Fault · unhandled error"
      title="Something went wrong"
      description="This page hit an error and stopped loading. Go back and try again."
      extra={(
        <ErrorDetails
          error={error}
          componentStack={componentStack}
        />
      )}
    >
      <Button
        variant="outline"
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>
    </StatusScreen>
  );
}
