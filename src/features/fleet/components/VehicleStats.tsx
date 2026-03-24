import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export default function VehicleStats() {
 const stats = useMemo(() => ([
  { label: "All Vehicles", value: 0 },
  { label: "Active", value: 0, color: "text-success" },
  { label: "Inactive", value: 0, color: "text-muted-foreground" },
  { label: "In Maintenance", value: 0, color: "text-warning" },
 ]), [])

 return (
  <div className="grid gap-4 md:grid-cols-4">
   {stats.map(stat => (
    <Card
     className={cn(
      "rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50",
     )}
    >
     <p className="text-sm text-muted-foreground">{stat.label}</p>
     <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
    </Card>
   ))}
  </div>
 )
}
