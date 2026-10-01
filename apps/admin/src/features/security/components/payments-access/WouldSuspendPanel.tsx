import { useEnforcementPreview } from "@truckmoov/api/billing";
import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { formatCurrency } from "@/lib/currency";
import { plural } from "./enforcementModel";

function noticeDelivered(why: "waived" | "no_notice_yet" | "no_contact" | "capped") {
  if (why === "capped")
    return "Yes";
  return why === "waived" ? "-" : "No";
}

export function WouldSuspendPanel({ autoSuspendEnabled }: { autoSuspendEnabled: boolean | undefined }) {
  const query = useEnforcementPreview();
  if (!query.data)
    return null;
  const { wouldSuspend, deferred, notes } = query.data.data;
  if (wouldSuspend.length === 0 && deferred.length === 0)
    return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Would be suspended next run</CardTitle>
        <CardDescription>
          {autoSuspendEnabled
            ? "These customers are past their grace period. They are suspended at the next daily run."
            : "Automatic suspension is off, so none of these customers are suspended yet. This is what would happen if it were on."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Owes</TableHead>
              <TableHead>Unpaid since</TableHead>
              <TableHead>Notice delivered</TableHead>
              <TableHead>What happens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wouldSuspend.map(row => (
              <TableRow key={row.tenantId}>
                <TableCell className="font-medium">
                  <Link to={`/tenants/${row.tenantId}`} className="hover:underline">{row.tenantName}</Link>
                </TableCell>
                <TableCell>{formatCurrency(row.amountOwedNgn, "NGN")}</TableCell>
                <TableCell>{formatDate(row.dueDate)}</TableCell>
                <TableCell>Yes</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {`${plural(row.assets.users, "user")}, ${plural(row.assets.devices, "device")}, ${plural(row.assets.sims, "SIM")}, ${plural(row.assets.shareLinks, "share link")}`}
                </TableCell>
              </TableRow>
            ))}
            {deferred.map(row => (
              <TableRow key={row.tenantId}>
                <TableCell className="font-medium">
                  <Link to={`/tenants/${row.tenantId}`} className="hover:underline">{row.tenantName}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell>{noticeDelivered(row.why)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{`Held back: ${row.label}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">{notes.sims}</p>
      </CardContent>
    </Card>
  );
}
