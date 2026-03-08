import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  fullWidth = false,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 flex min-h-screen flex-col bg-card">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className={cn("flex-1 p-6", fullWidth && "p-0")}>
          {children}
        </main>
      </div>
    </div>
  );
}