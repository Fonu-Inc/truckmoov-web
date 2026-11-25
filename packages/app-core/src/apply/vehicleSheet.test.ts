import {
  describe, expect, it,
} from "vitest";
import {
  parseVehicleSheet, vehicleLicenceError, vehicleTemplateRows,
} from "./vehicleSheet";

const HEADERS = vehicleTemplateRows()[0];

describe(
  "parseVehicleSheet",
  () => {
    it(
      "reads the template's example row into an add-vehicle payload",
      () => {
        const { rows, error } = parseVehicleSheet(vehicleTemplateRows());
        expect(error).toBeUndefined();
        expect(rows).toHaveLength(1);
        expect(rows[0].errors).toEqual([]);
        expect(rows[0].data).toEqual({
          registrationNumber: "LAG-123-ABC",
          vehicleType: "truck",
          make: "Toyota",
          model: "Hilux",
          year: 2021,
          chassisNumber: "JTEBU5JR9K5000001",
          engineNumber: "ENG-000123",
          color: "White",
          engineCapacity: "2.8L",
          odometerReading: 84500,
          purchaseType: "outright",
          purchaseTypeOther: undefined,
        });
      },
    );

    it(
      "accepts the design's preview headings and maps Rental to Other",
      () => {
        const { rows } = parseVehicleSheet([
          [
            "Vehicle ID",
            "Registration Number",
            "Vehicle Type",
            "Make",
            "Model",
            "Year",
            "Odometer",
            "Purchase Type",
          ],
          [
            "V-002",
            "LAG-101-FP",
            "van",
            "Ford",
            "Transit",
            "2020",
            "132,400",
            "Rental",
          ],
        ]);
        expect(rows[0].data).toMatchObject({
          vehicleType: "van",
          odometerReading: 132400,
          purchaseType: "other",
          purchaseTypeOther: "Rental",
        });
      },
    );

    it(
      "flags missing values, unsupported types and duplicates per row",
      () => {
        const { rows } = parseVehicleSheet(
          [
            HEADERS,
            [
              "V-1",
              "LAG-1",
              "Pickup",
              "Toyota",
              "Hilux",
              2021,
            ],
            [
              "V-1",
              "lag 1",
              "Truck",
              "",
              "Actros",
              "21",
            ],
            [
              "V-3",
              "KJA-9",
              "Truck",
              "Isuzu",
              "NPR",
              2023,
            ],
          ],
          ["KJA 9"],
        );
        expect(rows.map(r => r.sheetRow)).toEqual([
          2,
          3,
          4,
        ]);
        expect(rows[0].errors[0]).toMatch(/Pickup/);
        expect(rows[1].errors).toEqual([
          "Make is required.",
          "Vehicle ID V-1 is used more than once.",
          "lag 1 is already in your list.",
          "Year must be four digits, 1950 or later.",
        ]);
        expect(rows[2].errors).toEqual(["KJA-9 is already in your list."]);
        expect(rows.every(r => r.data === null)).toBe(true);
      },
    );

    it(
      "reports a sheet without the required columns or rows",
      () => {
        expect(parseVehicleSheet([]).error).toMatch(/no rows/);
        expect(parseVehicleSheet([[
          "Make",
          "Model",
        ]]).error).toMatch(/Vehicle ID, Registration Number, Vehicle Type, Year/);
        expect(parseVehicleSheet([HEADERS]).error).toMatch(/no vehicles/);
      },
    );
  },
);

describe(
  "vehicleLicenceError",
  () => {
    it(
      "takes PDF, JPG or PNG up to 10 MB",
      () => {
        expect(vehicleLicenceError(new File(
          ["x"],
          "licence.PDF",
        ))).toBeNull();
        expect(vehicleLicenceError(new File(
          ["x"],
          "licence.docx",
        ))).toMatch(/PDF, JPG or PNG/);
      },
    );
  },
);
