import type { ColumnDef } from "@tanstack/react-table";
import type { SimRow } from "./simInventoryShared";
import type { SimRowActions } from "./SimRowMenu";
import {
  Building2,
  Cpu,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Progress } from "@/components/shadcn/progress";
import {
  EmptyCell,
  SimSignalIcon,
  SimStatusBadge,
} from "./SimInventoryBadges";
import {
  EMPTY_VALUE,
  getUsagePercentage,
} from "./simInventoryShared";
import { SimRowMenu } from "./SimRowMenu";

type SimColumnOptions = SimRowActions & {
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
};

export function getSimColumns(options: SimColumnOptions): ColumnDef<SimRow>[] {
  return [
    {
      id: "select",
      meta: { className: "w-12" },
      header: () => (
        <Checkbox
          checked={options.allSelected}
          onCheckedChange={options.onToggleAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={options.selectedIds.has(row.original.id)}
          onCheckedChange={() => options.onToggleOne(row.original.id)}
        />
      ),
    },
    {
      id: "simId",
      meta: { className: "min-w-[110px]" },
      header: "SIM ID",
      cell: ({ row }) => (
        <span
          className="rounded bg-secondary px-2 py-1 font-mono text-xs"
          title={row.original.id}
        >
          {row.original.id.slice(
            0,
            8,
          )}
        </span>
      ),
    },
    {
      id: "iccid",
      meta: { className: "min-w-[190px]" },
      header: "ICCID",
      cell: ({ row }) => <p className="font-mono text-sm">{row.original.iccid}</p>,
    },
    {
      id: "msisdn",
      meta: { className: "min-w-[150px]" },
      header: "Phone Number",
      cell: ({ row }) => <p className="font-mono text-sm">{row.original.msisdn ?? EMPTY_VALUE}</p>,
    },
    {
      id: "carrier",
      meta: { className: "min-w-[120px]" },
      header: "Carrier",
      cell: ({ row }) => <Badge variant="outline">{row.original.carrier}</Badge>,
    },
    {
      id: "tenant",
      meta: { className: "min-w-[180px]" },
      header: "Tenant",
      cell: ({ row }) =>
        row.original.tenant
          ? (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{row.original.tenant}</span>
              </div>
            )
          : <EmptyCell />,
    },
    {
      id: "device",
      meta: { className: "min-w-[160px]" },
      header: "Device",
      cell: ({ row }) =>
        row.original.deviceId
          ? (
              <div
                className="flex items-center gap-2"
                title={row.original.deviceId}
              >
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {row.original.deviceImei ?? row.original.deviceId.slice(
                    0,
                    8,
                  )}
                </span>
              </div>
            )
          : <EmptyCell />,
    },
    {
      id: "status",
      meta: { className: "min-w-[130px]" },
      header: "Status",
      cell: ({ row }) => <SimStatusBadge status={row.original.status} />,
    },
    {
      id: "dataUsage",
      meta: { className: "min-w-[150px]" },
      header: "Data Usage",
      cell: ({ row }) => (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1">
            <span>
              {row.original.dataUsage}
              {" "}
              MB
            </span>
            <span className="text-muted-foreground">
              /
              {" "}
              {row.original.dataLimit}
            </span>
          </div>
          <Progress
            value={getUsagePercentage(
              row.original.dataUsage,
              row.original.dataLimit,
            )}
            className="h-1.5"
          />
        </div>
      ),
    },
    {
      id: "signal",
      meta: { className: "min-w-[110px]" },
      header: "Signal",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <SimSignalIcon
            strength={row.original.signalStrength}
            status={row.original.status}
          />
          {row.original.status === "active" && row.original.networkType && (
            <span className="text-xs">{row.original.networkType}</span>
          )}
          {row.original.roaming && (
            <span title="Roaming">
              <Globe className="h-3 w-3 text-warning" />
            </span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      meta: { className: "w-12" },
      header: "",
      cell: ({ row }) => (
        <SimRowMenu
          sim={row.original}
          options={options}
        />
      ),
    },
  ];
}
