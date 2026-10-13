import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle, Clock,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { ERROR_CODES } from "@/features/integration/utils/apiDocsData";

const errorColumns: ColumnDef<(typeof ERROR_CODES)[number]>[] = [
  {
    accessorKey: "code",
    header: "Code",
    enableSorting: false,
    cell: ({ row }) => {
      const { code } = row.original;
      return (
        <Badge variant={code >= 500 ? "destructive" : code >= 400 ? "secondary" : "default"}>
          {code}
        </Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: false,
    meta: { className: "font-medium" },
  },
  {
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    meta: { className: "min-w-[240px] whitespace-normal text-muted-foreground" },
  },
];

export default function ErrorsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Codes
          </CardTitle>
          <CardDescription>
            Standard HTTP status codes and error response format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <DataTable
              columns={errorColumns}
              data={ERROR_CODES}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Error Response Format</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "pickup_lat",
        "message": "Must be a valid latitude between -90 and 90"
      }
    ]
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>
            API rate limits to ensure fair usage and system stability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">60</div>
              <div className="text-sm text-muted-foreground">Requests per minute</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">10,000</div>
              <div className="text-sm text-muted-foreground">Requests per day</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Rate Limit Headers</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs">
              {`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706875200`}
            </pre>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              When rate limited (429), wait until the
              {" "}
              <code>X-RateLimit-Reset</code>
              {" "}
              timestamp
              before retrying. Implement exponential backoff for robust handling.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagination</CardTitle>
          <CardDescription>
            All list endpoints support pagination
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <code className="bg-muted px-2 py-1 rounded text-sm">page</code>
              <span className="text-sm text-muted-foreground">Page number (default: 1)</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="bg-muted px-2 py-1 rounded text-sm">limit</code>
              <span className="text-sm text-muted-foreground">Items per page (default: 20, max: 100)</span>
            </div>
          </div>

          <pre className="bg-muted p-3 rounded-lg text-xs">
            {`GET /vehicles?page=2&limit=50

Response:
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 145,
      "total_pages": 3
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
