import { AttentionTiles } from "../overview/AttentionTiles";
import { AuditTrailLine } from "../overview/AuditTrailLine";
import { NotMonitoredStrip } from "../overview/NotMonitoredStrip";
import { RecentStaffActions } from "../overview/RecentStaffActions";

export default function SecurityOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Needs attention</h2>
        <p className="text-sm text-muted-foreground">Select a count to see who is affected.</p>
      </div>
      <AttentionTiles />
      <RecentStaffActions />
      <AuditTrailLine />
      <NotMonitoredStrip />
    </div>
  );
}
