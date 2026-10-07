import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle, Shield, Zap,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import { WEBHOOK_EVENTS } from "@/features/integration/utils/apiDocsData";

const eventColumns: ColumnDef<(typeof WEBHOOK_EVENTS)[number]>[] = [
  {
    accessorKey: "event",
    header: "Event",
    enableSorting: false,
    cell: ({ row }) => <code className="text-xs bg-muted px-2 py-1 rounded">{row.original.event}</code>,
  },
  {
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  },
];

export default function WebhookGuidePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Webhook Events
          </CardTitle>
          <CardDescription>
            Subscribe to real-time events from your fleet operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <DataTable
              columns={eventColumns}
              data={WEBHOOK_EVENTS}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Payload Structure</CardTitle>
          <CardDescription>
            All webhooks follow a consistent payload format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
            {`{
  "event_id": "evt_abc123def456",
  "event_type": "job.completed",
  "tenant_id": "uuid",
  "occurred_at": "2025-02-02T10:30:00Z",
  "data": {
    "job_id": "uuid",
    "reference": "JOB-2025-001",
    "status": "delivered",
    "delivered_at": "2025-02-02T10:30:00Z",
    "driver": {
      "id": "uuid",
      "name": "John Doe"
    },
    "vehicle": {
      "id": "uuid",
      "registration_number": "ABC-123-XY"
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Signature Verification
          </CardTitle>
          <CardDescription>
            Verify webhook authenticity using HMAC-SHA256 signatures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Each webhook request includes a signature in the
            {" "}
            <code className="bg-muted px-1 rounded">X-FleetPro-Signature</code>
            {" "}
            header.
            Verify this signature using your webhook secret to ensure the request is authentic.
          </p>

          <div>
            <h4 className="text-sm font-medium mb-2">Verification Example (Node.js)</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler:
const signature = req.headers['x-fleetpro-signature'];
const isValid = verifyWebhookSignature(
  JSON.stringify(req.body),
  signature,
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}`}
            </pre>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <h4 className="text-sm font-medium flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Important
            </h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Always verify signatures before processing webhooks</li>
              <li>Respond with 2xx within 30 seconds to acknowledge receipt</li>
              <li>Failed deliveries will be retried with exponential backoff</li>
              <li>
                Implement idempotency using
                <code>event_id</code>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
