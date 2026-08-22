import * as z from "zod";

/** Field fragments shared by the auth forms, so the copy stays identical across them. */

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const newPasswordSchema = z.string().min(
  8,
  "Password must be at least 8 characters.",
);

export const confirmPasswordSchema = z.string().min(
  1,
  "Confirm your password.",
);

/**
 * Second argument to `.refine()` on any schema with a `confirmPassword` field.
 * The comparison itself stays at the call site because the other field is named
 * `password` in sign-up but `newPassword` in reset and invite.
 */
export const passwordMismatch = {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
};
