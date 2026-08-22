import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";

type ErrorDetailsProps = {
  error: Error;
  componentStack?: string;
};

const headline = (error: Error) => `${error.name}: ${error.message}`;

/**
 * `error.stack` conventionally repeats "Name: message" on its first line, which
 * the headline above the box already shows. Drop it so the box is only frames.
 */
function stackFrames(error: Error): string {
  const stack = error.stack ?? "";
  if (!stack)
    return "(no stack)";
  const prefix = headline(error);
  return stack.startsWith(prefix) ? stack.slice(prefix.length).trimStart() : stack;
}

function buildReport(error: Error, componentStack?: string): string {
  return [
    headline(error),
    `Path: ${window.location.pathname}${window.location.search}`,
    `Time: ${new Date().toISOString()}`,
    `Agent: ${navigator.userAgent}`,
    "",
    stackFrames(error),
    componentStack ? `\nComponent stack:${componentStack}` : "",
  ].join("\n");
}

/**
 * The crash detail a developer needs, and nothing a customer should see.
 * Renders nothing outside `vite dev`.
 */
export function ErrorDetails({ error, componentStack }: ErrorDetailsProps) {
  if (!import.meta.env.DEV)
    return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport(
        error,
        componentStack,
      ));
      toast.success("Error details copied");
    }
    catch {
      toast.error("Couldn't copy — select the text instead");
    }
  };

  return (
    <div className="mt-6 space-y-3">
      <p className="break-words font-mono text-xs font-medium text-destructive">
        {headline(error)}
      </p>
      <pre className="max-h-56 overflow-auto rounded-md border border-border/50 bg-background/60 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {stackFrames(error)}
        {componentStack && `\n\nComponent stack:${componentStack}`}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={copy}
      >
        <Copy className="mr-2 h-3 w-3" />
        Copy error details
      </Button>
    </div>
  );
}
