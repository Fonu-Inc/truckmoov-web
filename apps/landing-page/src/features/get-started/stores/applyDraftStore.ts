/**
 * Client-side state for the apply modal. A copy of the main app's
 * `features/apply/stores/applyDraftStore.ts`, persisted to localStorage (not per tab) so
 * "Apply as Returning Customer" can resume days later.
 *
 * - `licence`: the plan picked before the details are saved, the name typed on the
 *   signature pad and the "I have reviewed it" tick.
 * - `pendingSignature`: a signature drawn before the application exists. It is uploaded
 *   right after the details are saved, then cleared. The image is a Blob, so it is kept
 *   in IndexedDB (`draftFiles.ts`) rather than in this persisted state.
 * - `installation` / `deviceAssignments`: the installation form, kept so a reload doesn't
 *   lose it. Nothing is booked until the form is posted.
 */

import type { InstallationValues } from "@/features/get-started/schemas/applySchemas";
import type { LicenceAndIndemnity } from "@/features/get-started/utils/applyTypes";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { EMPTY_LICENCE_AND_INDEMNITY } from "@/features/get-started/utils/applyTypes";
import {
  deleteDraftFile,
  getDraftFile,
  putDraftFile,
} from "@/features/get-started/utils/draftFiles";

export type PendingSignature = {
  method: "drawn" | "uploaded";
  name: string;
  /** The agreement version on screen when it was signed, sent back as template_version. */
  version: string;
  /** PNG or JPG image. */
  image: Blob;
};

type SignatureMeta = Omit<PendingSignature, "image">;

const SIGNATURE_FILE_KEY = "signature";

type ApplyDraftState = {
  licence: LicenceAndIndemnity;
  pendingSignature: PendingSignature | null;
  installation: InstallationValues | null;
  /** deviceIndex (1-based) -> vehicle id */
  deviceAssignments: Record<number, string>;

  setLicence: (update: Partial<LicenceAndIndemnity>) => void;
  /** Also writes (or drops) the IndexedDB copy, so a signature survives closing the tab. */
  setPendingSignature: (signature: PendingSignature | null) => void;
  /** Brings back a signature saved in IndexedDB by an earlier visit. */
  restorePendingSignature: () => Promise<void>;
  setInstallation: (values: InstallationValues | null) => void;
  setDeviceAssignments: (assignments: Record<number, string>) => void;
  reset: () => void;
};

/** Shares the `truckmoov_landing_apply_` prefix that `clearApplyDraft` sweeps. */
export const APPLY_DRAFT_STORAGE_KEY = "truckmoov_landing_apply_draft";

const INITIAL = {
  licence: EMPTY_LICENCE_AND_INDEMNITY,
  pendingSignature: null,
  installation: null,
  deviceAssignments: {},
} as const;

export const useApplyDraftStore = create<ApplyDraftState>()(persist(
  (set, get) => ({
    ...INITIAL,

    setLicence: update => set(state => ({
      licence: {
        ...state.licence,
        ...update,
      },
    })),

    setPendingSignature: (signature) => {
      set({ pendingSignature: signature });
      if (!signature) {
        void deleteDraftFile(SIGNATURE_FILE_KEY);
        return;
      }
      const {
        image,
        ...meta
      } = signature;
      void putDraftFile({
        key: SIGNATURE_FILE_KEY,
        blob: image,
        meta,
      });
    },

    restorePendingSignature: async () => {
      if (get().pendingSignature)
        return;
      const saved = await getDraftFile<SignatureMeta>(SIGNATURE_FILE_KEY);
      if (saved && !get().pendingSignature) {
        set({
          pendingSignature: {
            ...saved.meta,
            image: saved.blob,
          },
        });
      }
    },

    setInstallation: values => set({ installation: values }),

    setDeviceAssignments: assignments => set({ deviceAssignments: assignments }),

    reset: () => set({ ...INITIAL }),
  }),
  {
    name: APPLY_DRAFT_STORAGE_KEY,
    partialize: state => ({
      licence: state.licence,
      installation: state.installation,
      deviceAssignments: state.deviceAssignments,
    }),
  },
));
