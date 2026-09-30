import { useTwoFactor } from "@truckmoov/api/auth";
import { TwoFactorSetupCard } from "@truckmoov/reusables/components/auth/TwoFactorSetupCard";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

/**
 * TRU-FE-7 § D / TRU-FE-23 — per-account TOTP two-factor. Sign-in lands here with
 * `?enrol=required` when the platform requires 2FA and this account has none; the flag is
 * dropped once enrolment finishes.
 */
export default function SecuritySettingsPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();
  const enrolRequired = searchParams.get("enrol") === "required";
  const enrolled = useTwoFactor().data?.data.enrolled ?? false;

  useEffect(
    () => {
      if (enrolled && enrolRequired) {
        const next = new URLSearchParams(searchParams);
        next.delete("enrol");
        setSearchParams(
          next,
          { replace: true },
        );
      }
    },
    [
      enrolled,
      enrolRequired,
      searchParams,
      setSearchParams,
    ],
  );

  return <TwoFactorSetupCard enrolRequired={enrolRequired} />;
}
