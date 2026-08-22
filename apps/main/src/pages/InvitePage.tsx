import { zodResolver } from "@hookform/resolvers/zod";
import { useCompleteProfile } from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  ArrowLeft, Mail, ShieldCheck, User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Link, useNavigate, useSearchParams,
} from "react-router";
import { toast } from "sonner";

import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";

const invitePasswordSchema = z
  .object({
    fullName: z.string().min(
      2,
      "Enter your full name.",
    ),
    newPassword: z.string().min(
      8,
      "Password must be at least 8 characters.",
    ),
    confirmPassword: z.string().min(
      1,
      "Confirm your password.",
    ),
  })
  .refine(
    values => values.newPassword === values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

type InvitePasswordFormValues = z.infer<typeof invitePasswordSchema>;

export const INVITE_PASSWORD_FORM_ID = "main-invite-password-form";

export default function InvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const completeProfile = useCompleteProfile();

  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const email = searchParams.get("email")?.trim() ?? "";
  const hasInvite = inviteToken.length > 0 && email.length > 0;

  const form = useForm<InvitePasswordFormValues>({
    resolver: zodResolver(invitePasswordSchema),
    defaultValues: {
      fullName: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: InvitePasswordFormValues) {
    completeProfile.mutate(
      {
        data: {
          token: inviteToken,
          fullName: values.fullName.trim(),
          password: values.newPassword,
        },
      },
      {
        onSuccess: () => {
          toast.success("Account activated. Sign in to continue.");
          navigate(
            "/auth",
            { replace: true },
          );
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>
            Add your name and choose a password to finish activating your FleetPro account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!hasInvite
            ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    This invitation link is incomplete. Open the link from your invitation email again, or ask your
                    admin to resend the invitation.
                  </p>
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full"
                  >
                    <Link to="/auth">
                      <ArrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              )
            : (
                <Form {...form}>
                  <form
                    id={INVITE_PASSWORD_FORM_ID}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm">
                      <Mail className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{email}</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <FormControl>
                              <Input
                                placeholder="Jane Doe"
                                autoComplete="name"
                                className="pl-10"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <PasswordFieldControl
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            inputRef={field.ref}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <PasswordFieldControl
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            inputRef={field.ref}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      form={INVITE_PASSWORD_FORM_ID}
                      className="w-full"
                      loading={completeProfile.isPending}
                    >
                      Activate account
                    </Button>
                  </form>
                </Form>
              )}
        </CardContent>
      </Card>
    </div>
  );
}
