import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  acknowledgeJob,
  addJobAttachment,
  addJobNote,
  addPodAttachment,
  assignJob,
  cancelJob,
  confirmDriverStatusRequest,
  createDriverStatusRequest,
  createJob,
  deleteJob,
  getJob,
  getJobAttachment,
  getJobTimeline,
  getJobs,
  getJobsSummary,
  legacyUpdateJobStatus,
  optimizeRoute,
  resendDriverInstruction,
  sendWhatsappInstruction,
  updateJobDetails,
  updateJobScheduling,
  updateJobStatus,
} from './requests'

export type * from './types'

import type { JobsQuery } from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const DISPATCH_QUERY_KEY = {
  jobsRoot: ['dispatch', 'jobs'],
  jobs: (payload?: JobsQuery) => ['dispatch', 'jobs', payload],
  jobsSummary: ['dispatch', 'jobs', 'summary'],
  job: (jobId: string) => ['dispatch', 'job', jobId],
  jobTimeline: (jobId: string) => ['dispatch', 'jobTimeline', jobId],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getJobsQueryOptions(payload?: JobsQuery) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.jobs(payload),
    queryFn: () => getJobs(payload),
    placeholderData: keepPreviousData,
  })
}

export function getJobsSummaryQueryOptions() {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.jobsSummary,
    queryFn: getJobsSummary,
  })
}

export function getJobQueryOptions(jobId: string) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.job(jobId),
    queryFn: () => getJob({ jobId }),
    enabled: Boolean(jobId),
  })
}

export function getJobTimelineQueryOptions(jobId: string) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId),
    queryFn: () => getJobTimeline({ jobId }),
    enabled: Boolean(jobId),
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

type PollingOptions = { refetchInterval?: number }

export function useJobs(payload?: JobsQuery, options?: PollingOptions) {
  return useQuery({ ...getJobsQueryOptions(payload), refetchInterval: options?.refetchInterval })
}

export function useJobsSummary() {
  return useQuery(getJobsSummaryQueryOptions())
}

export function useJob(jobId: string, options?: PollingOptions) {
  return useQuery({ ...getJobQueryOptions(jobId), refetchInterval: options?.refetchInterval })
}

export function useJobTimeline(jobId: string) {
  return useQuery(getJobTimelineQueryOptions(jobId))
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateJob() {
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useUpdateJobDetails() {
  return useMutation({
    mutationFn: updateJobDetails,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useDeleteJob() {
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useAcknowledgeJob() {
  return useMutation({
    mutationFn: acknowledgeJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useAssignJob() {
  return useMutation({
    mutationFn: assignJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useCancelJob() {
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useUpdateJobStatus() {
  return useMutation({
    mutationFn: updateJobStatus,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useUpdateJobScheduling() {
  return useMutation({
    mutationFn: updateJobScheduling,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useResendDriverInstruction() {
  return useMutation({
    mutationFn: resendDriverInstruction,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
    },
  })
}

export function useSendWhatsappInstruction() {
  return useMutation({ mutationFn: sendWhatsappInstruction })
}

export function useAddJobNote() {
  return useMutation({
    mutationFn: addJobNote,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useAddJobAttachment() {
  return useMutation({
    mutationFn: addJobAttachment,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useDownloadJobAttachment() {
  return useMutation({ mutationFn: getJobAttachment })
}

export function useAddPodAttachment() {
  return useMutation({
    mutationFn: addPodAttachment,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useCreateDriverStatusRequest() {
  return useMutation({
    mutationFn: createDriverStatusRequest,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useConfirmDriverStatusRequest() {
  return useMutation({
    mutationFn: confirmDriverStatusRequest,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useLegacyUpdateJobStatus() {
  return useMutation({
    mutationFn: legacyUpdateJobStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsRoot })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobsSummary })
    },
  })
}

export function useOptimizeRoute() {
  return useMutation({ mutationFn: optimizeRoute })
}
