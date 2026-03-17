import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import AuthLayout from "../components/AuthLayout";
import { verifyEmailQueryOption, verifyPasswordResetQueryOption } from "../../api";
import { APP_ROUTES } from "@/shared/lib/appRoutes";
import { Button } from "@/components/ui/button";

type VerifyEmailType = "reset-password" | "new-user";

type VerifyConfig = {
 queryOption: (token: string) => UseQueryOptions
 successRedirect: (token: string) => string
 title: string
 subtitle: string
}

const VERIFY_CONFIG: Record<VerifyEmailType, VerifyConfig> = {
 "new-user": {
  queryOption: (token) => verifyEmailQueryOption({ data: { token } }),
  successRedirect: () => APP_ROUTES.signIn,
  title: "Verifying Email",
  subtitle: "Give us a moment while we verify your email address",
 },
 "reset-password": {
  queryOption: (token) => verifyPasswordResetQueryOption({ data: { token } }),
  successRedirect: (token) => `${APP_ROUTES.change}?token=${token}`,
  title: "Verifying Reset Token",
  subtitle: "Give us a moment while we verify your reset token",
 },
}

export default function VerifyEmail() {
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();

 const token = useMemo(() => searchParams.get("token"), [searchParams]);
 const type = useMemo(() => searchParams.get("type") as VerifyEmailType, [searchParams]);

 const config = VERIFY_CONFIG[type];

 const { isSuccess, isError, refetch, isFetching } = useQuery({
  ...config.queryOption(token),
 });

 useEffect(() => {
  if (isSuccess) navigate(config.successRedirect(token ?? ""), { replace: true });
 }, [isSuccess, navigate, config, token]);

 if (isError) {
  return (
   <AuthLayout
    title="Verification Failed"
    subtitle="We couldn't verify your token. It may have expired or is invalid."
   >
    <Button onClick={() => refetch()} disabled={isFetching} className="w-full">
     {isFetching ? <Loader2 className="animate-spin w-4 h-4" /> : "Try Again"}
    </Button>
   </AuthLayout>
  );
 }

 return (
  <AuthLayout title={config.title} subtitle={config.subtitle}>
   <div className="w-full flex items-center justify-center">
    <Loader2 className="animate-spin text-primary w-10 h-10" />
   </div>
  </AuthLayout>
 );
}
