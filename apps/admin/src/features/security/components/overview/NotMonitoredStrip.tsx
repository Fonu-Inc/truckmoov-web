const SIGNALS = ["Engine cut", "Power cut", "Tampering", "SIM swap", "Jamming"];

export function NotMonitoredStrip() {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">Not monitored yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        These need device support and are planned: {SIGNALS.join(", ").toLowerCase()}.
      </p>
    </div>
  );
}
