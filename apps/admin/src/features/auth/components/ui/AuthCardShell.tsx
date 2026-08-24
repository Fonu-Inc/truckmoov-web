import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";

type AuthCardShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Centred card shell for the auth screens that don't use the branding panel —
 * verify-email and complete-profile. Wraps both their form and their "link is
 * broken" empty state.
 */
export function AuthCardShell({
  title, description, children,
}: AuthCardShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
