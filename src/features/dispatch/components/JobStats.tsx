import StatCard2 from "@/shared/components/StatCard2"
import { CheckCircle, Clock, DollarSign, Package, Truck } from "lucide-react"
import { useMemo } from "react"

export default function JobStats() {
 const stats = useMemo(() => [
  {
   value: 0,
   Icon: <Package className="h-5 w-5 text-primary" />,
   description: "Total Jobs"
  },
  {
   value: 0,
   Icon: <Clock className="h-5 w-5 text-warning" />,
   description: "Pending"
  },
  {
   value: 0,
   Icon: <Truck className="h-5 w-5 text-primary" />,
   description: "In Progess"
  },
  {
   value: 0,
   Icon: <CheckCircle className="h-5 w-5 text-success" />,
   description: "Offline"
  },
  {
   value: 0,
   Icon: <DollarSign className="h-5 w-5 text-accent" />,
   description: "License Expiring"
  }
 ], [])

 return (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
   {stats.map(stat => (
    <StatCard2 {...stat}/>
   ))}
  </div>
 )
}
