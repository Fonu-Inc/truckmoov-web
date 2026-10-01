import { Info } from "lucide-react";

export function AccessBanner() {
  return (
    <div className="flex gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">
        Suspending a customer signs all their users out, blocks the portal and API, and stops their devices
        sending data to the platform. Their SIMs are marked suspended in our system; the mobile network is not told.
        Customers suspended for unpaid bills get everything back automatically when they pay.
        A suspension set by staff is lifted only by staff.
      </p>
    </div>
  );
}
