import type { JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import {
  describe, expect, it,
} from "vitest";
import {
  buildCargoPayload,
  buildStopsPayload,
  readJobPrefill,
  requiredVehicleType,
  stopPayload,
} from "./jobPayload";

function formData(overrides: Partial<JobFormSubmitData> = {}, metadata: Record<string, unknown> = {}): JobFormSubmitData {
  return {
    reference: "JOB-1",
    pickupAddress: "Apapa Port",
    pickupLat: 6.45,
    pickupLng: 3.36,
    deliveryAddress: "Ikeja",
    deliveryLat: 6.6,
    deliveryLng: 3.35,
    cargoType: "",
    cargoWeight: 100,
    cargoDescription: "",
    amount: 5000,
    deadline: "2026-03-02T10:00",
    priority: "medium",
    cargoUnit: "kg",
    vehicleType: "Any Available Vehicle",
    stops: [],
    attachmentFiles: [],
    metadata,
    ...overrides,
  } as JobFormSubmitData;
}

describe(
  "buildStopsPayload",
  () => {
    it(
      "carries the contact details typed for pickup and delivery",
      () => {
        const {
          pickup, dropoff,
        } = buildStopsPayload(formData(
          {},
          {
            pickupDetails: {
              include: true, contactName: " Ada ", companyName: "Acme", contactPhone: "+2348011111111", date: "2026-03-01", timeFrom: "08:00", timeTo: "10:00", instructions: "Gate B",
            },
            deliveryDetails: {
              include: true, contactName: "Bola",
            },
          },
        ));

        expect(pickup).toEqual({
          address: "Apapa Port",
          latitude: 6.45,
          longitude: 3.36,
          contact_name: "Ada",
          contact_phone: "+2348011111111",
          company_name: "Acme",
          date: "2026-03-01",
          time_from: "08:00",
          time_to: "10:00",
          notes: "Gate B",
        });
        expect(dropoff).toMatchObject({
          address: "Ikeja", contact_name: "Bola",
        });
        expect(dropoff).not.toHaveProperty("company_name");
      },
    );

    it(
      "leaves details out when the wizard's include switch is off",
      () => {
        const { pickup } = buildStopsPayload(formData(
          {},
          { pickupDetails: undefined },
        ));

        expect(pickup).toEqual({
          address: "Apapa Port", latitude: 6.45, longitude: 3.36,
        });
        expect(stopPayload(
          { address: "X" },
          {
            include: false, contactName: "Ada",
          },
        )).toEqual({ address: "X" });
      },
    );

    it(
      "flattens in-between stops, keeping each one's details",
      () => {
        const { stops } = buildStopsPayload(formData(
          {},
          {
            stops: [
              {
                kind: "simple", address: "Ibadan", lat: 7.4, lng: 3.9, details: {
                  include: true, contactName: "Chi",
                },
              },
              {
                kind: "pickup-delivery",
                pickupAddress: "Ore",
                pickupLat: 6.7,
                pickupLng: 4.8,
                pickupDetails: {
                  include: true, contactPhone: "0801",
                },
                deliveryAddress: "Benin",
                deliveryLat: 6.3,
                deliveryLng: 5.6,
              },
              {
                kind: "simple", address: "   ",
              },
            ],
          },
        ));

        expect(stops).toEqual([
          {
            address: "Ibadan", latitude: 7.4, longitude: 3.9, contact_name: "Chi",
          },
          {
            address: "Ore", latitude: 6.7, longitude: 4.8, contact_phone: "0801",
          },
          {
            address: "Benin", latitude: 6.3, longitude: 5.6,
          },
        ]);
      },
    );
  },
);

describe(
  "buildCargoPayload",
  () => {
    it(
      "sends category, count, value, dimensions, handling and equipment",
      () => {
        const cargo = buildCargoPayload(formData(
          {
            packagesCount: 4, cargoValue: 250000, cargoUnit: "pallets",
          },
          {
            cargoCategory: "Electronics",
            dimensions: {
              length: 120, width: 80,
            },
            specialHandling: [
              "Fragile",
              "Other",
            ],
            specialHandlingOther: "Keep upright",
            equipment: ["Forklift"],
          },
        ));

        expect(cargo).toEqual({
          category: "Electronics",
          packages_count: 4,
          unit: "pallets",
          value_ngn: 250000,
          dimensions: {
            length_cm: 120, width_cm: 80,
          },
          special_handling: [
            "Fragile",
            "Keep upright",
          ],
          equipment: ["Forklift"],
        });
      },
    );

    it(
      "drops an Other choice with no text and empty dimensions",
      () => {
        const cargo = buildCargoPayload(formData(
          {},
          {
            dimensions: {},
            specialHandling: ["Other"],
            specialHandlingOther: "  ",
          },
        ));

        expect(cargo.special_handling).toEqual([]);
        expect(cargo.dimensions).toBeUndefined();
        expect(cargo.packages_count).toBeUndefined();
      },
    );
  },
);

describe(
  "requiredVehicleType",
  () => {
    it(
      "is nothing for any available vehicle",
      () => {
        expect(requiredVehicleType(formData())).toBeUndefined();
        expect(requiredVehicleType(formData({ vehicleType: "Flatbed" }))).toBe("Flatbed");
      },
    );
  },
);

describe(
  "readJobPrefill",
  () => {
    it(
      "brings back what was saved so an edit does not wipe it",
      () => {
        const prefill = readJobPrefill({
          cargo_category: "Electronics",
          packages_count: 4,
          cargo_unit: "pallets",
          cargo_value_ngn: 250000,
          required_vehicle_type: "Flatbed",
          dimensions: {
            length_cm: 120, width_cm: 80, height_cm: 60,
          },
          special_handling: [
            "Fragile",
            "Keep upright",
          ],
          equipment: ["Forklift"],
          pickup: {
            address: "Apapa", contact_name: "Ada", time_from: "08:00",
          },
          dropoff: { address: "Ikeja" },
          stops: [
            {
              address: "Ibadan", latitude: 7.4, longitude: 3.9, contact_phone: "0801",
            },
          ],
        });

        expect(prefill).toMatchObject({
          cargoCategory: "Electronics",
          packagesCount: 4,
          cargoUnit: "pallets",
          cargoValue: 250000,
          vehicleType: "Flatbed",
          dimensions: {
            length: 120, width: 80, height: 60,
          },
          specialHandling: [
            "Fragile",
            "Other",
          ],
          specialHandlingOther: "Keep upright",
          equipment: ["Forklift"],
        });
        expect(prefill.pickupDetails).toMatchObject({
          include: true, contactName: "Ada", timeFrom: "08:00",
        });
        expect(prefill.deliveryDetails.include).toBe(false);
        expect(prefill.stops[0]).toMatchObject({
          address: "Ibadan", lat: 7.4, details: {
            include: true, contactPhone: "0801",
          },
        });
      },
    );

    it(
      "shows a custom category as Other, and a weight in kilograms",
      () => {
        const prefill = readJobPrefill({
          cargo_category: "Live plants", cargo_unit: "tons",
        });

        expect(prefill.cargoCategory).toBe("Other");
        expect(prefill.cargoCategoryOther).toBe("Live plants");
        expect(prefill.cargoUnit).toBe("kg");
      },
    );

    it(
      "is empty for a job saved before these details existed",
      () => {
        const prefill = readJobPrefill({});

        expect(prefill).toMatchObject({
          cargoCategory: "", vehicleType: "Any Available Vehicle", specialHandling: [], equipment: [], stops: [],
        });
        expect(prefill.dimensions).toBeUndefined();
      },
    );
  },
);
