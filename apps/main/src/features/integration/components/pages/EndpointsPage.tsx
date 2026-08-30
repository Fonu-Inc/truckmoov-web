import {
  Check, Copy, Terminal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/shadcn/accordion";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import {
  API_BASE_URL, API_ENDPOINTS, METHOD_COLORS,
} from "@/features/integration/utils/apiDocsData";

export default function EndpointsPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(API_ENDPOINTS.map(e => e.category))),
  ];

  const filteredEndpoints = selectedCategory === "all"
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success("Copied to clipboard");
    setTimeout(
      setCopiedText,
      2000,
      null,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Endpoints</h3>
          <p className="text-sm text-muted-foreground">
            Base URL:
            {" "}
            <code className="bg-muted px-2 py-0.5 rounded">{API_BASE_URL}</code>
          </p>
        </div>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem
                key={cat}
                value={cat}
                className="capitalize"
              >
                {cat === "all" ? "All categories" : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion
        type="single"
        collapsible
        className="space-y-2"
      >
        {filteredEndpoints.map((endpoint, i) => (
          <AccordionItem
            key={i}
            value={`endpoint-${i}`}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 text-left">
                <Badge className={METHOD_COLORS[endpoint.method]}>
                  {endpoint.method}
                </Badge>
                <code className="text-sm font-mono">{endpoint.path}</code>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  —
                  {" "}
                  {endpoint.description}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <p className="text-sm text-muted-foreground">{endpoint.description}</p>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Scope:
                  {endpoint.scope}
                </Badge>
                <Badge variant="secondary">{endpoint.category}</Badge>
              </div>

              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Parameters</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Name</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Location</th>
                          <th className="text-left p-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.parameters.map((param, pi) => (
                          <tr
                            key={pi}
                            className="border-t"
                          >
                            <td className="p-2">
                              <code className="text-xs">{param.name}</code>
                              {param.required && <span className="text-destructive ml-1">*</span>}
                            </td>
                            <td className="p-2 text-muted-foreground">{param.type}</td>
                            <td className="p-2">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {param.location}
                              </Badge>
                            </td>
                            <td className="p-2 text-muted-foreground">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {endpoint.requestBody && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Request Body</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(
                        JSON.stringify(
                          endpoint.requestBody?.example,
                          null,
                          2,
                        ),
                        `req-${i}`,
                      )}
                    >
                      {copiedText === `req-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(
                      endpoint.requestBody.example,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Response</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(
                      JSON.stringify(
                        endpoint.response.example,
                        null,
                        2,
                      ),
                      `res-${i}`,
                    )}
                  >
                    {copiedText === `res-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{endpoint.response.description}</p>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-64">
                  {JSON.stringify(
                    endpoint.response.example,
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Example Request
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(
                      `curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\\n  -H "X-API-Key: tm_your_api_key" \\\n  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\\n  -d '${JSON.stringify(endpoint.requestBody.example)}'` : ""}`,
                      `curl-${i}`,
                    )}
                  >
                    {copiedText === `curl-${i}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                  {`curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\
  -H "X-API-Key: tm_your_api_key" \\
  -H "Content-Type: application/json"${endpoint.requestBody
                ? ` \\
  -d '${JSON.stringify(endpoint.requestBody.example)}'`
                : ""}`}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
