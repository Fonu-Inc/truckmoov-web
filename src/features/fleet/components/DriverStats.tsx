import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Clock, UserCheck, Users, UserX } from 'lucide-react'
import { useMemo } from 'react'

export default function DriverStats() {
 const stats = useMemo(() => [
  {
   value: 0,
   Icon: <Users className="h-5 w-5 text-primary" />,
   description: "Total Drivers"
  },
  {
   value: 0,
   Icon: <UserCheck className="h-5 w-5 text-success" />,
   description: "Available"
  },
  {
   value: 0,
   Icon: <Clock className="h-5 w-5 text-primary" />,
   description: "Active"
  },
  {
   value: 0,
   Icon: <UserX className="h-5 w-5 text-muted-foreground" />,
   description: "Offline"
  },
  {
   value: 0,
   Icon: <AlertTriangle className="h-5 w-5 text-warining" />,
   description: "License Expiring"
  }
 ], [])

 return (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
   {stats.map(stat => (
    <Card >
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       {stat.Icon}
       <div>
        <p className="text-2xl font-bold">{stat.value}</p>
        <p className="text-xs text-muted-foreground">{stat.description}</p>
       </div>
      </div>
     </CardContent>
    </Card>
   ))}
  </div>
 )
}
