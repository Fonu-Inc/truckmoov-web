import { ThemeToggle } from "@/shared/components/ThemeToggle";
import mtnLogoDark from "@/assets/mtn-logo-dark.svg";
import { Truck } from "lucide-react";
import { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(220,20%,8%)] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">Truckmoov</span>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Enterprise Fleet Platform</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
            Enterprise Fleet Management for Africa
          </h1>
          <p className="text-base text-white/70 max-w-md leading-relaxed">
            Real-time tracking, intelligent dispatch, and seamless driver communication via WhatsApp, SMS & Voice.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            "10+ GPS Device Brands",
            "WhatsApp Integration",
            "AI Load Matching",
            "Real-time Analytics",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2.5 rounded-lg bg-white/5 backdrop-blur-xs border border-white/10 px-4 py-3"
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-mtn" />
              <span className="text-sm font-medium text-white">{feature}</span>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-auth">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <img src={mtnLogoDark} alt="MTN" className="h-24 w-auto brightness-0 dark:brightness-100" />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">Truckmoov</span>
              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">Enterprise Fleet</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
