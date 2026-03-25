import { Card, CardContent } from "@/components/ui/card";
import { ReactElement } from "react"

type StatCard2Props = {
 Icon: ReactElement;
 value: any;
 description: string;
}

export default function StatCard2({Icon, value, description}: StatCard2Props) {
  return (
    <Card >
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       {Icon}
       <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
       </div>
      </div>
     </CardContent>
    </Card>
  )
}
