import type { UseFormReturn } from "react-hook-form";
import type { BusinessDetailsValues } from "@/features/get-started/schemas/applySchemas";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingEmailAvailabilityQueryOptions } from "@truckmoov/api/auth";
import {
  useEffect, useState,
} from "react";

const TAKEN_MESSAGE = "An account or application already exists for this email";
const EMAIL_SHAPE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]{2,}$/;
const PAUSE_MS = 400;

/**
 * Flags a taken company email while it is being typed, once the typing pauses
 * on something shaped like an address. The save still answers 409, so this is
 * early warning only.
 */
export function useEmailAvailability(form: UseFormReturn<BusinessDetailsValues>, applicationId?: string | null) {
  const email = (form.watch("businessEmail") ?? "").trim().toLowerCase();
  const [
    paused,
    setPaused,
  ] = useState(email);

  useEffect(
    () => {
      const timer = setTimeout(
        setPaused,
        PAUSE_MS,
        email,
      );
      return () => clearTimeout(timer);
    },
    [email],
  );

  const checkable = paused === email && EMAIL_SHAPE.test(email);
  const { data } = useQuery({
    ...getOnboardingEmailAvailabilityQueryOptions(
      paused,
      applicationId ?? undefined,
    ),
    enabled: checkable,
  });
  const taken = checkable && data?.data.available === false;

  useEffect(
    () => {
      if (taken) {
        form.setError(
          "businessEmail",
          {
            type: "taken", message: TAKEN_MESSAGE,
          },
        );
      }
      else if (form.getFieldState("businessEmail").error?.type === "taken") {
        form.clearErrors("businessEmail");
      }
    },
    [
      taken,
      form,
    ],
  );
}
