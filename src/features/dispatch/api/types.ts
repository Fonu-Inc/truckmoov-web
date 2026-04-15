export type Stop = {
 address: string;
 contact_name?: string;
 contact_phone?: string;
 latitude?: number;
 longitude?: number;
 notes?: string;
};

export type JobDropOff = Stop;
export type JobPickup = Stop;

export type JobPriority = "low" | "normal" | "high" | "urgent";

export type JobStatus =
 | "created"
 | "assigned"
 | "en-route"
 | "arrived"
 | "loaded"
 | "delivered"
 | "cancelled";

export type DriverReportedJobStatus = Extract<JobStatus, "en-route" | "arrived" | "loaded" | "delivered">;

export type ListJobStatusFilter =
 | "all"
 | "pending"
 | JobStatus
 | "in_progress"
 | "completed";

export type JobTimeWindow = {
 dropoff_end?: string;
 dropoff_start?: string;
 pickup_end?: string;
 pickup_start?: string;
};

export type JobNote = {
 author_id?: string;
 created_at?: string;
 id?: string;
 text?: string;
};

export type JobNotes = JobNote;

export type JobPodAttachment = {
 id?: string;
 kind?: string;
 uploaded_at?: string;
 uploaded_by?: string;
 url?: string;
};

export type JobTimelineEntry = {
 id?: string;
 metadata?: Record<string, string>;
 occurred_at?: string;
 summary?: string;
 type?: string;
};

export type JobTimeline = JobTimelineEntry;

export type DriverStatusRequestState = "pending" | "confirmed";
export type DriverStatusKeyword = "ENROUTE" | "ARRIVED" | "LOADED" | "DELIVERED" | (string & {});

export type DriverStatusRequest = {
 channel?: string;
 confirmed_at?: string;
 confirmed_by?: string;
 driver_id?: string;
 driver_phone?: string;
 id?: string;
 keyword?: string;
 raw_message?: string;
 requested_at?: string;
 requested_status?: DriverReportedJobStatus;
 source_message_id?: string;
 state?: DriverStatusRequestState;
};

export type Job = {
 acknowledged_at?: string;
 amount_ngn?: number;
 assigned_driver_id?: string;
 assigned_driver_phone?: string;
 assigned_vehicle_id?: string;
 cancellation_reason?: string;
 cargo_description?: string;
 cargo_type?: string;
 created_at?: string;
 deadline?: string;
 driver_status_requests?: DriverStatusRequest[];
 dropoff?: JobDropOff;
 estimated_service_minutes?: number;
 id?: string;
 load_volume_m3?: number;
 load_weight_kg?: number;
 notes?: JobNote[];
 pickup?: JobPickup;
 pod_attachments?: JobPodAttachment[];
 priority?: JobPriority;
 reference?: string;
 required_vehicle_type?: string;
 status?: JobStatus;
 time_window?: JobTimeWindow;
 timeline?: JobTimelineEntry[];
 updated_at?: string;
};

export type DriverStatusRequestActionPayload = {
 job?: Job;
 request?: DriverStatusRequest;
};

export type DriverStatusRequestActionResponse = {
 data: DriverStatusRequestActionPayload;
 message: string;
 status: boolean;
};

export type EventPublishedResponse = {
 event_id?: string;
 published?: boolean;
 subject?: string;
};

export type RouteLocation = {
 address?: string;
 label?: string;
 latitude: number;
 longitude: number;
};

export type DriverShift = {
 end?: string;
 start?: string;
};

export type VehicleProfile = {
 average_speed_kph?: number;
 capacity_volume_m3?: number;
 capacity_weight_kg?: number;
 vehicle_id?: string;
 vehicle_type?: string;
};

export type RouteManeuver = {
 bearing_after?: number;
 bearing_before?: number;
 begin_shape_index?: number;
 end_shape_index?: number;
 instruction?: string;
 length?: number;
 street_names?: string[];
 time?: number;
 travel_mode?: string;
 travel_type?: string;
 type?: number;
 verbal_post_transition_instruction?: string;
 verbal_pre_transition_instruction?: string;
 verbal_transition_alert_instruction?: string;
};

export type RouteStep = {
 address?: string;
 alternate_shapes?: string[];
 arrival_at?: string;
 departure_at?: string;
 distance_from_previous_km?: number;
 eta_seconds?: number;
 job_id?: string;
 label?: string;
 latitude?: number;
 longitude?: number;
 maneuvers?: RouteManeuver[];
 sequence?: number;
 shape?: string;
 stop_type?: string;
 travel_seconds_from_prev?: number;
};

export type RouteAlternative = {
 completion_time?: string;
 eta_seconds?: number;
 ordered_steps?: RouteStep[];
 route_index?: number;
 total_distance_km?: number;
 total_duration_seconds?: number;
};

export type RoutePlan = {
 alternate_routes?: RouteAlternative[];
 completion_time?: string;
 departure_time?: string;
 eta_seconds?: number;
 feasible?: boolean;
 infeasibility_reasons?: string[];
 ordered_steps?: RouteStep[];
 total_distance_km?: number;
 total_duration_seconds?: number;
 vehicle_id?: string;
 vehicle_type?: string;
};

export type OptimalRoute = RoutePlan;

export type SendJobInstructionButtonType = "quick_reply" | "url" | "copy_code";
export type SendJobInstructionHeaderMediaType = "image" | "video" | "document";

export type SendJobInstructionButtonParameter = {
 index: number;
 payload?: string;
 text?: string;
 type?: SendJobInstructionButtonType;
};

export type SendJobInstructionHeaderMedia = {
 filename?: string;
 id?: string;
 link?: string;
 type?: SendJobInstructionHeaderMediaType;
};

// Payloads

export type CreateJobData = {
 additionalNotes?: string;
 amount?: number;
 cargoDescription?: string;
 cargoType?: string;
 cargoWeight?: number;
 deadline?: string;
 deliveryAddress?: string;
 deliveryLat?: number;
 deliveryLng?: number;
 deliveryLocation?: string;
 driverId?: string;
 driverPhone?: string;
 driver_id?: string;
 driver_phone?: string;
 dropoff?: Stop;
 estimated_service_minutes?: number;
 job_id?: string;
 load_volume_m3?: number;
 load_weight_kg?: number;
 notes?: string;
 pickup?: Stop;
 pickupAddress?: string;
 pickupLat?: number;
 pickupLng?: number;
 pickupLocation?: string;
 priority?: JobPriority;
 reference?: string;
 required_vehicle_type?: string;
 time_window?: JobTimeWindow;
 vehicleId: string;
 vehicle_id?: string;
};

export type CreateJobPayload = {
 data: Partial<CreateJobData> & Pick<CreateJobData, "vehicleId">;
};

export type ListJobPayload = {
 params: {
  status?: ListJobStatusFilter;
  query?: string;
  driver_id?: string;
  vehicle_id?: string;
 };
};

export type GetJobPayload = {
 jobId: string;
};

export type AssignJobRequestData = {
 driverPhone?: string;
 driver_id: string;
 driver_phone?: string;
 reason?: string;
 vehicle_id: string;
};

export type AssignJobPayload = {
 jobId: string;
 data: AssignJobRequestData;
};

export type SetJobToDriverOrVehiclePayload = AssignJobPayload;

export type AcknowledgeJobPayload = {
 jobId: string;
 data: {
  driver_id?: string;
 };
};

export type CancelJobPayload = {
 jobId: string;
 data: {
  reason: string;
 };
};

export type AddJobNotePayload = {
 jobId: string;
 data: {
  author_id?: string;
  text: string;
 };
};

export type AddPODAttachmentPayload = {
 jobId: string;
 data: {
  kind: string;
  uploaded_by?: string;
  url: string;
 };
};

export type UpdateJobSchedulingRequestData = {
 priority?: JobPriority;
 time_window?: JobTimeWindow;
};

export type UpdateJobSchedulingPayload = {
 jobId: string;
 data: UpdateJobSchedulingRequestData;
};

export type UpdateJobPriorityPayload = UpdateJobSchedulingPayload;

export type UpdateJobStatusPayload = {
 jobId: string;
 data: {
  status: JobStatus;
 };
};

export type GetJobTimelinePayload = {
 jobId: string;
};

export type GetJobTimelineResponse = {
 job_id?: string;
 timeline?: JobTimelineEntry[];
};

export type PublishJobStatusLegacyPayload = {
 data: {
  driver_id?: string;
  job_id: string;
  new_status: string;
  previous_status?: string;
  reason?: string;
  vehicle_id?: string;
 };
};

export type CreateDriverStatusRequestData = {
 channel?: string;
 driverId?: string;
 driverPhone?: string;
 driver_id: string;
 driver_phone?: string;
 keyword: DriverStatusKeyword;
 rawMessage?: string;
 raw_message?: string;
 sourceMessageID?: string;
 source_message_id?: string;
};

export type CreateDriverStatusRequestPayload = {
 jobId: string;
 data: CreateDriverStatusRequestData;
};

export type ConfirmDriverStatusRequestPayload = {
 jobId: string;
 requestId: string;
};

export type SendWhatsAppInstructionData = {
 buttonParameters?: SendJobInstructionButtonParameter[];
 button_parameters?: SendJobInstructionButtonParameter[];
 driverId?: string;
 driverName?: string;
 driver_id: string;
 driver_name: string;
 headerMedia?: SendJobInstructionHeaderMedia;
 header_media?: SendJobInstructionHeaderMedia;
 language?: string;
 recipient?: string;
 templateName?: string;
 template_name: string;
 to?: string;
};

export type SendWhatsAppInstructionPayload = {
 jobId: string;
 data: SendWhatsAppInstructionData;
};

export type OptimizeRouteData = {
 departure_time?: string;
 driver_shift?: DriverShift;
 job_ids?: string[];
 origin?: RouteLocation;
 vehicle?: VehicleProfile;
};

export type OptimizeRoutePayload = {
 data: OptimizeRouteData;
};

export type OptimizeMultiStopRoutePayload = OptimizeRoutePayload;
