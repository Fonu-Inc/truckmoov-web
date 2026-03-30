import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Globe, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { documentAccessLogQueryOptions } from "../api";
import { DocumentAccessLog } from "../api/types";

type DocumentAccessLogSheetProps = {
 docId: string | null;
 tenantId: string;
 open: boolean;
 onClose: () => void;
};

function getEntryTime(value?: string) {
 return value ? new Date(value).getTime() : 0;
}

export default function DocumentAccessLogSheet({
 docId,
 tenantId,
 open,
 onClose,
}: DocumentAccessLogSheetProps) {
 const { data, isLoading } = useQuery({
  ...documentAccessLogQueryOptions({ id: docId ?? "", params: { tenantId } }),
  enabled: open && Boolean(docId),
 });

 const logs = useMemo(() => {
  const raw = Array.isArray(data?.data) ? data.data : [];

  const scoped = docId
   ? raw.filter((entry) => !entry?.docId || entry.docId === docId)
   : raw;

  return scoped
   .filter((entry): entry is DocumentAccessLog => Boolean(entry?.at || entry?.docId || entry?.id))
   .sort((a, b) => getEntryTime(b.at) - getEntryTime(a.at));
 }, [data, docId]);

 return (
  <Sheet
   open={open}
   onOpenChange={(next) => {
    if (!next) onClose();
   }}
  >
   <SheetContent className="sm:max-w-lg">
    <SheetHeader>
     <SheetTitle className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      Document Access Log
     </SheetTitle>
    </SheetHeader>

    <ScrollArea className="mt-6 h-[calc(100vh-8rem)] pr-4">
     {isLoading ? (
      <div className="space-y-3">
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
      </div>
     ) : logs.length === 0 ? (
      <div className="py-10 text-center text-sm text-muted-foreground">
       No access logs found for this document.
      </div>
     ) : (
      <div className="space-y-3">
       {logs.map((log) => (
        <div key={`${log.id}-${log.at}`} className="space-y-3 rounded-lg border p-4">
         <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Action</span>
          <Badge variant="outline" className="capitalize">{log.action || "unknown"}</Badge>
         </div>

         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
           <User className="h-3 w-3" />
           User ID
          </div>
          <span className="max-w-[220px] truncate font-mono text-xs">{log.userId || "N/A"}</span>
         </div>

         <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
           <Globe className="h-3 w-3" />
           IP Address
          </div>
          <span className="font-mono text-xs">{log.ip || "N/A"}</span>
         </div>

         <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Timestamp</span>
          <span className="text-xs">{log.at ? new Date(log.at).toLocaleString() : "N/A"}</span>
         </div>

         <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Document ID</span>
          <span className="max-w-[220px] truncate font-mono text-xs">{log.docId || "N/A"}</span>
         </div>
        </div>
       ))}
      </div>
     )}
    </ScrollArea>
   </SheetContent>
  </Sheet>
 );
}
