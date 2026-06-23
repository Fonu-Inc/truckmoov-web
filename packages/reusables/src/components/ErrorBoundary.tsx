import { Component, ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          {import.meta.env.DEV && (
            <>
              <p className="max-w-sm text-xs text-muted-foreground">{this.state.error.message}</p>
              <button
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                onClick={() => this.setState({ error: null })}
              >
                Try again
              </button>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
