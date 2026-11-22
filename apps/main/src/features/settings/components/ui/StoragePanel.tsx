import {
  Archive, Database, FileText, HardDrive, ImageIcon, Info, Receipt, ShieldCheck, TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/shadcn/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

/**
 * The file categories the design app breaks storage down by. These are row
 * labels, not data: no endpoint reports storage usage yet, so every figure on
 * this tab renders "-" until one does.
 */
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
    title: "Re-scan waybills at lower DPI", body: "Capture waybills via the mobile app — server-side compression keeps quality high.",
  },
  {
    title: "Remove expired compliance docs", body: "Outdated insurance, FRSC and roadworthiness scans can be safely deleted after renewal.",
  },
  {
    title: "Upgrade your plan", body: "Higher tiers include significantly more storage and longer retention windows.",
  },
];

const KPI_TILES = [
  {
    label: "Storage used", icon: HardDrive, chip: "bg-primary/10", iconClass: "text-primary", footer: "of - on current plan", footerClass: "",
  },
  {
    label: "Remaining", icon: Database, chip: "bg-success/10", iconClass: "text-success", footer: "-", footerClass: "",
  },
  {
    label: "Total files", icon: Archive, chip: "bg-warning/10", iconClass: "text-warning", footer: "Across PODs, waybills, KYC & compliance", footerClass: "",
  },
  {
    label: "Largest category", icon: TrendingUp, chip: "bg-accent/10", iconClass: "text-accent-foreground", footer: "-", footerClass: " truncate",
  },
];

export function StoragePanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_TILES.map(tile => (
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
                <h3 className="font-semibold tracking-tight text-foreground font-display text-xl truncate">-</h3>
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
              <p className="text-sm text-muted-foreground">Your current plan includes - of storage.</p>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-semibold leading-none">-</div>
              <div className="text-xs text-muted-foreground mt-1">used of -</div>
            </div>
          </div>
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
              {STORAGE_CATEGORIES.map(category => (
                <TableRow key={category.key}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">-</TableCell>
                  <TableCell className="text-right tabular-nums">-</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={0}
                        className="h-2"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">-</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
