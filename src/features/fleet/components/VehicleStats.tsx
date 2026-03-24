import StatCard from '@/shared/components/StatCard'
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
    <StatCard {...stat}/>
   ))}
  </div>
 )
}
