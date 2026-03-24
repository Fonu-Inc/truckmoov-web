import StatCard from "@/shared/components/StatCard"
import { useMemo } from "react"

export default function DeviceStats() {
 const stats = useMemo(() => [
  { label: "All Devices", value: 0, status: "all" },
  { label: "Registered", value: 0, status: "registered", color: "text-muted-foreground" },
  { label: "Configured", value: 0, status: "configured", color: "text-info" },
  { label: "Assignable", value: 0, status: "assignable", color: "text-success" },
  { label: "Assigned", value: 0, status: "assigned", color: "text-primary" },
  { label: "Active", value: 0, status: "active", color: "text-success" },
  { label: "Faulty", value: 0, status: "faulty", color: "text-destructive" },
 ], [])
 return (
  <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
   {stats.map(stat => (
    <StatCard {...stat}/>
   ))}
  </div >
 )
}
