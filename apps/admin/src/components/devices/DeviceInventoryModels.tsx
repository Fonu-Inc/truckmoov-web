import { useQuery } from "@tanstack/react-query";
import { deviceInventoryModels } from "@truckmoov/api/auth/device-stock";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";

export function DeviceInventoryModels() {
  const models = useQuery({
    queryKey: [
      "platform-device-stock",
      "models-in-inventory",
    ],
    queryFn: deviceInventoryModels,
    refetchInterval: 30_000,
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Device Models</CardTitle>
        <CardDescription>
          Models found in device inventory. This list updates from inventory and can't be edited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Device Models">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Manufacturer</TableHead>
              <TableHead className="px-4">Model</TableHead>
              <TableHead className="px-4">Units in Inventory</TableHead>
              <TableHead className="px-4">Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.data?.map(model => (
              <TableRow key={JSON.stringify([
                model.manufacturer,
                model.model,
              ])}
              >
                <TableCell className="px-4 py-4 font-medium">{model.manufacturer}</TableCell>
                <TableCell className="px-4 py-4">{model.model}</TableCell>
                <TableCell className="px-4 py-4 tabular-nums">{model.total}</TableCell>
                <TableCell className="px-4 py-4 tabular-nums">{model.available}</TableCell>
              </TableRow>
            ))}
            {models.isPending && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading device models…
                </TableCell>
              </TableRow>
            )}
            {models.isError && !models.data && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Could not load device models.
                  {" "}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void models.refetch()}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {models.isSuccess && models.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No devices in inventory yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
