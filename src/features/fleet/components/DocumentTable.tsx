import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Eye, FileText, History, Loader2, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocumentDownload } from "@/shared/composables/useDocumentDownload";
import { listDocumentsQueryOptions } from "../api";
import { Document, DocumentEntityType } from "../api/types";
import DocumentAccessLogSheet from "./DocumentAccessLogSheet";

function formatBytes(bytes: number): string {
 if (!Number.isFinite(bytes) || bytes < 0) return "N/A";
 if (bytes === 0) return "0 B";
 const units = ["B", "KB", "MB", "GB"];
 const i = Math.floor(Math.log(bytes) / Math.log(1024));
 return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function isExpired(expiresAt?: string): boolean {
 return Boolean(expiresAt && new Date(expiresAt) < new Date());
}

const ENTITY_BADGE: Record<DocumentEntityType, string> = {
 job: "bg-blue-500/10 text-blue-500 border-blue-500/30",
 vehicle: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
 driver: "bg-green-500/10 text-green-600 border-green-500/30",
};

type DocumentTableProps = {
 tenantId: string;
 search: string;
 entityType: DocumentEntityType | "all";
};

function RowActions({
 doc,
 tenantId,
 onViewLog,
}: {
 doc: Document;
 tenantId: string;
 onViewLog: (id: string) => void;
}) {
 const { download, view, isLoading, activeDocumentId } = useDocumentDownload();
 const expired = isExpired(doc.expiresAt);
 const isBusy = isLoading && activeDocumentId === doc.id;

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
     <MoreHorizontal className="h-4 w-4" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end">
    <DropdownMenuItem disabled={isBusy || expired} onClick={() => view({ id: doc.id, tenantId })}>
     {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
     View
    </DropdownMenuItem>
    <DropdownMenuItem
     disabled={isBusy || expired}
     onClick={() => download({ id: doc.id, tenantId, filename: doc.filename })}
    >
     {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
     Download
    </DropdownMenuItem>
    {expired ? (
     <>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>Secure link expired</DropdownMenuItem>
     </>
    ) : null}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => onViewLog(doc.id)}>
     <History className="mr-2 h-4 w-4" />
     View Access Log
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

export default function DocumentTable({ tenantId, search, entityType }: DocumentTableProps) {
 const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

 const { data, isLoading } = useQuery(
  listDocumentsQueryOptions({
   params: {
    tenantId,
    ...(entityType !== "all" ? { entityType } : {}),
   },
  }),
 );

 const allDocs: Document[] = useMemo(() => {
  const raw = Array.isArray(data?.data) ? data.data : [];
  return raw.filter((doc): doc is Document => Boolean(doc?.id && doc?.filename));
 }, [data]);

 const filtered = useMemo(() => {
  if (!search) return allDocs;
  const q = search.toLowerCase();
  return allDocs.filter((d) => d.filename?.toLowerCase().includes(q));
 }, [allDocs, search]);

 const columns: ColumnDef<Document>[] = [
  {
   accessorKey: "filename",
   header: "Filename",
   cell: ({ row }) => (
    <div className="flex items-center gap-2">
     <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
     <span className="max-w-50 truncate font-medium">{row.original.filename}</span>
    </div>
   ),
  },
  {
   accessorKey: "docType",
   header: "Doc Type",
   cell: ({ row }) => <Badge variant="outline" className="text-xs uppercase">{row.original.docType}</Badge>,
  },
  {
   accessorKey: "entityType",
   header: "Entity",
   cell: ({ row }) => {
    const type = row.original.entityType;
    return (
     <Badge variant="outline" className={`capitalize ${ENTITY_BADGE[type] ?? ""}`}>
      {type}
     </Badge>
    );
   },
  },
  {
   accessorKey: "sizeBytes",
   header: "Size",
   cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatBytes(row.original.sizeBytes)}</span>,
  },
  {
   accessorKey: "uploadedAt",
   header: "Uploaded",
   cell: ({ row }) => (
    <span className="text-sm text-muted-foreground">
     {row.original.uploadedAt ? new Date(row.original.uploadedAt).toLocaleDateString() : "N/A"}
    </span>
   ),
  },
  {
   accessorKey: "expiresAt",
   header: "Expires",
   cell: ({ row }) => {
    const expired = isExpired(row.original.expiresAt);
    return (
     <span className={`text-sm ${expired ? "text-destructive" : "text-muted-foreground"}`}>
      {row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : "N/A"}
      {expired && " (expired)"}
     </span>
    );
   },
  },
  {
   id: "actions",
   cell: ({ row }) => <RowActions doc={row.original} tenantId={tenantId} onViewLog={setSelectedDocId} />,
  },
 ];

 return (
  <>
   <Card>
    <CardContent className="p-0">
     <DataTable
      columns={columns}
      data={filtered}
      isLoading={isLoading}
      noResultStatement={
       <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
        <FileText className="h-10 w-10 opacity-40" />
        <p className="text-sm">No documents found</p>
       </div>
      }
     />
    </CardContent>
   </Card>

   <DocumentAccessLogSheet
    docId={selectedDocId}
    tenantId={tenantId}
    open={Boolean(selectedDocId)}
    onClose={() => setSelectedDocId(null)}
   />
  </>
 );
}
