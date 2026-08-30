import {
  AlertTriangle, Shield,
} from "lucide-react";
import { Badge } from "@/components/shadcn/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { API_BASE_URL } from "@/features/integration/utils/apiDocsData";

const SCOPES = [
  "vehicles.read",
  "drivers.read",
  "devices.read",
  "jobs.read",
  "jobs.write",
  "geofences.read",
  "alerts.read",
  "maintenance.read",
  "fuel.read",
];

export default function AuthenticationPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API Key Authentication
          </CardTitle>
          <CardDescription>
            All API requests must include your API key in the request headers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Header Format</h4>
            <pre className="bg-muted p-3 rounded-lg text-sm">
              X-API-Key: tm_your_api_key_here
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Example Request</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {`curl -X GET "${API_BASE_URL}/vehicles" \\
  -H "X-API-Key: tm_live_abc123def456" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <h4 className="text-sm font-medium flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Security Best Practices
            </h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Never expose your API key in client-side code</li>
              <li>Rotate keys periodically and after any suspected compromise</li>
              <li>Use separate keys for development and production</li>
              <li>Apply the minimum required scopes for each key</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key Scopes</CardTitle>
          <CardDescription>
            Each API key can be configured with specific scopes to limit access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCOPES.map(scope => (
              <div
                key={scope}
                className="flex items-center gap-2 p-2 border rounded-lg"
              >
                <Badge variant="outline">{scope}</Badge>
                <span className="text-xs text-muted-foreground">
                  {scope.includes("write") ? "Create/Update" : "Read-only"}
                  {" "}
                  access
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
