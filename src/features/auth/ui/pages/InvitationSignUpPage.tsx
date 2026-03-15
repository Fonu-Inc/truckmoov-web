import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "../components/AuthLayout";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  tenant_id: string | null;
  expires_at: string;
}

const invitationSignUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type InvitationSignUpFormValues = z.infer<typeof invitationSignUpSchema>;

export default function InvitationSignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [isSubmittingInvitation, setIsSubmittingInvitation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitationSignUpFormValues>({
    resolver: zodResolver(invitationSignUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const invitationToken = searchParams.get("invitation");
    const invitedEmail = searchParams.get("email");

    if (!invitationToken) {
      navigate("/auth/signup", { replace: true });
      return;
    }

    setIsLoadingInvitation(true);
    if (invitedEmail) setEmail(decodeURIComponent(invitedEmail));

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
      } catch {
        setInvitationError("Failed to verify invitation. Please try again.");
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [navigate, searchParams]);

  const handleInvitationSignUp = async (values: InvitationSignUpFormValues) => {
    if (!invitation) return;

    setIsSubmittingInvitation(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: values.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: `${values.firstName} ${values.lastName}`,
            tenant_id: invitation.tenant_id,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        toast.success("Account created successfully! Welcome to TruckMoov.");
        reset();
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsSubmittingInvitation(false);
    }
  };

  if (invitationError) {
    return (
      <AuthLayout title="Invalid invitation" subtitle={invitationError}>
        <Button onClick={() => navigate("/auth", { replace: true })} className="w-full">
          Go to Login
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Complete your registration"
      subtitle={isLoadingInvitation ? "Verifying your invitation..." : "Set your details to activate access"}
    >
      {!isLoadingInvitation && invitation && (
        <div className="rounded-lg bg-success/10 border border-success/20 p-3 mb-2 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-success">Invitation Verified</p>
            <p className="text-muted-foreground mt-0.5">
              Set your password for <strong>{invitation.email}</strong>
            </p>
          </div>
        </div>
      )}

      {isLoadingInvitation ? null : (
        <form onSubmit={handleSubmit(handleInvitationSignUp)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="firstName" type="text" placeholder="John" className="pl-10" {...register("firstName")} />
              </div>
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="lastName" type="text" placeholder="Doe" className="pl-10" {...register("lastName")} />
              </div>
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" value={email} className="pl-10 bg-muted" disabled />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} className="pl-10 pr-10" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="pl-10 pr-10" {...register("confirmPassword")} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmittingInvitation}>
            <span className="flex items-center gap-2">
              Complete Registration
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
