/**
 * Client-side state for the apply flow, persisted to localStorage so a saved application
 * resumes in a new tab. The application itself lives on the server (`useApplySession`);
 * what is left here is UI state the API has no field for:
 * - `fulfilment`: the pickup point picked on the fleet step; saved to the application on Continue.
 * - `licence`: the plan picked before the details are saved, the name typed on the
 *   signature pad and the "I have reviewed it" tick.
 * - `pendingSignature`: a signature drawn before the application exists. It is
 *   uploaded right after the details are saved, then cleared. Kept out of storage.
 * - `installation` / `deviceAssignments`: the installation form, kept so a reload
 *   doesn't lose it. Nothing is booked until the form is posted.
 */

import type {
  DeviceFulfilment,
  LicenceAndIndemnity,
} from "@truckmoov/app-core/apply/applyTypes";
import type { InstallationValues } from "@/features/apply/utils/applySchemas";

import {
  EMPTY_DEVICE_FULFILMENT,
  EMPTY_LICENCE_AND_INDEMNITY,
} from "@truckmoov/app-core/apply/applyTypes";
import { create } from "zustand";

import { persist } from "zustand/middleware";

export type PendingSignature = {
  method: "drawn" | "uploaded";
  name: string;
  /** The agreement version on screen when it was signed — sent back as template_version. */
  version: string;
  /** PNG or JPG image. */
  image: Blob;
};

type ApplyDraftState = {
  /** Entered through "Returning Customers" (`?returning=1`): an existing MTN customer. */
  returning: boolean;
  licence: LicenceAndIndemnity;
  /** `store` holds the pickup location id. */
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
    // A Blob can't be persisted: a signature not yet uploaded is signed again after a reload.
    partialize: state => ({
      returning: state.returning,
      licence: state.licence,
      fulfilment: state.fulfilment,
      installation: state.installation,
      deviceAssignments: state.deviceAssignments,
    }),
  },
));
