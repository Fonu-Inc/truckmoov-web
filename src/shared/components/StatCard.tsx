import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
 label: string;
 value: any;
 color?: string;
}

export default function StatCard({ label, value, color }: StatCardProps) {
 return (
  <Card
   className={cn(
    "rounded-xl border border-border bg-card p-4 text-left transition-all",
   )}
  >
   <p className="text-sm text-muted-foreground">{label}</p>
   <p className={cn("text-2xl font-bold", color)}>{value}</p>
  </Card>
 )
}
