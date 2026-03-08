import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { setToken } from "@/lib/backendApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types";
import { DemoStakeholderType } from "@/stores/authStore";
import { Truck, Mail, Lock, ArrowRight, Building2, Users, Headphones, Car, Settings, Calculator, User, CheckCircle2, Loader2, ChevronDown, Wrench, Factory, Network, UserCheck, Eye, EyeOff } from "lucide-react";

/**
 * Determine the correct dashboard route for a user based on their legacy role
 * AND their organization memberships (for multi-stakeholder model).
 */
async function resolvePostLoginRoute(userId: string, legacyRole: string | null | undefined): Promise<string> {
  // Platform admin always goes to /platform
  if (legacyRole === "platform_admin") return "/platform";

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
    case "dispatcher":
      return "/supervisor";
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
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import mtnLogoDark from "@/assets/mtn-logo-dark.svg";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  tenant_id: string | null;
  expires_at: string;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setRole, bootstrapFromSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Invitation handling
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);

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
        toast.success("Account created successfully! Welcome to TruckMoov.", {
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
        navigate("/platform");
        break;
      case "tenant_admin":
      case "operations_manager":
        navigate("/admin");
        break;
      case "supervisor":
      case "dispatcher":
        navigate("/supervisor");
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
      icon: UserCheck,
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
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Complete Your Registration</CardTitle>
            <CardDescription>
              You've been invited to join TruckMoov as a <strong className="text-foreground">{invitation.role.replace("_", " ")}</strong>
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (always dark theme) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[hsl(220,20%,8%)] p-12 flex-col justify-between overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
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

        {/* Features */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            "10+ GPS Device Brands",
            "WhatsApp Integration",
            "AI Load Matching",
            "Real-time Analytics",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-3"
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-mtn" />
              <span className="text-sm font-medium text-white">{feature}</span>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-auth">
        {/* Top Right - MTN Logo & Theme Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <img src={mtnLogoDark} alt="MTN" className="h-24 w-auto brightness-0 dark:brightness-100" />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary shadow-mtn">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">Truckmoov</span>
              <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">Enterprise Fleet</span>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-xl font-semibold text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? "Start managing your fleet today"
                : "Sign in to your Truckmoov account"}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
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

            {isSignUp && (
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
            )}

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
