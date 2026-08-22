import type { ErrorInfo, ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Component } from "react";
import { Button } from "@/components/shadcn/button";
import { AppError } from "./pages/AppError";
import { ErrorDetails } from "./pages/ErrorDetails";

type Props = {
  children: ReactNode;
  /**
   * `inline` (default) keeps the surrounding shell intact and shows a compact
   * card in the slot that broke. `page` takes the whole viewport — use it for
   * the root Outlet, where there is no shell left to keep.
   */
  variant?: "inline" | "page";
};

type State = {
  error: Error | null;
  componentStack?: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[ErrorBoundary]",
      error,
    );
    this.setState({ componentStack: info.componentStack ?? undefined });
  }

  render() {
    const {
      error, componentStack,
    } = this.state;
    if (!error)
      return this.props.children;

    if (this.props.variant === "page") {
      return (
        <AppError
          error={error}
          componentStack={componentStack}
        />
      );
    }

    return (
      <div className="flex h-full min-h-[200px] w-full flex-col justify-center rounded-lg border border-l-2 border-destructive/30 border-l-destructive bg-destructive/5 p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Fault · unhandled error
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          This section didn’t load
        </p>
        <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
          The rest of the page still works. Try loading this part again.
        </p>
        <ErrorDetails
          error={error}
          componentStack={componentStack}
        />
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({
              error: null, componentStack: undefined,
            })}
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
