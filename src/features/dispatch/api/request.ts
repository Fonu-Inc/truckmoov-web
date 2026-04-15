import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import type {
 AcknowledgeJobPayload,
 AddJobNotePayload,
 AddPODAttachmentPayload,
 AssignJobPayload,
 CancelJobPayload,
 ConfirmDriverStatusRequestPayload,
 CreateDriverStatusRequestPayload,
 CreateJobPayload,
 DriverStatusRequestActionPayload,
 EventPublishedResponse,
 GetJobPayload,
 GetJobTimelinePayload,
 GetJobTimelineResponse,
 Job,
 ListJobPayload,
 OptimizeRoutePayload,
 PublishJobStatusLegacyPayload,
 RoutePlan,
 SendWhatsAppInstructionPayload,
 UpdateJobSchedulingPayload,
 UpdateJobStatusPayload,
} from "./types";

export async function dispatchHealth() {
 const { data } = await axiosInstance.get<ServerSuccessResponse<null>>("/dispatch/health");
 return data;
}

export async function createJob(payload: CreateJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>("/dispatch/jobs", payload.data);
 return data;
}

export async function listJob(payload: ListJobPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Job[]>>("/dispatch/jobs", {
  params: payload.params,
 });
 return data;
}

export async function getJob(payload: GetJobPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}`);
 return data;
}

export async function assignJob(payload: AssignJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/assign`, payload.data);
 return data;
}

export const setJobToDriverOrVehicle = assignJob;

export async function acknowledgeJob(payload: AcknowledgeJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/acknowledge`, payload.data);
 return data;
}

export async function cancelJob(payload: CancelJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/cancel`, payload.data);
 return data;
}

export async function createDriverStatusRequest(payload: CreateDriverStatusRequestPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<DriverStatusRequestActionPayload>>(
  `/dispatch/jobs/${payload.jobId}/driver-status-requests`,
  payload.data
 );
 return data;
}

export async function confirmDriverStatusRequest(payload: ConfirmDriverStatusRequestPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<DriverStatusRequestActionPayload>>(
  `/dispatch/jobs/${payload.jobId}/driver-status-requests/${payload.requestId}/confirm`
 );
 return data;
}

export async function addJobNote(payload: AddJobNotePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/notes`, payload.data);
 return data;
}

export async function addPODAttachment(payload: AddPODAttachmentPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/pod-attachments`, payload.data);
 return data;
}

export async function updateJobScheduling(payload: UpdateJobSchedulingPayload) {
 const { data } = await axiosInstance.patch<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/scheduling`, payload.data);
 return data;
}

export const updateJobPriority = updateJobScheduling;

export async function sendWhatsAppInstruction(payload: SendWhatsAppInstructionPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(
  `/dispatch/jobs/${payload.jobId}/send-whatsapp-instruction`,
  payload.data
 );
 return data;
}

export async function updateJobStatus(payload: UpdateJobStatusPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/status`, payload.data);
 return data;
}

export async function getJobTimeline(payload: GetJobTimelinePayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<GetJobTimelineResponse>>(`/dispatch/jobs/${payload.jobId}/timeline`);
 return data;
}

export async function publishJobStatusLegacy(payload: PublishJobStatusLegacyPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<EventPublishedResponse>>("/dispatch/jobs/status", payload.data);
 return data;
}

export async function optimizeRoute(payload: OptimizeRoutePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<RoutePlan>>("/dispatch/routes/optimize", payload.data);
 return data;
}

export const optimizeMultiStopRoute = optimizeRoute;
