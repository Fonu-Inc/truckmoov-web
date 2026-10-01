import type { ServerResponse } from '../lib/types'

// ponytail: the server accepts camelCase aliases alongside the snake_case body
// fields on several routes. Only the canonical form the spec marks required is
// typed, plus the camelCase fields that are the *only* form the spec offers
// (the dispatch-UI create payload).

// ─── Jobs — queries ───────────────────────────────────────────────────────────

export type DispatchJobStatusFilter =
  | 'all'
  | 'pending'
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'en-route'
  | 'arrived'
  | 'loaded'
  | 'completed'
  | 'delivered'
  | 'cancelled'

export type JobsQuery = {
  params?: {
    status?: DispatchJobStatusFilter
    query?: string
    driver_id?: string
    vehicle_id?: string
    weight_from?: number
    weight_to?: number
    amount_from?: number
    amount_to?: number
    /** YYYY-MM-DD */
    deadline?: string
  }
}

// ─── Shared body objects ──────────────────────────────────────────────────────

export type DispatchJobPriority = 'low' | 'normal' | 'high' | 'urgent'

export type CreateJobStopPayload = {
  address: string
  contact_name?: string
  contact_phone?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export type DispatchJobTimeWindow = {
  pickup_start?: string
  pickup_end?: string
  dropoff_start?: string
  dropoff_end?: string
}

export type DispatchHeaderMedia = {
  type?: 'image' | 'video' | 'document'
  id?: string
  link?: string
  filename?: string
}

export type DispatchButtonParameter = {
  index: number
  type?: 'quick_reply' | 'url' | 'copy_code'
  text?: string
  payload?: string
}

// ─── Jobs — create ────────────────────────────────────────────────────────────

export type CreateJobPayload = {
  data: {
    // Required by the dispatch-UI create contract.
    pickupLocation: string
    deliveryLocation: string
    // ponytail: the spec marks this required, but the UI creates jobs unassigned
    // and assigns a vehicle via /assign. Tighten it if the server rejects the omission.
    vehicleId?: string

    pickupAddress?: string
    pickupLat?: number
    pickupLng?: number
    deliveryAddress?: string
    deliveryLat?: number
    deliveryLng?: number

    driverId?: string
    driverPhone?: string
    driver_id?: string
    driver_phone?: string
    vehicle_id?: string

    pickup?: CreateJobStopPayload
    dropoff?: CreateJobStopPayload
    // ponytail: not in the published create schema, but the UI sends multi-stop jobs.
    stops?: CreateJobStopPayload[]

    amount?: number
    cargoDescription?: string
    cargoType?: string
    cargoWeight?: number
    load_weight_kg?: number
    load_volume_m3?: number
    required_vehicle_type?: string
    estimated_service_minutes?: number

    priority?: DispatchJobPriority
    deadline?: string
    reference?: string
    job_id?: string
    notes?: string
    additionalNotes?: string
    time_window?: DispatchJobTimeWindow
  }
}

/** PATCH / PUT /dispatch/jobs/{jobId} — a narrower body than create. */
export type UpdateJobDetailsPayload = {
  jobId: string
  data: {
    pickup?: CreateJobStopPayload
    dropoff?: CreateJobStopPayload
    stops?: CreateJobStopPayload[]
    amount?: number
    cargo_description?: string
    cargo_type?: string
    load_weight_kg?: number
    load_volume_m3?: number
    deadline?: string
  }
}

export type DeleteJobPayload = {
  jobId: string
}

// ─── Jobs — mutations ─────────────────────────────────────────────────────────

export type AcknowledgeJobPayload = {
  jobId: string
  data: {
    driver_id?: string
  }
}

export type AssignJobPayload = {
  jobId: string
  // At least one of driver_id / vehicle_id; the side not sent keeps its current value.
  data: {
    driver_id?: string
    vehicle_id?: string
    driver_phone?: string
    reason?: string
  }
}

export type CancelJobPayload = {
  jobId: string
  data: {
    reason: string
  }
}

export type DispatchJobStatus =
  | 'created'
  | 'assigned'
  | 'en-route'
  | 'arrived'
  | 'loaded'
  | 'delivered'
  | 'cancelled'

export type UpdateJobStatusPayload = {
  jobId: string
  data: {
    status: DispatchJobStatus
  }
}

export type UpdateJobSchedulingPayload = {
  jobId: string
  data: {
    priority?: DispatchJobPriority
    time_window?: DispatchJobTimeWindow
  }
}

export type SendWhatsappInstructionPayload = {
  jobId: string
  data: {
    driver_id: string
    driver_name: string
    template_name: string
    to?: string
    language?: string
    header_media?: DispatchHeaderMedia
    button_parameters?: DispatchButtonParameter[]
  }
}

export type AddJobNotePayload = {
  jobId: string
  data: {
    text: string
    author_id?: string
  }
}

export type AddPodAttachmentPayload = {
  jobId: string
  data: {
    kind: string
    url: string
    uploaded_by?: string
  }
}

// ─── Driver status requests ───────────────────────────────────────────────────

export type DriverStatusKeyword = 'ENROUTE' | 'ARRIVED' | 'LOADED' | 'DELIVERED'

export type CreateDriverStatusRequestPayload = {
  jobId: string
  data: {
    driver_id: string
    keyword: DriverStatusKeyword
    driver_phone?: string
    channel?: string
    raw_message?: string
    source_message_id?: string
  }
}

export type ConfirmDriverStatusRequestPayload = {
  jobId: string
  requestId: string
}

// ─── Legacy & routes ──────────────────────────────────────────────────────────

export type LegacyStatusPayload = {
  data: {
    job_id: string
    new_status: string
    previous_status?: string
    driver_id?: string
    vehicle_id?: string
    reason?: string
  }
}

export type OptimizeRouteOrigin = {
  latitude: number
  longitude: number
  address?: string
  label?: string
}

export type OptimizeRouteVehicle = {
  vehicle_id?: string
  vehicle_type?: string
  capacity_weight_kg?: number
  capacity_volume_m3?: number
  average_speed_kph?: number
}

export type OptimizeRouteDriverShift = {
  start?: string
  end?: string
}

export type OptimizeRoutePayload = {
  data: {
    job_ids?: string[]
    vehicle?: OptimizeRouteVehicle
    origin?: OptimizeRouteOrigin
    departure_time?: string
    driver_shift?: OptimizeRouteDriverShift
  }
}

// ─── Response entity types ────────────────────────────────────────────────────

export type DispatchStop = {
  address: string
  latitude?: number
  longitude?: number
  contact_name?: string
  contact_phone?: string
  notes?: string
}

export type DispatchJobNote = {
  id?: string
  text?: string
  author_id?: string
  created_at?: string
}

export type DispatchJobPODAttachment = {
  id?: string
  kind?: string
  url?: string
  uploaded_by?: string
  uploaded_at?: string
}

export type DispatchDriverStatusRequest = {
  id?: string
  driver_id?: string
  driver_phone?: string
  keyword?: string
  channel?: string
  raw_message?: string
  source_message_id?: string
  requested_status?: 'en-route' | 'arrived' | 'loaded' | 'delivered'
  state?: 'pending' | 'confirmed'
  requested_at?: string
  confirmed_at?: string
  confirmed_by?: string
}

export type DispatchJobTimelineEntry = {
  id?: string
  type?: string
  summary?: string
  occurred_at?: string
  metadata?: Record<string, string>
}

export type DispatchJob = {
  id?: string
  status?: string
  priority?: DispatchJobPriority
  reference?: string
  amount_ngn?: number
  assigned_driver_id?: string
  assigned_driver_phone?: string
  assigned_vehicle_id?: string
  pickup?: DispatchStop
  dropoff?: DispatchStop
  cargo_description?: string
  cargo_type?: string
  load_volume_m3?: number
  load_weight_kg?: number
  required_vehicle_type?: string
  deadline?: string
  estimated_service_minutes?: number
  cancellation_reason?: string
  notes?: DispatchJobNote[]
  pod_attachments?: DispatchJobPODAttachment[]
  driver_status_requests?: DispatchDriverStatusRequest[]
  time_window?: DispatchJobTimeWindow
  timeline?: DispatchJobTimelineEntry[]
  created_at?: string
  updated_at?: string
  acknowledged_at?: string

  // Always sent; null when nothing is assigned or fleet couldn't be read.
  assigned_driver_name?: string | null
  assigned_vehicle_reg?: string | null
  assigned_vehicle_make?: string | null
  assigned_vehicle_model?: string | null
  stops?: DispatchStop[]
}

export type DispatchJobSummary = {
  total?: number
  by_status?: Record<string, number>
  // ponytail: not in the published schema — see the DispatchJob note above.
  total_value_ngn?: number
}

export type RouteManeuver = {
  instruction?: string
  type?: number
  length?: number
  time?: number
  bearing_before?: number
  bearing_after?: number
  begin_shape_index?: number
  end_shape_index?: number
  street_names?: string[]
  travel_mode?: string
  travel_type?: string
  verbal_pre_transition_instruction?: string
  verbal_post_transition_instruction?: string
  verbal_transition_alert_instruction?: string
}

export type RouteStep = {
  sequence?: number
  label?: string
  address?: string
  stop_type?: string
  latitude?: number
  longitude?: number
  job_id?: string
  arrival_at?: string
  departure_at?: string
  eta_seconds?: number
  distance_from_previous_km?: number
  travel_seconds_from_prev?: number
  shape?: string
  alternate_shapes?: string[]
  maneuvers?: RouteManeuver[]
}

export type RouteAlternative = {
  route_index?: number
  eta_seconds?: number
  total_distance_km?: number
  total_duration_seconds?: number
  completion_time?: string
  ordered_steps?: RouteStep[]
}

export type RoutePlan = {
  vehicle_id?: string
  vehicle_type?: string
  feasible?: boolean
  infeasibility_reasons?: string[]
  departure_time?: string
  completion_time?: string
  eta_seconds?: number
  total_distance_km?: number
  total_duration_seconds?: number
  ordered_steps?: RouteStep[]
  alternate_routes?: RouteAlternative[]
}

/** POST /dispatch/jobs/status — unenveloped event ack. */
export type EventPublishedResponse = {
  event_id?: string
  published?: boolean
  subject?: string
}

// ─── Response envelopes ───────────────────────────────────────────────────────

export type DispatchJobResponse = ServerResponse<DispatchJob>
export type DispatchJobListResponse = ServerResponse<DispatchJob[]>
export type DispatchJobSummaryResponse = ServerResponse<DispatchJobSummary>
export type DispatchJobTimelineResponse = ServerResponse<{
  job_id?: string
  timeline?: DispatchJobTimelineEntry[]
}>
export type DriverStatusRequestActionResponse = ServerResponse<{
  job?: DispatchJob
  request?: DispatchDriverStatusRequest
}>
