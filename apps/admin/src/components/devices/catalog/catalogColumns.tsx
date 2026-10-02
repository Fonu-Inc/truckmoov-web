import type { ColumnDef } from "@tanstack/react-table";
import type {
  DeviceCatalogStatus, SystemDeviceCatalogModel,
} from "@truckmoov/api/auth";
import {
  Archive,
  Check,
  Edit,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  FEATURE_OPTIONS,
  PROTOCOL_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
} from "./catalogShared";

type CatalogColumnHandlers = {
  busy: boolean;
  onEdit: (model: SystemDeviceCatalogModel) => void;
  onStatusChange: (model: SystemDeviceCatalogModel, status: DeviceCatalogStatus) => void;
  onDelete: (model: SystemDeviceCatalogModel) => void;
};

const badgeBase = "h-6 rounded-md px-2 text-xs font-bold";

export function getCatalogColumns({
  busy,
  onEdit,
  onStatusChange,
  onDelete,
}: CatalogColumnHandlers): ColumnDef<SystemDeviceCatalogModel>[] {
  return [
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      meta: { className: "px-5" },
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.manufacturer}</span>,
    },
    {
      accessorKey: "model",
      header: "Model",
      meta: { className: "px-5" },
      cell: ({ row }) => row.original.model,
    },
    {
      accessorKey: "protocolType",
      header: "Protocol",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${badgeBase} ${PROTOCOL_BADGE_CLASS[row.original.protocolType] ?? "border-muted bg-muted text-muted-foreground"}`}
        >
          {row.original.protocolType}
        </Badge>
      ),
    },
    {
      accessorKey: "defaultPort",
      header: "Port",
      meta: { className: "px-5 text-muted-foreground" },
      cell: ({ row }) => row.original.defaultPort || "—",
    },
    {
      accessorKey: "supportedFeatures",
      header: "Features",
      meta: { className: "px-5" },
      cell: ({ row }) => {
        const features = FEATURE_OPTIONS.filter(option => row.original.supportedFeatures.includes(option.value));
        if (features.length === 0)
          return <span className="text-muted-foreground text-sm">Basic</span>;
        return (
          <div className="flex gap-1">
            {features.map(({
              value,
              title,
              icon: Icon,
              className,
            }) => (
              <span
                key={value}
                title={title}
              >
                <Icon className={`h-4 w-4 ${className}`} />
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { className: "px-5" },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${badgeBase} ${STATUS_BADGE_CLASS[row.original.status] ?? "border-muted bg-muted text-muted-foreground"}`}
        >
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "w-[56px] px-5 text-right" },
      cell: ({ row }) => {
        const model = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(model)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {model.status !== "supported" && (
                <DropdownMenuItem
                  disabled={busy}
                  onClick={() => onStatusChange(
                    model,
                    "supported",
                  )}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark Supported
                </DropdownMenuItem>
              )}
              {model.status !== "deprecated" && (
                <DropdownMenuItem
                  disabled={busy}
                  onClick={() => onStatusChange(
                    model,
                    "deprecated",
                  )}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Mark Deprecated
                </DropdownMenuItem>
              )}
              {model.status !== "blocked" && (
                <DropdownMenuItem
                  disabled={busy}
                  onClick={() => onStatusChange(
                    model,
                    "blocked",
                  )}
                >
                  <X className="mr-2 h-4 w-4" />
                  Block Model
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(model)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
