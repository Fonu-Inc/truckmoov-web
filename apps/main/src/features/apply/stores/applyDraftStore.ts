/**
 * Client-side hold for the parts of the application the backend cannot accept yet.
 *
 * ponytail: the public onboarding-application API covers business details,
 * documents, email/phone verification and submit — nothing else. The M2M licence
 * choice, the indemnity signature, fleet requirements, payment and installation
 * scheduling have no endpoints, so they are collected and persisted here instead
 * of being dropped from the UI. When those endpoints land, replace each slice
 * with a mutation and delete it from this store.
 */

import type { InstallationValues } from "@/features/apply/utils/applySchemas";
import type {
  FleetState,
  HeldDocument,
  LicenceAndIndemnity,
} from "@/features/apply/utils/applyTypes";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  EMPTY_FLEET,
  EMPTY_LICENCE_AND_INDEMNITY,
} from "@/features/apply/utils/applyTypes";

type ApplyDraftState = {
  licence: LicenceAndIndemnity;
  /** Data URL of a drawn or uploaded signature. Never sent anywhere yet. */
  signatureImage: string | null;
  fleet: FleetState;
  /** Documents whose type the server has no enum value for. Metadata only. */
  heldDocuments: Record<string, HeldDocument>;
  installation: InstallationValues | null;
  /** device unit id -> vehicle id */
  deviceAssignments: Record<string, string>;
  paid: boolean;
  scheduled: boolean;

  setLicence: (update: Partial<LicenceAndIndemnity>) => void;
  setSignatureImage: (dataUrl: string | null) => void;
  setFleet: (update: (previous: FleetState) => FleetState) => void;
  setHeldDocument: (type: string, document: HeldDocument | null) => void;
  setInstallation: (values: InstallationValues | null) => void;
  setDeviceAssignments: (assignments: Record<string, string>) => void;
  setPaid: (paid: boolean) => void;
  setScheduled: (scheduled: boolean) => void;
  reset: () => void;
};

export const APPLY_DRAFT_STORAGE_KEY = "truckmoov_apply_draft";

const INITIAL = {
  licence: EMPTY_LICENCE_AND_INDEMNITY,
  signatureImage: null,
  fleet: EMPTY_FLEET,
  heldDocuments: {},
  installation: null,
  deviceAssignments: {},
  paid: false,
  scheduled: false,
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

    setSignatureImage: dataUrl => set({ signatureImage: dataUrl }),

    setFleet: update => set(state => ({ fleet: update(state.fleet) })),

    setHeldDocument: (type, document) => set((state) => {
      const next = { ...state.heldDocuments };
      if (document)
        next[type] = document;
      else
        delete next[type];
      return { heldDocuments: next };
    }),

    setInstallation: values => set({ installation: values }),

    setDeviceAssignments: assignments => set({ deviceAssignments: assignments }),

    setPaid: paid => set({ paid }),

    setScheduled: scheduled => set({ scheduled }),

    reset: () => set({ ...INITIAL }),
  }),
  {
    name: APPLY_DRAFT_STORAGE_KEY,
    // The signature data URL can be large; keep it out of persisted storage.
    partialize: state => ({
      licence: state.licence,
      fleet: state.fleet,
      heldDocuments: state.heldDocuments,
      installation: state.installation,
      deviceAssignments: state.deviceAssignments,
      paid: state.paid,
      scheduled: state.scheduled,
    }),
  },
));
