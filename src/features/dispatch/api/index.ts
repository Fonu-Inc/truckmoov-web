import { queryOptions, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { RequestPayloadExtractor } from "@/shared/types";
import {
 acknowledgeJob,
 addJobNote,
 addPODAttachment,
 assignJob,
 cancelJob,
 confirmDriverStatusRequest,
 createDriverStatusRequest,
 createJob,
 dispatchHealth,
 getJob,
 getJobTimeline,
 listJob,
 optimizeRoute,
 publishJobStatusLegacy,
 sendWhatsAppInstruction,
 updateJobScheduling,
 updateJobStatus,
} from "./request";

export const DISPATCH_QUERY_KEY = {
 health: ["dispatchHealth"],
 jobs: ["jobs"],
 job: (jobId: string) => ["job", jobId],
 jobTimeline: (jobId: string) => ["jobTimeline", jobId],
};

function invalidateJobRelatedQueries(jobId?: string) {
 if (jobId) {
  queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.job(jobId) });
  queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobTimeline(jobId) });
 }

 queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs });
}

export function dispatchHealthQueryOptions() {
 return queryOptions({
  queryKey: DISPATCH_QUERY_KEY.health,
  queryFn: () => dispatchHealth(),
 });
}

export function useCreateJob() {
 return useMutation({
  mutationFn: createJob,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs });
  },
 });
}

export function listJobQueryOptions(payload: RequestPayloadExtractor<typeof listJob>) {
 return queryOptions({
  queryKey: [...DISPATCH_QUERY_KEY.jobs, payload.params],
  queryFn: () => listJob(payload),
 });
}

export function getJobQueryOptions(payload: RequestPayloadExtractor<typeof getJob>) {
 return queryOptions({
  queryKey: DISPATCH_QUERY_KEY.job(payload.jobId),
  queryFn: () => getJob(payload),
  enabled: !!payload.jobId,
 });
}

export function useAssignJob() {
 return useMutation({
  mutationFn: assignJob,
  onSuccess: (_, variable) => {
   toast.success("Job reassigned successfully");
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export const useSetJobToDriverOrVehicle = useAssignJob;

export function useAcknowledgeJob() {
 return useMutation({
  mutationFn: acknowledgeJob,
  onSuccess: (_, variable) => {
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useCancelJob() {
 return useMutation({
  mutationFn: cancelJob,
  onSuccess: (_, variable) => {
   toast.success("Job cancelled");
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useCreateDriverStatusRequest() {
 return useMutation({
  mutationFn: createDriverStatusRequest,
  onSuccess: (_, variable) => {
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useConfirmDriverStatusRequest() {
 return useMutation({
  mutationFn: confirmDriverStatusRequest,
  onSuccess: (_, variable) => {
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useAddJobNote() {
 return useMutation({
  mutationFn: addJobNote,
  onSuccess: (_, variable) => {
   toast.success("Note added successfully");
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useAddPODAttachment() {
 return useMutation({
  mutationFn: addPODAttachment,
  onSuccess: (_, variable) => {
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useUpdateJobScheduling() {
 return useMutation({
  mutationFn: updateJobScheduling,
  onSuccess: (_, variable) => {
   toast.success("Priority updated");
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export const useUpdateJobPriority = useUpdateJobScheduling;

export function useSendWhatsAppInstruction() {
 return useMutation({
  mutationFn: sendWhatsAppInstruction,
  onSuccess: (_, variable) => {
   toast.success("Instruction sent");
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function useUpdateJobStatus() {
 return useMutation({
  mutationFn: updateJobStatus,
  onSuccess: (_, variable) => {
   invalidateJobRelatedQueries(variable.jobId);
  },
 });
}

export function getJobTimelineQueryOptions(payload: RequestPayloadExtractor<typeof getJobTimeline>) {
 return queryOptions({
  queryKey: DISPATCH_QUERY_KEY.jobTimeline(payload.jobId),
  queryFn: () => getJobTimeline(payload),
  enabled: !!payload.jobId,
 });
}

export function usePublishJobStatusLegacy() {
 return useMutation({
  mutationFn: publishJobStatusLegacy,
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: DISPATCH_QUERY_KEY.jobs });
  },
 });
}

export function useOptimizeRoute() {
 return useMutation({
  mutationFn: optimizeRoute,
 });
}

export const useOptimizeMultiStopRoute = useOptimizeRoute;
