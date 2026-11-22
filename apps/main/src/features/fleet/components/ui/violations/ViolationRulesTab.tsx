import {
  Download, Ellipsis, Plus, Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  CARD_CLASS, EXPORT_BUTTON_CLASS, INPUT_CLASS, NO_ENDPOINT, SEARCH_ICON_CLASS, TABLE_CLASS, TBODY_CLASS, TD_CLASS, TH_CLASS, TH_RIGHT_CLASS, THEAD_CLASS, TR_CLASS,
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

const NO_RULES_API = "Violation rules aren't available yet.";

/**
 * Violation Rules sub-tab. No endpoint lists, creates or exports violation
 * rules yet, so the table renders one placeholder row of `-` and the actions
 * explain that with a toast.
 */
export function ViolationRulesTab() {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    status,
    setStatus,
  ] = useState("all");

  const notAvailable = () => toast.info(NO_RULES_API);

  return (
    <div className={CARD_CLASS}>
      <div className="p-6 pb-4 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Violation Rules</h3>
          <p className="text-sm text-muted-foreground mt-1.5">Recorded driving incidents, affected drivers and vehicles, and their current status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={EXPORT_BUTTON_CLASS}
            onClick={notAvailable}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-mtn h-8 rounded-lg px-3 text-xs"
            onClick={notAvailable}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </button>
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
                  <th className={TH_RIGHT_CLASS}>Action</th>
                </tr>
              </thead>
              <tbody className={TBODY_CLASS}>
                <tr className={TR_CLASS}>
                  <td className={`${TD_CLASS} font-medium`}>{NO_ENDPOINT}</td>
                  <td className={`${TD_CLASS} text-sm text-muted-foreground`}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={`${TD_CLASS} text-sm`}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={`${TD_CLASS} capitalize`}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={TD_CLASS}>{NO_ENDPOINT}</td>
                  <td className={`${TD_CLASS} whitespace-nowrap text-sm`}>{NO_ENDPOINT}</td>
                  <td className={`${TD_CLASS} text-right`}>
                    <button
                      type="button"
                      aria-label="Rule actions"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-[-0.01em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-secondary hover:text-foreground h-9 w-9 rounded-xl"
                      onClick={notAvailable}
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
