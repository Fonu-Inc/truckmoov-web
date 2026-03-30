import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, KeyRound, LineChart } from "lucide-react";

export default function DeveloperPortalPlaceholders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Portal Placeholders</CardTitle>
        <CardDescription>
          Planned migration from demo: API keys, usage analytics, and API reference are placeholders in this epic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-keys" className="gap-2">
              <KeyRound className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <LineChart className="h-4 w-4" />
              Usage Analytics
            </TabsTrigger>
            <TabsTrigger value="reference" className="gap-2">
              <BookOpen className="h-4 w-4" />
              API Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">API Key Management</p>
                <Badge variant="outline">Planned migration from demo</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Non-functional placeholder for legacy Developer Portal API key workflows.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">API Usage Analytics</p>
                <Badge variant="outline">Planned migration from demo</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Non-functional placeholder for request volume, error rate, and endpoint usage visualizations.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reference">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">API Reference Docs</p>
                <Badge variant="outline">Planned migration from demo</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Non-functional placeholder for endpoint docs and webhook payload schema references.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
