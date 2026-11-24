import { useTenantStorageUsage } from "@truckmoov/api/auth";
import { useFleetStorageUsage } from "@truckmoov/api/fleet";
import { formatBytes } from "@truckmoov/app-core/utils/general-utils";
import {
  AlertTriangle, Archive, Database, FileText, HardDrive, ImageIcon, Info, Receipt, ShieldCheck, TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

const STORAGE_CATEGORIES = [
  {
    key: "pod", label: "Proof of Delivery (POD) photos", icon: ImageIcon,
  },
  {
    key: "waybill", label: "Waybill scans & extractions", icon: Receipt,
  },
  {
    key: "compliance", label: "Compliance documents", icon: ShieldCheck,
  },
  {
    key: "kyc", label: "KYC documents", icon: FileText,
  },
];

const STORAGE_TIPS = [
  {
    title: "Archive completed jobs", body: "Older POD photos can be archived from the Jobs page once jobs are settled.",
  },
  {
    title: "Re-scan waybills at lower DPI", body: "Capture waybills via the mobile app. Server-side compression keeps quality high.",
  },
  {
    title: "Remove expired compliance docs", body: "Outdated insurance, FRSC and roadworthiness scans can be safely deleted after renewal.",
  },
  {
    title: "Upgrade your plan", body: "Higher tiers include significantly more storage and longer retention windows.",
  },
];

type CategoryUsage = {
  files: number; bytes: number | null; unsizedFiles: number;
};

export function StoragePanel() {
  const navigate = useNavigate();
  const usage = useTenantStorageUsage().data?.data;
  const fleetCategories = useFleetStorageUsage().data?.data.categories;

  const byKey: Record<string, CategoryUsage | undefined> = {
    ...Object.fromEntries((fleetCategories ?? []).map(category => [
      category.key,
      category,
    ])),
    kyc: usage ? {
      ...usage.kyc, unsizedFiles: 0,
    } : undefined,
  };
  const rows = STORAGE_CATEGORIES.map(category => ({
    ...category, usage: byKey[category.key],
  }));
  const knownRows = rows.filter(row => row.usage);
  const categoryBytes = knownRows.reduce(
    (sum, row) => sum + (row.usage?.bytes ?? 0),
    0,
  );
  const totalFiles = knownRows.length ? knownRows.reduce(
    (sum, row) => sum + (row.usage?.files ?? 0),
    0,
  ) : null;
  const largest = knownRows.reduce<(typeof rows)[number] | undefined>(
    (max, row) => ((row.usage?.bytes ?? 0) > (max?.usage?.bytes ?? 0) ? row : max),
    undefined,
  );

  const usedBytes = usage?.usedBytes ?? null;
  const limitBytes = usage?.limitBytes ?? null;
  const percentage = usedBytes !== null && limitBytes ? Math.min(
    100,
    (usedBytes / limitBytes) * 100,
  ) : null;
  const near = percentage !== null && percentage >= 80 && percentage < 100;
  const over = percentage !== null && percentage >= 100;
  const limitLabel = usage ? (limitBytes === null ? "unlimited" : formatBytes(limitBytes)) : "-";

  const kpiTiles = [
    {
      label: "Storage used", value: formatBytes(usedBytes), icon: HardDrive, chip: "bg-primary/10", iconClass: "text-primary", footer: `of ${limitLabel} on ${usage?.planName ?? "current plan"}`, footerClass: "",
    },
    {
      label: "Remaining",
      value: !usage ? "-" : limitBytes === null ? "Unlimited" : formatBytes(Math.max(
        0,
        limitBytes - (usedBytes ?? 0),
      )),
      icon: Database,
      chip: "bg-success/10",
      iconClass: "text-success",
      footer: !usage ? "-" : percentage === null ? "No plan limit" : `${(100 - percentage).toFixed(0)}% capacity free`,
      footerClass: "",
    },
    {
      label: "Total files", value: totalFiles === null ? "-" : totalFiles.toLocaleString(), icon: Archive, chip: "bg-warning/10", iconClass: "text-warning", footer: "Across PODs, waybills, KYC & compliance", footerClass: "",
    },
    {
      label: "Largest category", value: formatBytes(largest?.usage?.bytes), icon: TrendingUp, chip: "bg-accent/10", iconClass: "text-accent-foreground", footer: largest?.label ?? "-", footerClass: " truncate",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiTiles.map(tile => (
          <div
            key={tile.label}
            className="rounded-2xl surface-sleek text-card-foreground"
          >
            <div className="p-6 flex flex-row items-center gap-3 space-y-0 pb-2">
              <div className={`h-10 w-10 rounded-md ${tile.chip} flex items-center justify-center shrink-0`}>
                <tile.icon className={`h-5 w-5 ${tile.iconClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">{tile.label}</p>
                <h3 className="font-semibold tracking-tight text-foreground font-display text-xl truncate">{tile.value}</h3>
              </div>
            </div>
            <div className={`p-6 pt-0 text-xs text-muted-foreground${tile.footerClass}`}>{tile.footer}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">Plan storage</h3>
              <p className="text-sm text-muted-foreground">
                Your
                {" "}
                {usage?.planName ?? "current"}
                {" "}
                plan includes
                {" "}
                {limitLabel}
                {" "}
                of storage.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold leading-none">{formatBytes(usedBytes)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                used of
                {" "}
                {limitLabel}
              </div>
            </div>
            {percentage !== null && (
              <div className={`text-2xl font-semibold ${over ? "text-destructive" : near ? "text-warning" : "text-muted-foreground"}`}>
                {percentage.toFixed(0)}
                %
              </div>
            )}
          </div>
          {percentage !== null && (
            <Progress
              value={percentage}
              className={over ? "[&>div]:bg-destructive" : near ? "[&>div]:bg-warning" : ""}
            />
          )}
          {(near || over) && limitBytes !== null && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
              <div className="flex-1">
                {over
                  ? `You're over the ${formatBytes(limitBytes)} storage limit on your plan. New uploads may be blocked. Upgrade to add capacity.`
                  : `You've used ${percentage?.toFixed(0)}% of your ${formatBytes(limitBytes)} storage. Consider upgrading soon to avoid disruption.`}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/subscription")}
              >
                Upgrade plan
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground font-display">What's taking space</h3>
          <p className="text-sm text-muted-foreground">Storage broken down by file category</p>
        </div>
        <div className="p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Files</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="w-[35%]">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((category) => {
                const share = category.usage?.bytes && categoryBytes > 0 ? (category.usage.bytes / categoryBytes) * 100 : null;
                return (
                  <TableRow key={category.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{category.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{category.usage ? category.usage.files.toLocaleString() : "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(category.usage?.bytes)}
                      {!!category.usage?.unsizedFiles && (
                        <div className="text-xs text-muted-foreground">
                          {category.usage.unsizedFiles.toLocaleString()}
                          {" "}
                          older file(s) not sized
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={share ?? 0}
                          className="h-2"
                        />
                        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{share === null ? "-" : `${share.toFixed(0)}%`}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl surface-sleek text-card-foreground">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="font-semibold tracking-tight text-foreground font-display text-base">Ways to free up space</h3>
          <p className="text-sm text-muted-foreground">Reduce storage before upgrading your plan</p>
        </div>
        <div className="p-6 pt-0 grid gap-3 sm:grid-cols-2">
          {STORAGE_TIPS.map(tip => (
            <div
              key={tip.title}
              className="flex items-start gap-3 rounded-md border p-3 text-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium mb-1">{tip.title}</div>
                <p className="text-xs text-muted-foreground">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
