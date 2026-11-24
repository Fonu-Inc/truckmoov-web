import { zodResolver } from "@hookform/resolvers/zod";
import { useChangeInstallerPassword } from "@truckmoov/api/auth";
import { useForm } from "react-hook-form";
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

const passwordSchema = z
  .object({
    currentPassword: z.string().min(
      1,
      "Enter your current password.",
    ),
    newPassword: z.string().min(
      8,
      "Use at least 8 characters.",
    ),
    confirmPassword: z.string(),
  })
  .refine(
    v => v.newPassword === v.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

type PasswordValues = z.infer<typeof passwordSchema>;

export const PASSWORD_FORM_ID = "installer-password-form";

const FIELDS = [
  [
    "currentPassword",
    "Current password",
    "current-password",
  ],
  [
    "newPassword",
    "New password",
    "new-password",
  ],
  [
    "confirmPassword",
    "Confirm new password",
    "new-password",
  ],
] as const;

/** The server ends every other session; the hook swaps in the new token pair. */
export function PasswordForm() {
  const change = useChangeInstallerPassword();

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "", newPassword: "", confirmPassword: "",
    },
  });

  function onSubmit({
    currentPassword, newPassword,
  }: PasswordValues) {
    change.mutate(
      {
        data: {
          currentPassword, newPassword,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          toast.success(
            "Password updated.",
            { description: "Other devices have been signed out." },
          );
        },
        onError: (error) => {
          if (error.statusCode === 401) {
            form.setError(
              "currentPassword",
              { message: "Current password is incorrect." },
            );
            return;
          }
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        id={PASSWORD_FORM_ID}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {FIELDS.map(([
            name,
            label,
            autoComplete,
          ]) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={autoComplete}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <Button
          type="submit"
          form={PASSWORD_FORM_ID}
          loading={change.isPending}
        >
          Update password
        </Button>
      </form>
    </Form>
  );
}
