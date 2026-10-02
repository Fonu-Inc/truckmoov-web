import { useQuery } from "@tanstack/react-query";
import type { VoiceCall, VoiceCallStatus } from "@truckmoov/api/notification";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { NotebookPen, PhoneIncoming, PhoneOutgoing, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { StateNotice } from "../components/StateNotice";
import { useDebouncedValue } from "../useDebouncedValue";
import { CallNotesDialog } from "./CallNotesDialog";
import { STATUS_LABEL, formatDuration, languageName, statusTone } from "./voiceDisplay";
import { voiceCallsOptions } from "./voiceQueries";

const ANY = "any";
const PAGE_SIZE = 25;

function CallRow({ call, canManage, onNotes }: { call: VoiceCall; canManage: boolean; onNotes: (call: VoiceCall) => void }) {
  const inbound = call.direction === "inbound";
  const number = inbound ? call.from_number : call.to_number;
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {inbound ? <PhoneIncoming className="h-4 w-4 text-muted-foreground" aria-label="Inbound" /> : <PhoneOutgoing className="h-4 w-4 text-muted-foreground" aria-label="Outbound" />}
          <div>
            <p className="text-sm font-medium text-foreground">{call.contact_name || number}</p>
            {call.contact_name && <p className="text-xs text-muted-foreground">{number}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell><Badge variant={statusTone(call.status)}>{STATUS_LABEL[call.status]}</Badge></TableCell>
      <TableCell className="text-xs">{formatDuration(call.duration_seconds)}</TableCell>
      <TableCell className="text-xs">{languageName(call.language)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatDateTime(call.started_at)}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" aria-label={`Notes for ${call.contact_name || number}`} disabled={!canManage && !call.notes} onClick={() => onNotes(call)}>
          <NotebookPen className={call.notes ? "h-4 w-4 text-primary" : "h-4 w-4"} />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function CallLogTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"inbound" | "outbound" | "">("");
  const [status, setStatus] = useState<VoiceCallStatus | "">("");
  const [page, setPage] = useState(1);
  const [notesFor, setNotesFor] = useState<VoiceCall | null>(null);
  const query = useDebouncedValue(search.trim(), 300);
  const list = useQuery(voiceCallsOptions({ query, direction: direction || undefined, status: status || undefined, page, limit: PAGE_SIZE }));
  const pages = Math.max(1, Math.ceil((list.data?.total ?? 0) / PAGE_SIZE));
  const filtered = Boolean(query || direction || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search calls" className="pl-10" placeholder="Search by name or number" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={direction || ANY} onValueChange={(next) => { setDirection(next === ANY ? "" : next as "inbound" | "outbound"); setPage(1); }}>
          <SelectTrigger className="w-36" aria-label="Direction filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All calls</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || ANY} onValueChange={(next) => { setStatus(next === ANY ? "" : next as VoiceCallStatus); setPage(1); }}>
          <SelectTrigger className="w-40" aria-label="Status filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {(Object.keys(STATUS_LABEL) as VoiceCallStatus[]).map(key => <SelectItem key={key} value={key}>{STATUS_LABEL[key]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {list.isPending && <Skeleton className="h-48 w-full" />}
      {list.isError && !list.data && <StateNotice title="Could not load calls." body="Check your connection and try again." actionLabel="Retry" onAction={() => void list.refetch()} />}
      {list.data && list.data.items.length === 0 && (
        <StateNotice title={filtered ? "No calls match." : "No calls yet."} body={filtered ? undefined : "Calls the platform places or takes appear here."} />
      )}
      {list.data && list.data.items.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-12"><span className="sr-only">Notes</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map(call => <CallRow key={call.id} call={call} canManage={canManage} onNotes={setNotesFor} />)}
            </TableBody>
          </Table>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 p-2 text-xs text-muted-foreground">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              {`Page ${page} of ${pages}`}
              <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}
      {notesFor && <CallNotesDialog call={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  );
}
