import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import { AcknowledgeJobPayload, AddJobNotePayload, AddPODAttachmentPayload, CancelJobPayload, CreateJobPayload, GetJobPayload, GetJobTimelinePayload, GetJobTimelineResponse, Job, ListJobsPayload, OptimizeMultiStopRoutePayload, SetJobToDriverOrVehiclePayload, SuggestOptimalRoutePayload, OptimalRoute, PublishJobStatusPayload, SearchDispatchPayload, SearchDispatchResponse, UpdateJobPriorityPayload } from "./types";

export async function createJob(payload: CreateJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>("/dispatch/jobs", payload.data)
 return data
}

export async function listJobs(payload: ListJobsPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Job[]>>("/fleet/jobs", {
  params: payload.params
 })
 return data;
}

export async function getJob(payload: GetJobPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}`, {
  params: payload.params
 })
 return data
}

export async function searchDispatch(payload: SearchDispatchPayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<SearchDispatchResponse>>("/fleet/dispatch/search", {
  params: payload.params
 })
 return data;
}

export async function publishJobStatus(payload: PublishJobStatusPayload) {
 const { data } = await axiosInstance.post("/fleet/events/job-status", undefined, {
  params: payload.params
 })
 return data
}

export async function setJobToDriverOrVehicle(payload: SetJobToDriverOrVehiclePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/assign`, payload.data);
 return data
}

export async function acknowledgeJob(payload: AcknowledgeJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/acknowledge`, payload.data)
 return data
}

export async function cancelJob(payload: CancelJobPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/cancel`, payload.data)
 return data
}

export async function addJobNote(payload: AddJobNotePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/notes`, payload.data)
 return data
}

export async function addPODAttachment(payload: AddPODAttachmentPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/pod-attachments`, payload.data)
 return data
}

export async function updateJobPriority(payload: UpdateJobPriorityPayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<Job>>(`/dispatch/jobs/${payload.jobId}/scheduling`, payload.data)
 return data
}

export async function getJobTimeline(payload: GetJobTimelinePayload) {
 const { data } = await axiosInstance.get<ServerSuccessResponse<GetJobTimelineResponse>>(`/dispatch/jobs/${payload.jobId}/status`, {
  params: payload.params
 })
 return data
}

export async function suggestOptimatRouteForJob(payload: SuggestOptimalRoutePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<OptimalRoute>>("/dispatch/routes/suggest", payload.data)
 return data
}

export async function optimizeMultiStopRoute(payload: OptimizeMultiStopRoutePayload) {
 const { data } = await axiosInstance.post<ServerSuccessResponse<OptimalRoute>>("/dispatch/routes/optimize", payload.data)
 return data
}
