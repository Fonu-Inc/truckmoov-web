import type {
  CreateJobStopPayload, DispatchJob, DispatchStop, JobCargoPayload,
} from "@truckmoov/api/dispatch";
import type { JobFormSubmitData } from "@/components/jobs/JobFormDialog";
import {
  ANY_VEHICLE_TYPE, CARGO_CATEGORIES, EQUIPMENT_OPTIONS, NON_WEIGHT_UNITS, SPECIAL_HANDLING,
} from "@/components/jobs/jobFormOptions";

/** What the wizard's "include details" panel holds for one location. */
export type WizardLocationDetails = {
  include: boolean;
  contactName?: string;
  companyName?: string;
  contactPhone?: string;
  date?: string;
  timeFrom?: string;
  timeTo?: string;
  instructions?: string;
};

export type WizardStopPrefill = {
  address: string;
  lat: number;
  lng: number;
  details: WizardLocationDetails;
};

/** Everything the wizard needs to show a saved job again, so an edit does not wipe what it cannot see. */
export type JobFormPrefill = {
  cargoCategory: string;
  cargoCategoryOther: string;
  packagesCount?: number;
  cargoUnit: string;
  cargoValue?: number;
  vehicleType: string;
  dimensions?: {
    length?: number; width?: number; height?: number;
  };
  specialHandling: string[];
  specialHandlingOther: string;
  equipment: string[];
  equipmentOther: string;
  pickupDetails: WizardLocationDetails;
  deliveryDetails: WizardLocationDetails;
  stops: WizardStopPrefill[];
};

type Coordinates = {
  address: string; latitude?: number; longitude?: number;
};

const OTHER = "Other";

function present<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([
      , value,
    ]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}

function trimmed(value?: string) {
  const text = value?.trim();
  return text || undefined;
}

function readDetails(value: unknown): WizardLocationDetails | undefined {
  if (!value || typeof value !== "object")
    return undefined;
  const details = value as WizardLocationDetails;
  return details.include ? details : undefined;
}

export function stopPayload(place: Coordinates, details?: WizardLocationDetails): CreateJobStopPayload {
  return {
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    ...(details?.include
      ? present({
          contact_name: trimmed(details.contactName),
          contact_phone: trimmed(details.contactPhone),
          company_name: trimmed(details.companyName),
          date: trimmed(details.date),
          time_from: trimmed(details.timeFrom),
          time_to: trimmed(details.timeTo),
          notes: trimmed(details.instructions),
        })
      : {}),
  };
}

type WizardStopMetadata = {
  kind?: string;
  address?: string;
  lat?: number;
  lng?: number;
  details?: unknown;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupDetails?: unknown;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryDetails?: unknown;
};

function intermediateStops(metadata: Record<string, unknown>): CreateJobStopPayload[] {
  const rows = Array.isArray(metadata.stops) ? metadata.stops as WizardStopMetadata[] : [];
  return rows.flatMap((row) => {
    if (row.kind === "pickup-delivery") {
      return [
        row.pickupAddress?.trim()
          ? stopPayload(
              {
                address: row.pickupAddress, latitude: row.pickupLat, longitude: row.pickupLng,
              },
              readDetails(row.pickupDetails),
            )
          : undefined,
        row.deliveryAddress?.trim()
          ? stopPayload(
              {
                address: row.deliveryAddress, latitude: row.deliveryLat, longitude: row.deliveryLng,
              },
              readDetails(row.deliveryDetails),
            )
          : undefined,
      ].filter((stop): stop is CreateJobStopPayload => stop !== undefined);
    }
    return row.address?.trim()
      ? [
          stopPayload(
            {
              address: row.address, latitude: row.lat, longitude: row.lng,
            },
            readDetails(row.details),
          ),
        ]
      : [];
  });
}

/** Pickup, drop-off and in-between stops, each with the contact details typed for it. */
export function buildStopsPayload(data: JobFormSubmitData) {
  const metadata = data.metadata ?? {};
  return {
    pickup: stopPayload(
      {
        address: data.pickupAddress, latitude: data.pickupLat, longitude: data.pickupLng,
      },
      readDetails(metadata.pickupDetails),
    ),
    dropoff: stopPayload(
      {
        address: data.deliveryAddress, latitude: data.deliveryLat, longitude: data.deliveryLng,
      },
      readDetails(metadata.deliveryDetails),
    ),
    stops: intermediateStops(metadata),
  };
}

function withOther(values: unknown, other: unknown): string[] {
  const chosen = Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : [];
  const otherText = typeof other === "string" ? other.trim() : "";
  return chosen.flatMap(value => value === OTHER ? (otherText ? [otherText] : []) : [value]);
}

function dimensionsPayload(value: unknown): JobCargoPayload["dimensions"] {
  if (!value || typeof value !== "object")
    return undefined;
  const {
    length, width, height,
  } = value as {
    length?: number; width?: number; height?: number;
  };
  if (!length && !width && !height)
    return undefined;
  return present({
    length_cm: length, width_cm: width, height_cm: height,
  });
}

/** The cargo details the wizard collects beyond weight and description. */
export function buildCargoPayload(data: JobFormSubmitData): JobCargoPayload {
  const metadata = data.metadata ?? {};
  return {
    category: trimmed(typeof metadata.cargoCategory === "string" ? metadata.cargoCategory : undefined),
    packages_count: data.packagesCount || undefined,
    unit: trimmed(data.cargoUnit),
    value_ngn: data.cargoValue || undefined,
    dimensions: dimensionsPayload(metadata.dimensions),
    special_handling: withOther(
      metadata.specialHandling,
      metadata.specialHandlingOther,
    ),
    equipment: withOther(
      metadata.equipment,
      metadata.equipmentOther,
    ),
  };
}

export function requiredVehicleType(data: JobFormSubmitData) {
  const type = data.vehicleType?.trim();
  return !type || type === ANY_VEHICLE_TYPE ? undefined : type;
}

function prefillDetails(stop?: DispatchStop): WizardLocationDetails {
  const details: WizardLocationDetails = {
    include: false,
    contactName: stop?.contact_name,
    companyName: stop?.company_name,
    contactPhone: stop?.contact_phone,
    date: stop?.date,
    timeFrom: stop?.time_from,
    timeTo: stop?.time_to,
    instructions: stop?.notes,
  };
  details.include = Boolean(
    details.contactName || details.companyName || details.contactPhone || details.date
    || details.timeFrom || details.timeTo || details.instructions,
  );
  return details;
}

function splitOther(values: string[] | undefined, known: readonly string[]) {
  const saved = values ?? [];
  const custom = saved.filter(value => !known.includes(value));
  const listed = saved.filter(value => known.includes(value) && value !== OTHER);
  return {
    chosen: custom.length > 0 ? [
      ...listed,
      OTHER,
    ] : listed,
    other: custom.join(", "),
  };
}

export function readJobPrefill(job: DispatchJob): JobFormPrefill {
  const category = job.cargo_category ?? "";
  const known = (CARGO_CATEGORIES as readonly string[]).includes(category);
  const handling = splitOther(
    job.special_handling,
    SPECIAL_HANDLING,
  );
  const equipment = splitOther(
    job.equipment,
    EQUIPMENT_OPTIONS,
  );
  const dims = job.dimensions;
  const unit = job.cargo_unit && NON_WEIGHT_UNITS.includes(job.cargo_unit) ? job.cargo_unit : "kg";
  return {
    cargoCategory: !category || known ? category : OTHER,
    cargoCategoryOther: category && !known ? category : "",
    packagesCount: job.packages_count || undefined,
    cargoUnit: unit,
    cargoValue: job.cargo_value_ngn || undefined,
    vehicleType: job.required_vehicle_type || ANY_VEHICLE_TYPE,
    dimensions: dims && (dims.length_cm || dims.width_cm || dims.height_cm)
      ? {
          length: dims.length_cm, width: dims.width_cm, height: dims.height_cm,
        }
      : undefined,
    specialHandling: handling.chosen,
    specialHandlingOther: handling.other,
    equipment: equipment.chosen,
    equipmentOther: equipment.other,
    pickupDetails: prefillDetails(job.pickup),
    deliveryDetails: prefillDetails(job.dropoff),
    stops: (job.stops ?? []).map(stop => ({
      address: stop.address,
      lat: stop.latitude ?? 0,
      lng: stop.longitude ?? 0,
      details: prefillDetails(stop),
    })),
  };
}

/** A file as the dispatch API takes it: base64 text with a name and type. */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}
