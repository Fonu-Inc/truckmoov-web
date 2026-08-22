import type { ReactNode } from "react";
import { useState } from "react";
import { HelpCircle, Truck } from "lucide-react";

import { Button } from "@/components/shadcn/button";
import { AuthHelpDialog, type AuthHelpMode } from "../app/AuthHelpDialog";
import { MobileLogo } from "../app/MobileLogo";
import mtnLogoDark from "../../assets/mtn-logo-dark.svg";

const features = [
  "10+ GPS Device Brands",
  "WhatsApp Integration",
  "AI Load Matching",
  "Real-time Analytics",
];

interface AuthBrandingPanelProps {
  children: ReactNode;
  /** Eyebrow for the mobile lockup. The desktop column's copy is fixed. */
  subtitle: string;
  helpMode?: AuthHelpMode;
}

export function AuthBrandingPanel({ children, subtitle, helpMode }: AuthBrandingPanelProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* `sidebar` is the repo's always-dark token family — it stays dark in
          light mode too, which is what this column needs. */}
      <div className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:w-1/2 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="auth-branding-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#auth-branding-grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="mb-10 inline-flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-mtn">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-sidebar-foreground">FleetPro</span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                  Enterprise Fleet Platform
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Powered by
              </span>
              <img src={mtnLogoDark} alt="MTN" className="h-8 w-auto brightness-0 invert" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-sidebar-foreground">
            Enterprise Fleet Management for Africa
          </h1>
          <p className="max-w-md text-base leading-relaxed text-sidebar-foreground/70">
            Real-time tracking, intelligent dispatch, and seamless driver communication via WhatsApp, SMS & Voice.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-mtn" />
              <span className="text-sm font-medium text-sidebar-foreground">{feature}</span>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-8 bg-gradient-auth">
        {helpMode && (
          <>
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                aria-label="Help"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="!h-6 !w-6" />
              </Button>
            </div>

            <AuthHelpDialog open={helpOpen} onOpenChange={setHelpOpen} mode={helpMode} />
          </>
        )}
        <MobileLogo subtitle={subtitle} />
        {children}
      </div>
    </div>
  );
}
