/**
 * Client-side state for the apply flow.
 *
 * Steps 1–3 live on the server (the application from `useApplySession`); what is
 * left here is UI state the API has no field for:
 * - `licence`: the plan picked before the details are saved, the name typed on the
 *   signature pad and the "I have reviewed it" tick.
 * - `pendingSignature`: a signature drawn before the application exists. It is
 *   uploaded right after the details are saved, then cleared. Kept out of storage.
 * - `installation` / `deviceAssignments`: the installation form, kept so a reload
 *   doesn't lose it. Nothing is booked until the form is posted.
 */

import type { InstallationValues } from "@/features/apply/utils/applySchemas";
import type {
  DeviceFulfilment,
  LicenceAndIndemnity,
} from "@/features/apply/utils/applyTypes";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  EMPTY_DEVICE_FULFILMENT,
  EMPTY_LICENCE_AND_INDEMNITY,
} from "@/features/apply/utils/applyTypes";

export type PendingSignature = {
  method: "drawn" | "uploaded";
  name: string;
  /** The agreement version on screen when it was signed — sent back as template_version. */
  version: string;
  /** PNG or JPG data URL. */
  image: string;
};

type ApplyDraftState = {
  /** Entered through "Returning Customers" (`?returning=1`): an existing MTN customer. */
  returning: boolean;
  licence: LicenceAndIndemnity;
  /** TODO(api): Device Fulfilment choice — kept here until the onboarding API takes it. */
  fulfilment: DeviceFulfilment;
  pendingSignature: PendingSignature | null;
  installation: InstallationValues | null;
  /** deviceIndex (1-based) -> vehicle id */
  deviceAssignments: Record<number, string>;

  setReturning: (returning: boolean) => void;
  setFulfilment: (fulfilment: DeviceFulfilment) => void;
  setLicence: (update: Partial<LicenceAndIndemnity>) => void;
  setPendingSignature: (signature: PendingSignature | null) => void;
  setInstallation: (values: InstallationValues | null) => void;
  setDeviceAssignments: (assignments: Record<number, string>) => void;
  reset: () => void;
};

export const APPLY_DRAFT_STORAGE_KEY = "truckmoov_apply_draft";

const INITIAL = {
  returning: false,
  licence: EMPTY_LICENCE_AND_INDEMNITY,
  fulfilment: EMPTY_DEVICE_FULFILMENT,
  pendingSignature: null,
  installation: null,
  deviceAssignments: {},
} as const;

export const useApplyDraftStore = create<ApplyDraftState>()(persist(
  set => ({
    ...INITIAL,

    setLicence: update => set(state => ({
      licence: {
        ...state.licence,
        ...update,
      },
    })),

    setReturning: returning => set({ returning }),

    setFulfilment: fulfilment => set({ fulfilment }),

    setPendingSignature: signature => set({ pendingSignature: signature }),

    setInstallation: values => set({ installation: values }),

    setDeviceAssignments: assignments => set({ deviceAssignments: assignments }),

    reset: () => set({ ...INITIAL }),
  }),
  {
    name: APPLY_DRAFT_STORAGE_KEY,
    // The signature data URL can be large; keep it out of persisted storage.
    partialize: state => ({
      returning: state.returning,
      licence: state.licence,
      fulfilment: state.fulfilment,
      installation: state.installation,
      deviceAssignments: state.deviceAssignments,
    }),
  },
));
