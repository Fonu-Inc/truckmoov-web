import { useQuery } from "@tanstack/react-query";
import {
  getSystemWhatsAppTemplatesQueryOptions,
  useDeleteSystemWhatsAppTemplate,
} from "@truckmoov/api/notification";
import type { WhatsAppTemplate } from "@truckmoov/api/notification";
import { MessageSquarePlus, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { qualityTone, TONE_CLASS } from "./accountHealth";
import { StartConversationDialog } from "./StartConversationDialog";
import { bodyTextOf } from "./templateComponents";
import { TemplateFormDialog } from "./TemplateFormDialog";

const PAGE_SIZE = 25;

const STATUS_TONE: Record<string, string> = {
  APPROVED: TONE_CLASS.good,
  PENDING: TONE_CLASS.warn,
  IN_APPEAL: TONE_CLASS.warn,
  REJECTED: TONE_CLASS.bad,
  PAUSED: TONE_CLASS.neutral,
  DISABLED: TONE_CLASS.neutral,
};

export function TemplatesPanel({ connected }: { connected: boolean }) {
  const [cursors, setCursors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [removing, setRemoving] = useState<WhatsAppTemplate | null>(null);
  const after = cursors.at(-1);
  const templatesQuery = useQuery({
    ...getSystemWhatsAppTemplatesQueryOptions({ limit: PAGE_SIZE, after }),
    enabled: connected,
  });
  const deleteTemplate = useDeleteSystemWhatsAppTemplate();
  const templates = templatesQuery.data?.data.data ?? [];
  const nextCursor = templatesQuery.data?.data.paging?.cursors?.after;
  const hasNext = Boolean(templatesQuery.data?.data.paging?.next && nextCursor);

  const confirmDelete = () => {
    if (!removing?.name)
      return;
    deleteTemplate.mutate(
      { name: removing.name },
      {
        onSuccess: () => {
          toast.success(`Deleted ${removing.name}.`);
          setRemoving(null);
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Message Templates
          </CardTitle>
          <CardDescription>
            A template is required to open a conversation outside the 24-hour session window.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!connected}
            onClick={() => setStarting(true)}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Start conversation
          </Button>
          <Button
            disabled={!connected}
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataTable
          columns={[
            {
              id: "name",
              header: "Template",
              cell: ({ row }) => (
                <div className="max-w-md space-y-1">
                  <p className="font-medium">{row.original.name || "—"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{bodyTextOf(row.original.components)}</p>
                  {row.original.rejected_reason && row.original.rejected_reason !== "NONE" && (
                    <p className="text-xs text-destructive">
                      Rejected:
                      {" "}
                      {row.original.rejected_reason.replace(/_/g, " ").toLowerCase()}
                    </p>
                  )}
                </div>
              ),
            },
            {
              id: "category",
              header: "Category",
              cell: ({ row }) => (
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {row.original.category || "—"}
                </Badge>
              ),
            },
            {
              id: "language",
              header: "Language",
              cell: ({ row }) => row.original.language || "—",
            },
            {
              id: "quality",
              header: "Quality",
              cell: ({ row }) => {
                const score = row.original.quality_score?.score;
                return score && score !== "UNKNOWN"
                  ? (
                      <Badge
                        variant="outline"
                        className={TONE_CLASS[qualityTone(score)]}
                      >
                        {score.toLowerCase()}
                      </Badge>
                    )
                  : "—";
              },
            },
            {
              id: "status",
              header: "Status",
              cell: ({ row }) => (
                <Badge
                  variant="outline"
                  className={STATUS_TONE[row.original.status ?? ""] ?? "text-xs"}
                >
                  {row.original.status || "—"}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${row.original.name}`}
                  onClick={() => setRemoving(row.original)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ),
            },
          ]}
          data={templates}
          isLoading={templatesQuery.isLoading}
          isError={templatesQuery.isError}
          errorMessage={templatesQuery.error?.message}
          onRetry={() => void templatesQuery.refetch()}
          emptyState={connected ? "No templates yet." : "Connect a WhatsApp number to manage templates."}
        />
        {(cursors.length > 0 || hasNext) && (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={cursors.length === 0}
              onClick={() => setCursors(current => current.slice(0, -1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => nextCursor && setCursors(current => [...current, nextCursor])}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>

      <TemplateFormDialog
        open={creating}
        onOpenChange={setCreating}
      />
      <StartConversationDialog
        open={starting}
        onOpenChange={setStarting}
      />
      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={open => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.name}
              {" "}
              is deleted in every language at Meta. Messages already sent are unaffected, but it can no longer be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteTemplate.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
