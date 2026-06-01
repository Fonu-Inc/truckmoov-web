import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Cpu, CheckCircle } from "lucide-react";
import { DeviceMappingRow } from "@/hooks/useFonuSIM";

interface DeviceMappingPreviewProps {
  data: DeviceMappingRow[];
  maxDisplay?: number;
}

export function DeviceMappingPreview({ data, maxDisplay = 10 }: DeviceMappingPreviewProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const displayData = data.slice(0, maxDisplay);
  const remaining = data.length - maxDisplay;

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          Device Mapping Preview
          <Badge variant="secondary" className="ml-auto">
            {data.length} devices
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Device Name</TableHead>
                <TableHead className="text-xs">IMEI</TableHead>
                <TableHead className="text-xs">Serial</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs font-medium py-2">
                    {row.device_name}
                  </TableCell>
                  <TableCell className="text-xs font-mono py-2">
                    {row.imei}
                  </TableCell>
                  <TableCell className="text-xs py-2">
                    {row.serial_number || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-2 max-w-[150px] truncate">
                    {row.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        {remaining > 0 && (
          <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground text-center border-t">
            + {remaining} more devices
          </div>
        )}
        <div className="px-4 py-2 bg-success/10 text-xs text-success flex items-center gap-1 border-t">
          <CheckCircle className="h-3 w-3" />
          All devices validated
        </div>
      </CardContent>
    </Card>
  );
}
