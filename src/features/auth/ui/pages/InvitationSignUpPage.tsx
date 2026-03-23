import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterInvitedMember } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

const invitationSignUpSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1, "Full name is required"),
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
  const { mutateAsync: registerInvitedMember, isPending } = useRegisterInvitedMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvitationSignUpFormValues>({
    resolver: zodResolver(invitationSignUpSchema),
    defaultValues: {
      email: new URLSearchParams(window.location.search.replace(/\+/g, "%2B")).get("email") ?? "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleInvitationSignUp = async (values: InvitationSignUpFormValues) => {
    const inviteToken = searchParams.get("invite") ?? "";
    await registerInvitedMember(
      {
        data: {
          inviteToken,
          email: values.email,
          fullName: values.fullName,
          password: values.password,
        },
      },
      {
        onSuccess: () => {
          reset();
          navigate(APP_ROUTES.signIn);
        },
      }
    );
  };

  return (
    <AuthLayout
      title="Complete your registration"
      subtitle="Set your details to activate access"
    >
      <form onSubmit={handleSubmit(handleInvitationSignUp)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" className="pl-10 bg-muted cursor-not-allowed" readOnly {...register("email")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="fullName" type="text" placeholder="John Doe" className="pl-10" {...register("fullName")} />
          </div>
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
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

        <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
          Complete Registration
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
