import { axiosInstance } from '../lib/axios-instance'

import type {
  AcknowledgeJobPayload,
  AddJobNotePayload,
  AddPodAttachmentPayload,
  AssignJobPayload,
  CancelJobPayload,
  ConfirmDriverStatusRequestPayload,
  CreateDriverStatusRequestPayload,
  CreateJobPayload,
  DispatchJobListResponse,
  DispatchJobResponse,
  DispatchJobSummaryResponse,
  DispatchJobTimelineResponse,
  DriverStatusRequestActionResponse,
  EventPublishedResponse,
  JobsQuery,
  DeleteJobPayload,
  LegacyStatusPayload,
  OptimizeRoutePayload,
  RoutePlan,
  SendWhatsappInstructionPayload,
  UpdateJobDetailsPayload,
  UpdateJobSchedulingPayload,
  UpdateJobStatusPayload,
} from './types'

// ─── Jobs — queries ───────────────────────────────────────────────────────────

export async function getJobs(payload?: JobsQuery) {
  const { data } = await axiosInstance.get<DispatchJobListResponse>('/dispatch/jobs', { params: payload?.params })
  return data
}

export async function getJobsSummary() {
  const { data } = await axiosInstance.get<DispatchJobSummaryResponse>('/dispatch/jobs/summary')
  return data
}

export async function getJob({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.get<DispatchJobResponse>(`/dispatch/jobs/${jobId}`)
  return data
}

export async function getJobTimeline({ jobId }: { jobId: string }) {
  const { data } = await axiosInstance.get<DispatchJobTimelineResponse>(`/dispatch/jobs/${jobId}/timeline`)
  return data
}

// ─── Jobs — mutations ─────────────────────────────────────────────────────────

export async function createJob({ data }: CreateJobPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>('/dispatch/jobs', data)
  return res
}

export async function updateJobDetails({ jobId, data }: UpdateJobDetailsPayload) {
  const { data: res } = await axiosInstance.patch<DispatchJobResponse>(`/dispatch/jobs/${jobId}`, data)
  return res
}

export async function deleteJob({ jobId }: DeleteJobPayload) {
  await axiosInstance.delete(`/dispatch/jobs/${jobId}`)
}

export async function acknowledgeJob({ jobId, data }: AcknowledgeJobPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/acknowledge`, data)
  return res
}

export async function assignJob({ jobId, data }: AssignJobPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/assign`, data)
  return res
}

export async function cancelJob({ jobId, data }: CancelJobPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/cancel`, data)
  return res
}

export async function updateJobStatus({ jobId, data }: UpdateJobStatusPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/status`, data)
  return res
}

export async function updateJobScheduling({ jobId, data }: UpdateJobSchedulingPayload) {
  const { data: res } = await axiosInstance.patch<DispatchJobResponse>(`/dispatch/jobs/${jobId}/scheduling`, data)
  return res
}

export async function sendWhatsappInstruction({ jobId, data }: SendWhatsappInstructionPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(
    `/dispatch/jobs/${jobId}/send-whatsapp-instruction`,
    data,
  )
  return res
}

export async function addJobNote({ jobId, data }: AddJobNotePayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/notes`, data)
  return res
}

export async function addPodAttachment({ jobId, data }: AddPodAttachmentPayload) {
  const { data: res } = await axiosInstance.post<DispatchJobResponse>(`/dispatch/jobs/${jobId}/pod-attachments`, data)
  return res
}

// ─── Driver status requests ───────────────────────────────────────────────────

export async function createDriverStatusRequest({
  jobId,
  data,
}: CreateDriverStatusRequestPayload) {
  const { data: res } = await axiosInstance.post<DriverStatusRequestActionResponse>(
    `/dispatch/jobs/${jobId}/driver-status-requests`,
    data,
  )
  return res
}

export async function confirmDriverStatusRequest({
  jobId,
  requestId,
}: ConfirmDriverStatusRequestPayload) {
  const { data } = await axiosInstance.post<DriverStatusRequestActionResponse>(
    `/dispatch/jobs/${jobId}/driver-status-requests/${requestId}/confirm`,
  )
  return data
}

// ─── Legacy & routes ──────────────────────────────────────────────────────────

export async function legacyUpdateJobStatus({ data }: LegacyStatusPayload) {
  const { data: res } = await axiosInstance.post<EventPublishedResponse>('/dispatch/jobs/status', data)
  return res
}

export async function optimizeRoute({ data }: OptimizeRoutePayload) {
  const { data: res } = await axiosInstance.post<RoutePlan>('/dispatch/routes/optimize', data)
  return res
}
