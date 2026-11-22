import type {
  ViolationRule, ViolationRuleEntity, ViolationType,
} from "@truckmoov/api/fleet";
import {
  useDeleteViolationRule, useUpdateViolationRule, useViolationRules,
} from "@truckmoov/api/fleet";
import { format } from "date-fns";
import {
  Ellipsis, Pencil, Plus, Power, Search, Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { ViolationRuleDialog } from "@/features/fleet/components/ui/violations/ViolationRuleDialog";
import { ViolationsTableState } from "@/features/fleet/components/ui/violations/ViolationsTableState";
import {
  capitalize, CARD_CLASS, INPUT_CLASS, PILL_BASE_CLASS, QUOTA_PERIOD_UNIT, SEARCH_ICON_CLASS, SEVERITY_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS, violationTypeLabel,
} from "@/features/fleet/components/ui/violations/violationsUi";

const COLUMNS = [
  "Rule Name",
  "Rule Description",
  "Violation Type",
  "Trigger",
  "Applies To",
  "Severity",
  "Quota",
  "Rule Violations",
  "Status",
  "Created",
];

const MANAGER_ROLES = new Set([
  "ENTERPRISE_ADMIN",
  "OWNER_OPERATOR",
  "OPERATIONS_MANAGER",
]);

function appliesTo(r: ViolationRule) {
  return r.scope === "all_drivers"
    ? "All drivers"
    : r.scope === "all_vehicles"
      ? "All vehicles"
      : `${r.scopeIds.length} selected`;
}
const quotaLabel = (r: ViolationRule) => `${r.quota} / ${QUOTA_PERIOD_UNIT[r.quotaPeriod]}`;
function createdLabel(r: ViolationRule) {
  return format(
    new Date(r.createdAt),
    "d MMM yyyy, h:mm a",
  );
}

/** Violation Rules sub-tab — the rules for one entity, with the design app's wizard and row actions. */
export function ViolationRulesTab({ entity }: { entity: ViolationRuleEntity }) {
  const role = useAuthStore(s => s.user?.role);
  const canManage = !!role && MANAGER_ROLES.has(role);
  const rulesQuery = useViolationRules(entity);
  const updateRule = useUpdateViolationRule();
  const deleteRule = useDeleteViolationRule();
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");
  const [
    dialog,
    setDialog,
  ] = useState<{
    key: number; open: boolean; rule: ViolationRule | null;
  }>({
    key: 0,
    open: false,
    rule: null,
  });
  const [
    deleting,
    setDeleting,
  ] = useState<ViolationRule | null>(null);

  const typeLabel = (type: ViolationType) =>
    entity === "drivers" && type === "harsh_cornering" ? "Harsh Cornering" : violationTypeLabel(type);
  const openDialog = (rule: ViolationRule | null) => setDialog(d => ({
    key: d.key + 1,
    open: true,
    rule,
  }));

  const q = search.trim().toLowerCase();
  const filtered = (rulesQuery.data?.data ?? []).filter(r => (status === "all" || r.status === status)
    && (!q || r.name.toLowerCase().includes(q) || typeLabel(r.type).toLowerCase().includes(q)));

  const toggleStatus = (r: ViolationRule) => updateRule.mutate(
    {
      id: r.id,
      data: { status: r.status === "active" ? "inactive" : "active" },
    },
    {
      onSuccess: () => toast.success(r.status === "active" ? "Rule paused" : "Rule activated"),
      onError: error => toast.error(error.message),
    },
  );
  const confirmDelete = () => {
    if (!deleting)
      return;
    deleteRule.mutate(
      { id: deleting.id },
      {
        onSuccess: () => toast.success("Violation rule deleted"),
        onError: error => toast.error(error.message),
      },
    );
    setDeleting(null);
  };

  return (
    <div className={CARD_CLASS}>
      <div className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Violation Rules</h3>
          <p className="text-sm text-muted-foreground mt-1.5">Recorded driving incidents, affected drivers and vehicles, and their current status.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            filename="violation-rules"
            rows={filtered}
            columns={[
              {
                header: "Rule Name", accessor: r => r.name,
              },
              {
                header: "Rule Description", accessor: r => r.description || "—",
              },
              {
                header: "Violation Type", accessor: r => typeLabel(r.type),
              },
              {
                header: "Trigger", accessor: r => r.threshold,
              },
              {
                header: "Applies To", accessor: appliesTo,
              },
              {
                header: "Severity", accessor: r => capitalize(r.severity),
              },
              {
                header: "Quota", accessor: quotaLabel,
              },
              {
                header: "Rule Violations", accessor: r => r.violationCount,
              },
              {
                header: "Status", accessor: r => capitalize(r.status),
              },
              {
                header: "Created", accessor: createdLabel,
              },
            ]}
          />
          {canManage && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-mtn h-8 rounded-lg px-3 text-xs"
              onClick={() => openDialog(null)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </button>
          )}
        </div>
      </div>
      <div className="p-6 pt-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className={SEARCH_ICON_CLASS} />
            <input
              className={INPUT_CLASS}
              placeholder="Search rules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="h-10 rounded-xl px-3.5 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border overflow-x-auto">
          <div className="relative w-full overflow-auto">
            <table className={TABLE_CLASS}>
              <thead className={THEAD_CLASS}>
                <tr className={TR_CLASS}>
                  {COLUMNS.map(c => (
                    <th
                      key={c}
                      className={TH_CLASS}
                    >
                      {c}
                    </th>
                  ))}
                  {canManage && <th className={TH_RIGHT_CLASS}>Action</th>}
                </tr>
              </thead>
              <tbody className={TBODY_CLASS}>
                <ViolationsTableState
                  colSpan={canManage ? 11 : 10}
                  isLoading={rulesQuery.isLoading}
                  isError={rulesQuery.isError}
                  onRetry={() => void rulesQuery.refetch()}
                  isEmpty={filtered.length === 0}
                  emptyText="No violation rules found."
                />
                {!rulesQuery.isLoading && !rulesQuery.isError && filtered.map(r => (
                  <tr
                    key={r.id}
                    className={TR_CLASS}
                  >
                    <td className={`${TD_CLASS} font-medium`}>{r.name}</td>
                    <td className={`${TD_CLASS} text-sm text-muted-foreground`}>{r.description || "—"}</td>
                    <td className={TD_CLASS}>{typeLabel(r.type)}</td>
                    <td className={`${TD_CLASS} text-sm`}>{r.threshold}</td>
                    <td className={TD_CLASS}>{appliesTo(r)}</td>
                    <td className={TD_CLASS}>
                      <div className={`${PILL_BASE_CLASS} ${SEVERITY_CLASS[r.severity]}`}>{capitalize(r.severity)}</div>
                    </td>
                    <td className={TD_CLASS}>{quotaLabel(r)}</td>
                    <td className={TD_CLASS}>{r.violationCount}</td>
                    <td className={TD_CLASS}>
                      <div className={`${PILL_BASE_CLASS} ${r.status === "active" ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}`}>
                        {capitalize(r.status)}
                      </div>
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-sm`}>{createdLabel(r)}</td>
                    {canManage && (
                      <td className={`${TD_CLASS} text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Rule actions"
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-secondary hover:text-foreground h-9 w-9 rounded-xl"
                            >
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(r)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(r)}>
                              <Power className="h-4 w-4 mr-2" />
                              {r.status === "active" ? "Pause Rule" : "Activate Rule"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleting(r)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {canManage && (
        <ViolationRuleDialog
          key={dialog.key}
          open={dialog.open}
          onOpenChange={open => setDialog(d => ({
            ...d,
            open,
          }))}
          entity={entity}
          rule={dialog.rule}
          typeLabel={typeLabel}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={o => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Violation Rule</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${deleting?.name}" will stop generating violations. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
