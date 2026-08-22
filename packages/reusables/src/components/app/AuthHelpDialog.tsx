import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/shadcn/accordion";
import { Button } from "@/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";
import { CircleHelp, Mail } from "lucide-react";

export type AuthHelpMode = "sign-in" | "sign-up" | "admin";

interface AuthHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthHelpMode;
}

type Faq = { q: string; a: string };

const SIGN_IN_FAQS: Faq[] = [
  {
    q: "I forgot my password - how do I reset it?",
    a: "Click the \"Forgot password?\" link below the password field on the sign-in form. We'll email you a secure reset link. Open the link from the same device and choose a new password (at least 8 characters).",
  },
  {
    q: "I didn't receive my verification email",
    a: "Check your spam/junk folder first. Verification emails come from a no-reply FleetPro address. If it's still missing after 5 minutes, try signing in again to trigger a resend, or contact your organization admin.",
  },
  {
    q: "My credentials aren't working",
    a: "Make sure Caps Lock is off and your email has no typos. If you were invited, use the exact email the invitation was sent to. Still stuck? Email support for help.",
  },
  {
    q: "How do I get an account?",
    a: "FleetPro accounts are created by invitation from your organization's admin, or by signing up your own organization via the \"Sign up\" link below the form.",
  },
];

const SIGN_UP_FAQS: Faq[] = [
  {
    q: "What information do I need to sign up?",
    a: "Your full name, work email, organization name, and a password (minimum 8 characters). You'll create the first admin account for your organization.",
  },
  {
    q: "Do I need a verification email?",
    a: "Yes - after signing up we send a verification link to your email. Click it to activate your account before signing in.",
  },
  {
    q: "I was invited to join an existing organization - what do I do?",
    a: "Open the invitation link from your email. It will pre-fill your details and let you set a password. Don't use the regular Sign Up form - that creates a new organization.",
  },
  {
    q: "What is FleetPro?",
    a: "FleetPro is an AI-powered fleet management platform powered by MTN. It helps you track vehicles, manage drivers, dispatch jobs, monitor IoT devices and SIMs, and run logistics operations end-to-end.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes - new organizations get access to a trial tier.",
  },
];

const ADMIN_FAQS: Faq[] = [
  {
    q: "I forgot my password - how do I reset it?",
    a: "Platform admin passwords are reset by the platform team; this screen has no self-service reset link. Email support from your registered address and we'll issue a reset.",
  },
  {
    q: "My credentials aren't working",
    a: "Make sure Caps Lock is off and your email has no typos. Platform admin accounts are separate from tenant FleetPro accounts - check you're on the admin app and not the tenant sign-in.",
  },
  {
    q: "How do I get a platform admin account?",
    a: "Platform admin access is provisioned by the platform team, not self-service. There is no sign-up on this screen.",
  },
  {
    q: "What does platform admin access cover?",
    a: "Tenants, devices, IoT SIMs and data bundles across the whole platform, plus billing, security, and compliance auditing.",
  },
];

/** Keyed rather than a ternary chain so a new mode is a compile error, not a silent fallback. */
const FAQS: Record<AuthHelpMode, Faq[]> = {
  "sign-in": SIGN_IN_FAQS,
  "sign-up": SIGN_UP_FAQS,
  "admin": ADMIN_FAQS,
};

const TITLES: Record<AuthHelpMode, string> = {
  "sign-in": "Sign In Help",
  "sign-up": "Sign Up Help",
  "admin": "Admin Sign In Help",
};

export function AuthHelpDialog({ open, onOpenChange, mode }: AuthHelpDialogProps) {
  const faqs = FAQS[mode];
  const title = TITLES[mode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CircleHelp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Quick answers to common questions</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="rounded-lg border bg-muted/30 p-4 mt-2">
          <p className="text-sm font-medium mb-1">Still need help?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Email support and our team will follow up.
          </p>
          <Button size="sm" variant="outline" asChild className="gap-2">
            <a href="mailto:support@fleetpro.app">
              <Mail className="h-4 w-4" />
              Email us
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
