import type { JobsQuery } from "@truckmoov/api/dispatch";
import type {
  JobsFilterBounds, JobsFilterValue,
} from "@/features/jobs/components/ui/JobsFilterDialog";
import { format } from "date-fns";

export function buildDefaultFilterValue(_bounds: JobsFilterBounds): JobsFilterValue {
  return {
    weightEnabled: false,
    weightRange: [
      0,
      0,
    ],
    amountEnabled: false,
    amountRange: [
      0,
      0,
    ],
    deadlineEnabled: false,
    deadlineFrom: undefined,
    deadlineTo: undefined,
  };
}

export function countActiveFilters(value: JobsFilterValue): number {
  return [
    value.weightEnabled,
    value.amountEnabled,
    value.deadlineEnabled,
  ].filter(Boolean).length;
}

/** Maps the popover value onto the GET /dispatch/jobs filter params. The slider is tonnes; weight_from/to are kg. */
export function toJobsQueryParams(value: JobsFilterValue): NonNullable<JobsQuery["params"]> {
  const params: NonNullable<JobsQuery["params"]> = {};
  if (value.weightEnabled) {
    const [
      from,
      to,
    ] = value.weightRange;
    if (from)
      params.weight_from = from * 1000;
    if (to)
      params.weight_to = to * 1000;
  }
  if (value.amountEnabled) {
    const [
      from,
      to,
    ] = value.amountRange;
    if (from)
      params.amount_from = from;
    if (to)
      params.amount_to = to;
  }
  if (value.deadlineEnabled && value.deadlineFrom) {
    params.deadline = format(
      value.deadlineFrom,
      "yyyy-MM-dd",
    );
  }
  return params;
}
