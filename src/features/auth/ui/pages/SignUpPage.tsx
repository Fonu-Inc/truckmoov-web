import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, ArrowRight, User, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  organizationName: z.string().trim().min(1, "Organization name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: registerUser, isPending: isRegistering } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!searchParams.get("invitation")) return;
    navigate(`/auth/invite?${searchParams.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organizationName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSignUpSubmit = async (values: SignUpFormValues) => {
    await registerUser(
      {
        data: {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          organizationName: values.organizationName,
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
    <AuthLayout title="Create your account" subtitle="Start managing your fleet today">
      <form onSubmit={handleSubmit(onSignUpSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="signUpFirstName" className="text-sm">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="signUpFirstName" type="text" placeholder="John" className="pl-10" {...register("firstName")} />
            </div>
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signUpLastName" className="text-sm">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="signUpLastName" type="text" placeholder="Doe" className="pl-10" {...register("lastName")} />
            </div>
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signUpOrganizationName" className="text-sm">Organization Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signUpOrganizationName" type="text" placeholder="Your Company Ltd" className="pl-10" {...register("organizationName")} />
          </div>
          {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signUpEmail" className="text-sm">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signUpEmail" type="email" placeholder="you@company.com" className="pl-10" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signUpPassword" className="text-sm">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signUpPassword" type={showPassword ? "text" : "password"} className="pl-10 pr-10" {...register("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signUpConfirmPassword" className="text-sm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="signUpConfirmPassword" type={showConfirmPassword ? "text" : "password"} className="pl-10 pr-10" {...register("confirmPassword")} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isRegistering}>
          Create Account
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth" className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
