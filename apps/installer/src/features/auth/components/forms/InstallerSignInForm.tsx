import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@truckmoov/api/auth";
import { PasswordFieldControl } from "@truckmoov/reusables/components/app/PasswordFieldControl";
import {
  ArrowRight, Mail,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { useAuthStore } from "@/stores/authStore";

const installerSignInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(
    1,
    "Password is required.",
  ),
});

type InstallerSignInFormValues = z.infer<typeof installerSignInSchema>;

export const INSTALLER_SIGN_IN_FORM_ID = "installer-sign-in-form";

/**
 * Installers are tenant-side users, so this posts to `/auth/login` via
 * `useLogin` — not the `/auth/system/login` endpoint the admin app uses,
 * which is for platform staff.
 */
export function InstallerSignInForm() {
  const login = useLogin();
  const navigate = useNavigate();

  const form = useForm<InstallerSignInFormValues>({
    resolver: zodResolver(installerSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: InstallerSignInFormValues) {
    login.mutate(
      {
        data: {
          email: values.email,
          password: values.password,
        },
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().bootstrapFromSession();
          navigate(
            "/",
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
    <Form {...form}>
      <form
        id={INSTALLER_SIGN_IN_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    placeholder="installer@company.com"
                    className="pl-10"
                    autoComplete="email"
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <PasswordFieldControl
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
          form={INSTALLER_SIGN_IN_FORM_ID}
          className="w-full"
          size="lg"
          loading={login.isPending}
        >
          <span className="flex items-center gap-2">
            Sign In
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
      </form>
    </Form>
  );
}
