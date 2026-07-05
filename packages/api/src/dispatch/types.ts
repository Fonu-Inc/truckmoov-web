// ─── Jobs — queries ───────────────────────────────────────────────────────────

export type JobsQuery = {
  params?: {
    status?: 'all' | 'pending' | 'created' | 'assigned' | 'in_progress' | 'en-route' | 'arrived' | 'loaded' | 'completed' | 'delivered' | 'cancelled'
    query?: string
    driver_id?: string
    vehicle_id?: string
  }
}

// ─── Jobs — create ────────────────────────────────────────────────────────────

export type CreateJobStopPayload = {
  address: string
  contact_name?: string
  contact_phone?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export type CreateJobPayload = {
  data: {
    pickup?: CreateJobStopPayload
    dropoff?: CreateJobStopPayload
    stops?: CreateJobStopPayload[]
    amount_ngn?: number
    cargo_description?: string
    cargo_type?: string
    load_weight_kg?: number
    priority?: 'low' | 'medium' | 'normal' | 'high' | 'urgent'
    deadline?: string
    reference?: string
    vehicleId?: string
    pickupLocation?: string
    deliveryLocation?: string
    driverId?: string
    driverPhone?: string
    amount?: number
    cargoDescription?: string
    cargoType?: string
    cargoWeight?: number
    notes?: string
    load_volume_m3?: number
    required_vehicle_type?: string
    estimated_service_minutes?: number
  }
}

export type UpdateJobDetailsPayload = {
  jobId: string
  data: {
    pickup: CreateJobStopPayload
    dropoff: CreateJobStopPayload
    stops?: CreateJobStopPayload[]
    cargo_type?: string
    cargo_description?: string
    amount_ngn?: number
    deadline?: string
    load_weight_kg?: number
    load_volume_m3?: number
    priority?: 'low' | 'medium' | 'normal' | 'high' | 'urgent'
    required_vehicle_type?: string
    estimated_service_minutes?: number
    reference?: string
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
  data: {
    driver_id: string
    vehicle_id: string
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

export type UpdateJobStatusPayload = {
  jobId: string
  data: {
    status: 'created' | 'assigned' | 'en-route' | 'arrived' | 'loaded' | 'delivered' | 'cancelled'
  }
}

export type UpdateJobSchedulingPayload = {
  jobId: string
  data: {
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    time_window?: Record<string, unknown>
  }
}

export type SendWhatsappInstructionPayload = {
  jobId: string
  data: {
    driver_id: string
    template_name: string
    driver_name: string
    header_media?: Record<string, unknown>
    button_parameters?: Record<string, unknown>[]
    language?: string
    to?: string
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

export type CreateDriverStatusRequestPayload = {
  jobId: string
  data: {
    driver_id: string
    keyword: 'ENROUTE' | 'ARRIVED' | 'LOADED' | 'DELIVERED'
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

export type OptimizeRoutePayload = {
  data: {
    job_ids?: string[]
    vehicle?: Record<string, unknown>
    origin?: Record<string, unknown>
    departure_time?: string
    driver_shift?: Record<string, unknown>
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

export type DispatchJobTimeWindow = {
  pickup_start?: string
  pickup_end?: string
  dropoff_start?: string
  dropoff_end?: string
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
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  reference?: string
  amount_ngn?: number
  assigned_driver_id?: string
  assigned_driver_phone?: string
  assigned_vehicle_id?: string
  pickup?: DispatchStop
  dropoff?: DispatchStop
  stops?: DispatchStop[]
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
}

export type DispatchJobSummary = {
  total?: number
  by_status?: Record<string, number>
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

export type EventPublishedResponse = {
  event_id?: string
  published?: boolean
  subject?: string
}

import type { ServerResponse } from '../lib/types'

// ─── Response envelopes ───────────────────────────────────────────────────────

export type DispatchJobResponse = ServerResponse<DispatchJob>
export type DispatchJobListResponse = ServerResponse<DispatchJob[]>
export type DispatchJobSummaryResponse = ServerResponse<DispatchJobSummary>
export type DispatchJobTimelineResponse = ServerResponse<{ job_id: string; timeline: DispatchJobTimelineEntry[] }>
export type DriverStatusRequestActionResponse = ServerResponse<{ job: DispatchJob; request: DispatchDriverStatusRequest }>
