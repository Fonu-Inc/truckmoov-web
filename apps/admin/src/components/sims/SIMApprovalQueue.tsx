import {
  ClipboardCheck,
  Download,
  Search,
  SlidersHorizontal,
  Wifi,
} from "lucide-react";

import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";

import { SIMApprovalSummaryCards } from "./SIMApprovalSummaryCards";

export function SIMApprovalQueue() {
  return (
    <div className="space-y-6">
      <SIMApprovalSummaryCards
        pendingCount={0}
        approvedCount={0}
        rejectedCount={0}
        totalRequested={0}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                SIM Requests
              </CardTitle>
              <CardDescription>
                Tenant submissions for new SIM provisioning awaiting review, approval, or fulfilment.
              </CardDescription>
            </div>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by organisation, email, carrier, use case..."
                className="pl-10"
                disabled
              />
            </div>
            <Select defaultValue="all" disabled>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" disabled>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 whitespace-nowrap">Organisation</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Request Email</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Carrier</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Data Limit / SIM</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">KYC Status</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Status</TableHead>
                  <TableHead className="px-6 whitespace-nowrap">Date Requested</TableHead>
                  <TableHead className="px-6 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="py-12 text-center text-muted-foreground">
                      <Wifi className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>No provisioning requests found</p>
                      <p className="text-sm">Adjust filters or wait for tenants to request SIM activations</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
