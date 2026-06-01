import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore, isKnownEmail, registerKnownEmail, detectStakeholderFromEmail, type DetectedStakeholder } from "@/stores/onboardingStore";
import { supabase } from "@/integrations/supabase/client";
import { setToken } from "@/lib/backendApi";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { AuthBrandingPanel } from "@truckmoov/reusables/components/layouts/AuthBrandingPanel";
import { UserRole } from "@/types";
import { DemoStakeholderType } from "@/stores/authStore";
import { Truck, Mail, Lock, ArrowRight, Building2, Users, Headphones, Car, Settings, Calculator, User, CheckCircle2, Loader2, ChevronDown, Wrench, Factory, Network, Sparkles, Eye, EyeOff, HelpCircle } from "lucide-react";

/**
 * Determine the correct dashboard route for a user based on their legacy role
 * AND their organization memberships (for multi-stakeholder model).
 */
async function resolvePostLoginRoute(userId: string, legacyRole: string | null | undefined): Promise<string> {
  // Platform admin always goes to /
  if (legacyRole === "platform_admin") return "/";

  // Check if multi-stakeholder feature flag is enabled
  const { data: flagData } = await supabase
    .from("feature_flags")
    .select("is_enabled")
    .eq("feature_key", "enable_multi_stakeholder_model")
    .eq("scope", "platform")
    .is("tenant_id", null)
    .maybeSingle();

  if (flagData?.is_enabled) {
    // Check user's org memberships for enterprise or aggregator
    const { data: memberships } = await supabase
      .from("user_org_memberships")
      .select("org_id, organizations!user_org_memberships_org_id_fkey(organization_type)")
      .eq("user_id", userId)
      .eq("membership_status", "active");

    if (memberships && memberships.length > 0) {
      const orgTypes = memberships.map((m: any) => m.organizations?.organization_type);
      if (orgTypes.includes("ENTERPRISE")) return "/enterprise";
      if (orgTypes.includes("AGGREGATOR")) return "/aggregator";
      if (orgTypes.includes("OWNER_OPERATOR")) return "/owner-operator";
      // FLEET_PROVIDER falls through to legacy routing below
    }
  }

  // Legacy role-based routing
  switch (legacyRole) {
    case "tenant_admin":
    case "operations_manager":
      return "/admin";
    case "supervisor":
      return "/supervisor";
    case "dispatcher":
      return "/dispatcher";
    case "viewer_finance":
      return "/admin/fleet?tab=analytics";
    case "installer":
      return "/admin/installation";
    case "driver":
      return "/driver";
    default:
      return "/admin";
  }
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { toast } from "sonner";
import { AuthHelpDialog } from "@/components/auth/AuthHelpDialog";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  tenant_id: string | null;
  expires_at: string;
}

/**
 * Score a password 0-4 based on length and character variety.
 * Used to render the strength meter on the activation form.
 */
function getPasswordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setRole, bootstrapFromSession } = useAuthStore();
  const { startActivation, reset: resetOnboarding } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  /**
   * Auto-detected from email: if the email isn't in our known-emails list,
   * we treat the user as new and reveal Create Password + Confirm Password.
   * Defaults to FALSE so the original sign-in design (single Password field)
   * is the landing state — flips to true only when an unknown email is typed.
   */
  const [isActivate, setIsActivate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  // Invitation handling
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  /**
   * Auto-detected role/stakeholder from email — surfaced in the role indicator
   * card above the form. Updated debounced as the user types.
   */
  const [detectedRole, setDetectedRole] = useState<DetectedStakeholder | null>(null);
  /** Whether auto-detection has settled (email is valid + we know if known). */
  const [emailDetected, setEmailDetected] = useState(false);

  // Auto-detect new vs existing user + stakeholder role from email (debounced).
  useEffect(() => {
    const trimmed = email.trim();
    const validShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!validShape) {
      setDetectedRole(null);
      setEmailDetected(false);
      setIsActivate(false);
      return;
    }
    const handle = window.setTimeout(() => {
      setDetectedRole(detectStakeholderFromEmail(trimmed));
      setIsActivate(!isKnownEmail(trimmed));
      setEmailDetected(true);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [email]);

  // Check for invitation token in URL
  useEffect(() => {
    const invitationToken = searchParams.get("invitation");
    const invitedEmail = searchParams.get("email");

    if (invitationToken) {
      setIsLoadingInvitation(true);
      setIsSignUp(true);
      
      if (invitedEmail) {
        setEmail(decodeURIComponent(invitedEmail));
      }

      // Fetch invitation details
      const fetchInvitation = async () => {
        try {
          const { data, error } = await supabase
            .from("user_invitations")
            .select("id, email, role, tenant_id, expires_at")
            .eq("token", invitationToken)
            .is("accepted_at", null)
            .gt("expires_at", new Date().toISOString())
            .single();

          if (error || !data) {
            setInvitationError("This invitation link is invalid or has expired.");
            return;
          }

          setInvitation(data);
          setEmail(data.email);
        } catch (err) {
          console.error("Error fetching invitation:", err);
          setInvitationError("Failed to verify invitation. Please try again.");
        } finally {
          setIsLoadingInvitation(false);
        }
      };

      fetchInvitation();
    }
  }, [searchParams]);

  const handleInvitationSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      toast.error("No valid invitation found");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: `${firstName} ${lastName}`,
            tenant_id: invitation.tenant_id,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        toast.success("Account created successfully! Welcome to FleetPro.", {
          description: "You can now sign in with your credentials.",
          duration: 5000,
        });

        // Clear the invitation params and redirect to login
        navigate("/auth", { replace: true });
        setIsSignUp(false);
        setInvitation(null);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's an invitation, use the invitation sign-up flow
    if (invitation) {
      return handleInvitationSignUp(e);
    }

    // First-time activation (frontend demo flow) — auto-detected from email
    if (isActivate) {
      if (!email.trim()) {
        toast.error("Email is required");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setIsLoading(true);
      try {
        // Sign out of any real Supabase session first
        await supabase.auth.signOut();
        // Remember this email so next time we show the sign-in form
        registerKnownEmail(email);
        // Reset prior state and queue Welcome modal on the dashboard
        resetOnboarding();
        startActivation();
        // Default new activations to Enterprise demo experience
        setRole("tenant_admin", "ENTERPRISE");
        toast.success("Welcome aboard — let's get you set up");
        navigate("/enterprise");
      } catch (error) {
        console.error("Activation error:", error);
        toast.error("Failed to activate account");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsLoading(false);
          return;
        }
        if (!firstName.trim() || !lastName.trim()) {
          toast.error("First name and last name are required");
          setIsLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: `${firstName.trim()} ${lastName.trim()}`,
            },
          },
        });

        if (authError) throw authError;

        if (authData.session) {
          setToken(authData.session.access_token);
          toast.success("Account created successfully!", { description: "You are now signed in." });
          await bootstrapFromSession();
          const user = useAuthStore.getState().user;
          const route = await resolvePostLoginRoute(authData.user!.id, user?.role);
          navigate(route);
        } else {
          toast.success("Account created!", {
            description: "Please check your email to confirm your account before signing in.",
            duration: 6000,
          });
          setIsSignUp(false);
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.session) {
          setToken(authData.session.access_token);
        }

        toast.success("Welcome back!");
        await bootstrapFromSession();
        const user = useAuthStore.getState().user;
        const route = await resolvePostLoginRoute(authData.user.id, user?.role);
        navigate(route);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error instanceof Error ? error.message : (isSignUp ? "Failed to create account" : "Invalid credentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole, stakeholderType?: DemoStakeholderType) => {
    // Sign out of any real Supabase session first, so it doesn't override demo on refresh
    await supabase.auth.signOut();
    setRole(role, stakeholderType);
    
    // Stakeholder-specific routing
    if (stakeholderType === 'ENTERPRISE') {
      toast.success("Logged in as Enterprise Admin");
      navigate("/enterprise");
      return;
    }
    if (stakeholderType === 'AGGREGATOR') {
      toast.success("Logged in as Aggregator Admin");
      navigate("/aggregator");
      return;
    }
    if (stakeholderType === 'OWNER_OPERATOR') {
      toast.success("Logged in as Owner-Operator");
      navigate("/owner-operator");
      return;
    }

    toast.success(`Logged in as ${role.replace("_", " ")}`);
    switch (role) {
      case "platform_admin":
        navigate("/");
        break;
      case "tenant_admin":
      case "operations_manager":
        navigate("/admin");
        break;
      case "supervisor":
        navigate("/supervisor");
        break;
      case "dispatcher":
        navigate("/dispatcher");
        break;
      case "viewer_finance":
        navigate("/admin/fleet?tab=analytics");
        break;
      case "installer":
        navigate("/admin/installation");
        break;
      case "driver":
        navigate("/driver");
        break;
    }
  };

  const demoRoles = [
    {
      role: "platform_admin" as UserRole,
      label: "Platform Admin",
      description: "Read-only oversight of devices",
      icon: Building2,
    },
    {
      role: "tenant_admin" as UserRole,
      label: "Fleet Admin",
      description: "Full CRUD on devices & fleet",
      icon: Car,
    },
    {
      role: "operations_manager" as UserRole,
      label: "Operations Manager",
      description: "Full CRUD on devices & fleet",
      icon: Settings,
    },
    {
      role: "dispatcher" as UserRole,
      label: "Dispatcher",
      description: "Read-only device tracking",
      icon: Headphones,
    },
    {
      role: "viewer_finance" as UserRole,
      label: "Finance/Viewer",
      description: "Read-only device data",
      icon: Calculator,
    },
    {
      role: "driver" as UserRole,
      label: "Driver",
      description: "No device access",
      icon: Users,
    },
    {
      role: "installer" as UserRole,
      label: "Installer",
      description: "Device config & verification",
      icon: Wrench,
    },
  ];

  const stakeholderDemoRoles = [
    {
      label: "Enterprise Admin",
      description: "Cargo owner — create jobs & send offers",
      icon: Factory,
      stakeholderType: 'ENTERPRISE' as DemoStakeholderType,
    },
    {
      label: "Aggregator Admin",
      description: "Manage linked owner-operators",
      icon: Network,
      stakeholderType: 'AGGREGATOR' as DemoStakeholderType,
    },
    {
      label: "Owner-Operator",
      description: "Accept job offers & track deliveries",
      icon: Sparkles,
      stakeholderType: 'OWNER_OPERATOR' as DemoStakeholderType,
    },
  ];

  // Show loading state while checking invitation
  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state for invalid invitation
  if (invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{invitationError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setInvitationError(null);
                navigate("/auth", { replace: true });
              }}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation sign-up form
  if (invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-auth p-4">
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

        <AuthHelpDialog
          open={helpOpen}
          onOpenChange={setHelpOpen}
          mode="sign-up"
          onOpenChat={() => setChatOpen(true)}
        />
        <SupportChatWidget open={chatOpen} onOpenChange={setChatOpen} />

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>
              You've been invited to join FleetPro as a <strong className="text-foreground">{invitation.role.replace("_", " ")}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-success/10 border border-success/20 p-3 mb-6 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-success">Invitation Verified</p>
                <p className="text-muted-foreground mt-0.5">
                  Set up your password to access your account at <strong>{invitation.email}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Complete Registration
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthBrandingPanel helpMode={isSignUp ? "sign-up" : "sign-in"}>
        <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />

        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">FleetPro</span>
              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">Enterprise Fleet</span>
            </div>
          </div>

          <div className="text-left">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              {isSignUp
                ? "Create your account"
                : isActivate
                ? "Welcome"
                : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? "Start managing your fleet today"
                : "Sign in to your FleetPro account"}
            </p>
          </div>

          {/* Demo Quick Access Dropdown */}
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full max-w-xs gap-2">
                  <Users className="h-4 w-4" />
                  Quick Demo Access
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-72 max-h-[80vh] overflow-y-auto">
                <DropdownMenuLabel>Multi-Stakeholder Roles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stakeholderDemoRoles.map(({ label, description, icon: Icon, stakeholderType }) => (
                  <DropdownMenuItem
                    key={label}
                    onSelect={() => handleDemoLogin('tenant_admin', stakeholderType)}
                    className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">{description}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Fleet Provider Roles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {demoRoles.map(({ role, label, description, icon: Icon }) => (
                  <DropdownMenuItem
                    key={role}
                    onSelect={() => handleDemoLogin(role)}
                    className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">{description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="organizationName" className="text-sm">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Your Company Ltd"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}


            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Existing user → single password field */}
            {!isSignUp && !isActivate && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {/* New user → create + confirm password */}
            {!isSignUp && isActivate && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength meter */}
                  {password.length > 0 && (() => {
                    const score = getPasswordStrength(password);
                    const label = ["Very weak", "Weak", "Fair", "Good", "Strong"][score];
                    const color = [
                      "bg-destructive",
                      "bg-destructive",
                      "bg-amber-500",
                      "bg-emerald-500",
                      "bg-emerald-600",
                    ][score];
                    return (
                      <div className="space-y-1 pt-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < score ? color : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Password strength: <span className="font-medium text-foreground">{label}</span>
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                </div>
              </div>
            )}

            {/* Sign-up flow keeps its existing password fields below */}
            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isLoading ||
                (isActivate && (password.length < 8 || password !== confirmPassword))
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing you in..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

        </div>
    </AuthBrandingPanel>
  );
}
