import { queryOptions, useMutation } from "@tanstack/react-query"
import { acknowledgeJob, addJobNote, addPODAttachment, cancelJob, createJob, getJob, getJobTimeline, optimizeMultiStopRoute, setJobToDriverOrVehicle, suggestOptimatRouteForJob, updateJobPriority } from "./request"
import { queryClient } from "@/shared/providers/TanstackQueryProvider"
import { RequestPayloadExtractor } from "@/shared/types"

export const DISPATCH_QUERY_KEY = {
 jobs: ["jobs"],
 job: (jobId: string) => ["job", jobId],
 jobTimeline: (jobId: string) => ["jobTimeline", jobId],
}

export function useCreateJob() {
 return useMutation({
  mutationFn: createJob,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs })
  }
 })
}

export function getJobQueryOptions(payload: RequestPayloadExtractor<typeof getJob>) {
 return queryOptions({
  queryKey: DISPATCH_QUERY_KEY.job(payload.jobId),
  queryFn: () => getJob(payload),
  enabled: !!payload.jobId
 })
}

export function useSetJobToDriverOrVehicle() {
 return useMutation({
  mutationFn: setJobToDriverOrVehicle,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs })
  }
 })
}

export function useAcknowledgeJob() {
 return useMutation({
  mutationFn: acknowledgeJob,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs })
  }
 })
}

export function useCancelJob() {
 return useMutation({
  mutationFn: cancelJob,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs })
  }
 })
}

export function useAddJobNote() {
 return useMutation({
  mutationFn: addJobNote,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
  }
 })
}

export function useAddPODAttachment() {
 return useMutation({
  mutationFn: addPODAttachment,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
  }
 })
}

export function useUpdateJobPriority() {
 return useMutation({
  mutationFn: updateJobPriority,
  onSuccess: (_, variable) => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(variable.jobId) })
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs })
  }
 })
}

export function getJobTimelineQueryOptions(payload: RequestPayloadExtractor<typeof getJobTimeline>) {
 return queryOptions({
  queryKey: DISPATCH_QUERY_KEY.jobTimeline(payload.jobId),
  queryFn: () => getJobTimeline(payload),
  enabled: !!payload.jobId
 })
}

export function useSuggestOptimalRouteForJob() {
 return useMutation({
  mutationFn: suggestOptimatRouteForJob,
 })
}

export function useOptimizeMultiStopRoute() {
 return useMutation({
  mutationFn: optimizeMultiStopRoute,
 })
}
