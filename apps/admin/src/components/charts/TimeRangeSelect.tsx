import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

export type TimeRange = "7d" | "30d" | "90d" | "1y";

const OPTIONS: {
  value: TimeRange;
  label: string;
}[] = [
  {
    value: "7d",
    label: "Last 7 days",
  },
  {
    value: "30d",
    label: "Last 30 days",
  },
  {
    value: "90d",
    label: "Last 90 days",
  },
  {
    value: "1y",
    label: "Last 1 year",
  },
];

export function TimeRangeSelect({
  value,
  onChange,
  className = "w-36 h-8",
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={v => onChange(v as TimeRange)}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map(o => (
          <SelectItem
            key={o.value}
            value={o.value}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Slice/scale a demo dataset to the chosen window. */
export function sliceByRange<T>(data: T[], range: TimeRange): T[] {
  if (!data?.length)
    return data;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  if (days >= data.length)
    return data;
  return data.slice(-days);
}
