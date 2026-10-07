import type { ColumnDef } from "@tanstack/react-table";
import type {
  VoiceCall, VoiceCallStatus,
} from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import {
  NotebookPen, PhoneIncoming, PhoneOutgoing, Search,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { StateNotice } from "../components/StateNotice";
import { useDebouncedValue } from "../useDebouncedValue";
import { CallNotesDialog } from "./CallNotesDialog";
import {
  formatDuration, languageName, STATUS_LABEL, statusTone,
} from "./voiceDisplay";
import { voiceCallsOptions } from "./voiceQueries";

const ANY = "any";
const PAGE_SIZE = 25;

// Server-paged list: sorting one page would mislead, so every column opts out.
function callColumns(canManage: boolean, onNotes: (call: VoiceCall) => void): ColumnDef<VoiceCall>[] {
  return [
    {
      id: "contact",
      header: "Contact",
      enableSorting: false,
      cell: ({ row: { original: call } }) => {
        const inbound = call.direction === "inbound";
        const number = inbound ? call.from_number : call.to_number;
        return (
          <div className="flex items-center gap-2">
            {inbound ? (
              <PhoneIncoming
                className="h-4 w-4 text-muted-foreground"
                aria-label="Inbound"
              />
            ) : (
              <PhoneOutgoing
                className="h-4 w-4 text-muted-foreground"
                aria-label="Outbound"
              />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{call.contact_name || number}</p>
              {call.contact_name && <p className="text-xs text-muted-foreground">{number}</p>}
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <Badge variant={statusTone(row.original.status)}>{STATUS_LABEL[row.original.status]}</Badge>,
    },
    {
      id: "duration",
      header: "Duration",
      enableSorting: false,
      meta: { className: "text-xs" },
      cell: ({ row }) => formatDuration(row.original.duration_seconds),
    },
    {
      id: "language",
      header: "Language",
      enableSorting: false,
      meta: { className: "text-xs" },
      cell: ({ row }) => languageName(row.original.language),
    },
    {
      id: "started",
      header: "Started",
      enableSorting: false,
      meta: { className: "text-xs text-muted-foreground" },
      cell: ({ row }) => formatDateTime(row.original.started_at),
    },
    {
      id: "notes",
      header: () => <span className="sr-only">Notes</span>,
      enableSorting: false,
      meta: { className: "w-12" },
      cell: ({ row: { original: call } }) => {
        const number = call.direction === "inbound" ? call.from_number : call.to_number;
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Notes for ${call.contact_name || number}`}
            disabled={!canManage && !call.notes}
            onClick={() => onNotes(call)}
          >
            <NotebookPen className={call.notes ? "h-4 w-4 text-primary" : "h-4 w-4"} />
          </Button>
        );
      },
    },
  ];
}

export function CallLogTab({ canManage }: { canManage: boolean }) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    direction,
    setDirection,
  ] = useState<"inbound" | "outbound" | "">("");
  const [
    status,
    setStatus,
  ] = useState<VoiceCallStatus | "">("");
  const [
    page,
    setPage,
  ] = useState(1);
  const [
    notesFor,
    setNotesFor,
  ] = useState<VoiceCall | null>(null);
  const query = useDebouncedValue(
    search.trim(),
    300,
  );
  const list = useQuery(voiceCallsOptions({
    query, direction: direction || undefined, status: status || undefined, page, limit: PAGE_SIZE,
  }));
  const filtered = Boolean(query || direction || status);
  const columns = useMemo(
    () => callColumns(
      canManage,
      setNotesFor,
    ),
    [canManage],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search calls"
            className="pl-10"
            placeholder="Search by name or number"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={direction || ANY}
          onValueChange={(next) => {
            setDirection(next === ANY ? "" : next as "inbound" | "outbound");
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-36"
            aria-label="Direction filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All calls</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status || ANY}
          onValueChange={(next) => {
            setStatus(next === ANY ? "" : next as VoiceCallStatus);
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-40"
            aria-label="Status filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {(Object.keys(STATUS_LABEL) as VoiceCallStatus[]).map(key => (
              <SelectItem
                key={key}
                value={key}
              >
                {STATUS_LABEL[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="border-border/50 bg-card/50">
        <DataTable
          columns={columns}
          data={list.data?.items ?? []}
          isLoading={list.isPending}
          isError={list.isError && !list.data}
          errorMessage="Could not load calls. Check your connection and try again."
          onRetry={() => void list.refetch()}
          hasActiveFilters={filtered}
          emptyState={(
            <StateNotice
              title="No calls yet."
              body="Calls the platform places or takes appear here."
            />
          )}
          filteredEmptyState={<StateNotice title="No calls match." />}
          pagination={{
            page, pageSize: PAGE_SIZE, total: list.data?.total ?? 0, onPageChange: setPage,
          }}
        />
      </Card>
      {notesFor && (
        <CallNotesDialog
          call={notesFor}
          onClose={() => setNotesFor(null)}
        />
      )}
    </div>
  );
}
