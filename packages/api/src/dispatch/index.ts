import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  acknowledgeJob,
  addJobNote,
  addPodAttachment,
  assignJob,
  cancelJob,
  confirmDriverStatusRequest,
  createDriverStatusRequest,
  createJob,
  getJob,
  getJobTimeline,
  getJobs,
  legacyUpdateJobStatus,
  optimizeRoute,
  sendWhatsappInstruction,
  updateJobScheduling,
  updateJobStatus,
} from './requests'

export type * from './types'

import type { JobsQuery } from './types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const DISPATCH_QUERY_KEY = {
  jobs: (payload?: JobsQuery) => ['dispatch', 'jobs', payload],
  job: (jobId: string) => ['dispatch', 'job', jobId],
  jobTimeline: (jobId: string) => ['dispatch', 'jobTimeline', jobId],
} as const

// ─── queryOptions factories ───────────────────────────────────────────────────

export function getJobsQueryOptions(payload?: JobsQuery) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.jobs(payload),
    queryFn: () => getJobs(payload),
  })
}

export function getJobQueryOptions(jobId: string) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.job(jobId),
    queryFn: () => getJob({ jobId }),
  })
}

export function getJobTimelineQueryOptions(jobId: string) {
  return queryOptions({
    queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId),
    queryFn: () => getJobTimeline({ jobId }),
  })
}

// ─── useQuery hooks ────────────────────────────────────────────────────────────

export function useJobs(payload?: JobsQuery) {
  return useQuery(getJobsQueryOptions(payload))
}

export function useJob(jobId: string) {
  return useQuery(getJobQueryOptions(jobId))
}

export function useJobTimeline(jobId: string) {
  return useQuery(getJobTimelineQueryOptions(jobId))
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateJob() {
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
    },
  })
}

export function useAcknowledgeJob() {
  return useMutation({
    mutationFn: acknowledgeJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
    },
  })
}

export function useAssignJob() {
  return useMutation({
    mutationFn: assignJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
    },
  })
}

export function useCancelJob() {
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
    },
  })
}

export function useUpdateJobStatus() {
  return useMutation({
    mutationFn: updateJobStatus,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) })
    },
  })
}

export function useUpdateJobScheduling() {
  return useMutation({
    mutationFn: updateJobScheduling,
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) })
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
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
    },
  })
}

export function useLegacyUpdateJobStatus() {
  return useMutation({
    mutationFn: legacyUpdateJobStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs() })
    },
  })
}

export function useOptimizeRoute() {
  return useMutation({ mutationFn: optimizeRoute })
}
