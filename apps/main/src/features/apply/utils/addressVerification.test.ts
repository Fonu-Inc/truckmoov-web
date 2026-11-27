import type { AddressVerification } from "@/features/apply/utils/addressVerification";

import {
  ADDRESS_NOT_SELECTED,
  isAddressVerified,
  mapPlaceToRegion,
  regionMismatch,
  regionToPrefill,
} from "@/features/apply/utils/addressVerification";
import { installationSchema } from "@/features/apply/utils/applySchemas";

const picked: AddressVerification = {
  status: "selected",
  address: "Allen Avenue, Oregun, Ikeja, Lagos, Nigeria",
  state: "Lagos",
  city: "Ikeja",
};

describe(
  "isAddressVerified",
  () => {
    it(
      "is false without a verification, as for an old saved draft",
      () => {
        expect(isAddressVerified(
          "12 Test Street, Ikeja",
          undefined,
        )).toBe(false);
        expect(isAddressVerified(
          "12 Test Street, Ikeja",
          null,
        )).toBe(false);
      },
    );

    it(
      "holds only for the text that was picked, ignoring case and spacing",
      () => {
        expect(isAddressVerified(
          "  allen avenue,  Oregun, Ikeja, Lagos, Nigeria ",
          picked,
        )).toBe(true);
        expect(isAddressVerified(
          "Allen Avenue, Oregun, Ikeja, Lagos, Nigeria 2",
          picked,
        )).toBe(false);
      },
    );
  },
);

describe(
  "mapPlaceToRegion",
  () => {
    it(
      "maps a city that is an LGA",
      () => {
        expect(mapPlaceToRegion({
          state: "Lagos",
          city: "Ikeja",
          district: "Oregun",
        })).toEqual({
          state: "Lagos",
          city: "Ikeja",
        });
      },
    );

    it(
      "maps the FCT and matches the LGA through the county",
      () => {
        expect(mapPlaceToRegion({
          state: "Federal Capital Territory",
          city: "Abuja",
          county: "Municipal Area Council",
        })).toEqual({
          state: "FCT",
          city: "Abuja Municipal Area Council",
        });
      },
    );

    it(
      "keeps the state only when the city is ambiguous or unknown",
      () => {
        expect(mapPlaceToRegion({
          state: "Lagos State",
          city: "Lagos",
          district: "Victoria Island",
        })).toEqual({ state: "Lagos" });
      },
    );

    it(
      "maps nothing for a place outside the state list",
      () => {
        expect(mapPlaceToRegion({
          state: "Littoral",
          city: "Douala",
        })).toEqual({});
        expect(mapPlaceToRegion(undefined)).toEqual({});
      },
    );
  },
);

describe(
  "regionToPrefill and regionMismatch",
  () => {
    it(
      "fills empty state and city",
      () => {
        expect(regionToPrefill(
          picked,
          {
            state: "",
            city: "",
          },
        )).toEqual({
          state: "Lagos",
          city: "Ikeja",
        });
      },
    );

    it(
      "never replaces a state or city the user chose",
      () => {
        expect(regionToPrefill(
          picked,
          {
            state: "Ogun",
            city: "",
          },
        )).toEqual({});
        expect(regionToPrefill(
          picked,
          {
            state: "Lagos",
            city: "Surulere",
          },
        )).toEqual({});
      },
    );

    it(
      "flags a different state or city, and nothing when they agree",
      () => {
        expect(regionMismatch(
          picked,
          {
            state: "Ogun",
            city: "",
          },
        )).toContain("Lagos");
        expect(regionMismatch(
          picked,
          {
            state: "Lagos",
            city: "Surulere",
          },
        )).toContain("Ikeja");
        expect(regionMismatch(
          picked,
          {
            state: "Lagos",
            city: "Ikeja",
          },
        )).toBeNull();
        expect(regionMismatch(
          {
            status: "confirmed", address: "x",
          },
          {
            state: "Ogun",
            city: "",
          },
        )).toBeNull();
      },
    );
  },
);

describe(
  "installationSchema address check",
  () => {
    const base = {
      streetAddress: "12 Test Street, Ikeja",
      city: "Ikeja",
      state: "Lagos",
      date: "2099-01-01",
      timeSlot: "morning",
      contactName: "Ada Obi",
      contactPhone: "08031234567",
    };

    it(
      "rejects typed text that was not picked",
      () => {
        const result = installationSchema.safeParse(base);
        expect(result.success).toBe(false);
        expect(!result.success && result.error.issues.map(issue => issue.message)).toContain(ADDRESS_NOT_SELECTED);
      },
    );

    it(
      "accepts text confirmed by hand while the lookup is down",
      () => {
        const result = installationSchema.safeParse({
          ...base,
          addressVerification: {
            status: "confirmed",
            address: base.streetAddress,
          },
        });
        const messages = !result.success ? result.error.issues.map(issue => issue.message) : [];
        expect(messages).not.toContain(ADDRESS_NOT_SELECTED);
      },
    );
  },
);
