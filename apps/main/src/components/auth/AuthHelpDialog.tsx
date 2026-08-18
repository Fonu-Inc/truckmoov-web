import {
  ArrowUpLeft, CircleHelp, Mail,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/shadcn/accordion";
import { Button } from "@/components/shadcn/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/shadcn/dialog";

type AuthHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "sign-in" | "sign-up";
  onOpenChat?: () => void;
};

const SIGN_IN_FAQS = [
  {
    q: "I forgot my password — how do I reset it?",
    a: "Click the \"Forgot password?\" link below the password field on the sign-in form. We'll email you a secure reset link. Open the link from the same device and choose a new password (at least 8 characters).",
  },
  {
    q: "I didn't receive my verification email",
    a: "Check your spam/junk folder first. Verification emails come from a no-reply FleetPro address. If it's still missing after 5 minutes, try signing in again to trigger a resend, or contact your organization admin.",
  },
  {
    q: "My credentials aren't working",
    a: "Make sure Caps Lock is off and your email has no typos. If you were invited, use the exact email the invitation was sent to. Still stuck? Use the chat bubble in the bottom-right to talk to support.",
  },
  {
    q: "What's the difference between Quick Demo Access and Sign In?",
    a: "Quick Demo Access lets you explore FleetPro with a pre-configured role (no account needed). Sign In is for real users with credentials. Demo data is reset periodically.",
  },
  {
    q: "How do I get an account?",
    a: "FleetPro accounts are created by invitation from your organization's admin, or by signing up your own organization via the \"Sign up\" link below the form.",
  },
];

const SIGN_UP_FAQS = [
  {
    q: "What information do I need to sign up?",
    a: "Your full name, work email, organization name, and a password (minimum 8 characters). You'll create the first admin account for your organization.",
  },
  {
    q: "Do I need a verification email?",
    a: "Yes — after signing up we send a verification link to your email. Click it to activate your account before signing in.",
  },
  {
    q: "I was invited to join an existing organization — what do I do?",
    a: "Open the invitation link from your email. It will pre-fill your details and let you set a password. Don't use the regular Sign Up form — that creates a new organization.",
  },
  {
    q: "What is FleetPro?",
    a: "FleetPro is an AI-powered fleet management platform powered by MTN. It helps you track vehicles, manage drivers, dispatch jobs, monitor IoT devices and SIMs, and run logistics operations end-to-end.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — new organizations get access to a trial tier. You can also try Quick Demo Access on the sign-in screen to explore the platform without creating an account.",
  },
];

export function AuthHelpDialog({
  open, onOpenChange, mode, onOpenChat,
}: AuthHelpDialogProps) {
  const faqs = mode === "sign-up" ? SIGN_UP_FAQS : SIGN_IN_FAQS;
  const title = mode === "sign-up" ? "Sign Up Help" : "Sign In Help";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
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

        <Accordion
          type="single"
          collapsible
          className="w-full"
        >
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
            >
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
            Chat with our AI assistant or escalate to a live agent.
          </p>
          <div className="flex gap-2">
            {onOpenChat && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenChat();
                }}
                className="gap-2"
              >
                <ArrowUpLeft className="h-4 w-4" />
                Open chat support
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              asChild
              className="gap-2"
            >
              <a href="mailto:support@fleetpro.app">
                <Mail className="h-4 w-4" />
                Email us
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
