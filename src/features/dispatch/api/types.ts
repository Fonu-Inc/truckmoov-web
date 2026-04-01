export type JobDropOff = {
 "address": string,
 "contact_name": string,
 "contact_phone": string,
 "latitude": number,
 "longitude": number,
 "notes": string
}

export type JobPickup = {
 "address": string,
 "contact_name": string,
 "contact_phone": string,
 "latitude": number,
 "longitude": number,
 "notes": string
}

export type JobPriority = "low" | "normal" | "high" | "urgent"

export type JobTimeWindow = {
 "dropoff_end": string,
 "dropoff_start": string,
 "pickup_end": string,
 "pickup_start": string
}

export type JobNotes = {
 "author_id": string,
 "created_at": string,
 "id": string,
 "text": string
}

export type JobPodAttachment = {
 "id": string,
 "kind": string,
 "uploaded_at": string,
 "uploaded_by": string,
 "url": string
}

export type JobTimeline = {
 "id": string,
 "metadata": Record<string, string>,
 "occurred_at": string,
 "summary": string,
 "type": string
}

export type Job = {
 "acknowledged_at": string,
 "amount_ngn": number,
 "assigned_driver_id": string,
 "assigned_vehicle_id": string,
 "cancellation_reason": string,
 "cargo_description": string,
 "cargo_type": string,
 "created_at": string,
 "deadline": string,
 "dropoff": JobDropOff,
 "estimated_service_minutes": number,
 "id": string,
 "load_volume_m3": number,
 "load_weight_kg": number,
 "notes": JobNotes[],
 "pickup": JobPickup,
 "pod_attachments": JobPodAttachment[],
 "priority": JobPriority,
 "reference": string,
 "required_vehicle_type": string,
 "status": JobStatus,
 "tenant_id": string,
 "time_window": JobTimeWindow,
 "timeline": JobTimeline[],
 "updated_at": string
}

export type JobStatus = "created" | "assigned" | "en-route" | "arrived" | "loaded" | "delivered" | "cancelled"

export type OptimalRouteOrderedSteps = {
  "address": string,
  "arrival_at": string,
  "departure_at": string,
  "distance_from_previous_km": number,
  "eta_seconds": number,
  "job_id": string,
  "label": string,
  "latitude": number,
  "longitude": number,
  "sequence": number,
  "stop_type": string,
  "travel_seconds_from_prev": number
}

export type OptimalRoute = {
 "completion_time": string,
 "departure_time": string,
 "eta_seconds": number,
 "feasible": boolean,
 "infeasibility_reasons": string[],
 "ordered_steps": OptimalRouteOrderedSteps[],
 "total_distance_km": number,
 "total_duration_seconds": number,
 "vehicle_id": string,
 "vehicle_type": string
}

// Payloads

type CreateJobData = {
 "additionalNotes": string,
 "amount": number,
 "cargoDescription": string,
 "cargoType": string,
 "cargoWeight": number,
 "deadline": string,
 "deliveryAddress": string,
 "deliveryLat": number,
 "deliveryLng": number,
 "deliveryLocation": string,
 "driverId": string,
 "driver_id": string,
 "dropoff": JobDropOff,
 "estimated_service_minutes": number,
 "job_id": string,
 "load_volume_m3": number,
 "load_weight_kg": number,
 "notes": string,
 "pickup": JobPickup
 "pickupAddress": string,
 "pickupLat": number,
 "pickupLng": number,
 "pickupLocation": string,
 "priority": JobPriority,
 "reference": string,
 "required_vehicle_type": string,
 "time_window": JobTimeWindow,
 "vehicleId": string,
 "vehicle_id": string,
}

export type CreateJobPayload = {
 data: Partial<CreateJobData>
}

export type ListJobPayload = {
 params: {
  status?: JobStatus;
  tenant_id?: string;
  query?: string;
  driver_id?: string;
  vehicle_id?: string;
 }
}

export type GetJobPayload = {
 jobId: string;
 params: {
  tenant_id: string
 }
}

export type SetJobToDriverOrVehiclePayload = {
 jobId: string;
 data: {
  "driver_id": string,
  "reason": string,
  "vehicle_id": string
 }
}

export type AcknowledgeJobPayload = {
 jobId: string;
 data: {
  "driver_id": string,
  "tenant_id": string
 }
}

export type CancelJobPayload = {
 jobId: string;
 data: {
  "reason": string
 }
}

export type AddJobNotePayload = {
 jobId: string;
 data: {
  "author_id": string,
  "text": string
 }
}

export type AddPODAttachmentPayload = {
 jobId: string;
 data: {
  "kind": string,
  "uploaded_by": string,
  "url": string
 }
}

export type UpdateJobPriorityPayload = {
 jobId: string;
 data: {
  "priority"?: JobPriority;
  "time_window"?: JobTimeWindow;
 }
}

export type GetJobTimelinePayload = {
 jobId: string;
 params: {
  tenant_id: string
 }
}

export type GetJobTimelineResponse = {
 job_id: string;
 timeline: JobTimeline[];
}

export type OptimizeMultiStopRoutePayload = {
 data: {
  "departure_time": string,
  "driver_shift": {
   "end": string,
   "start": string
  },
  "job_ids": string[],
  "origin": {
   "address": string,
   "label": string,
   "latitude": number,
   "longitude": number
  },
  "tenant_id": string,
  "vehicle": {
   "average_speed_kph": number,
   "capacity_volume_m3": number,
   "capacity_weight_kg": number,
   "vehicle_id": string,
   "vehicle_type": string
  }
 }
}

export type SuggestOptimalRoutePayload = {
 data: {
  "departure_time": string,
  "driver_shift": {
   "end": string,
   "start": string
  },
  "job_id": string,
  "origin": {
   "address": string,
   "label": string,
   "latitude": number,
   "longitude": number
  },
  "tenant_id": string,
  "vehicle": {
   "average_speed_kph": number,
   "capacity_volume_m3": number,
   "capacity_weight_kg": number,
   "vehicle_id": string,
   "vehicle_type": string
  }
 }
}
