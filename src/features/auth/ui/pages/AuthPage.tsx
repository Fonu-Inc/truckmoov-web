import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useSystemLogin } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import QuickDemoAccessDropdown from "../components/QuickDemoAccessDropdown";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type LoginMode = "user" | "system";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutateAsync: signInUser, isPending: isUserSigningIn } = useLogin();
  const { mutateAsync: signInSystemUser, isPending: isSystemSigningIn } = useSystemLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("user");

  useEffect(() => {
    if (!searchParams.get("invitation")) return;
    navigate(`/auth/invite?${searchParams.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    const signIn = loginMode === "system" ? signInSystemUser : signInUser;

    await signIn(
      {
        data: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: () => {
          reset();
          navigate(APP_ROUTES.main);
        },
      }
    );
  };

  const isSigningIn = isUserSigningIn || isSystemSigningIn;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Truckmoov account">
      {import.meta.env.VITE_SHOW_DEMO === 'true' &&
        <>
          <QuickDemoAccessDropdown />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">Or continue with email</span>
            </div>
          </div>
        </>
      }


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-mode" className="text-sm">Login As</Label>
          <Select value={loginMode} onValueChange={(value) => setLoginMode(value as LoginMode)}>
            <SelectTrigger id="login-mode">
              <SelectValue placeholder="Select login type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Normal User</SelectItem>
              <SelectItem value="system">System Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@company.com" className="pl-10" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Password" className="pl-10 pr-10" {...register("password")} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-end">
          <NavLink to={APP_ROUTES.forgetPassword} type="button" className="text-sm text-primary hover:underline font-medium">
            Forgot password?
          </NavLink>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSigningIn} isLoading={isSigningIn}>
          Sign In
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account? <Link to="/auth/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
