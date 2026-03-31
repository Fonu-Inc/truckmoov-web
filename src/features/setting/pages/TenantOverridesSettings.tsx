import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MoreHorizontal, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OverrideStatus = "active" | "draft" | "disabled";

type TenantOverride = {
  id: string;
  tenant: string;
  category: "dispatch" | "notifications" | "retention" | "billing";
  key: string;
  value: string;
  status: OverrideStatus;
  updatedAt: string;
  note?: string;
};

const OVERRIDE_SCHEMA = z.object({
  tenant: z.string().min(1, "Tenant is required"),
  category: z.enum(["dispatch", "notifications", "retention", "billing"]),
  key: z.string().min(1, "Config key is required"),
  value: z.string().min(1, "Override value is required"),
  note: z.string().optional(),
  enabled: z.boolean().default(true),
});

type OverrideFormValues = z.infer<typeof OVERRIDE_SCHEMA>;

const STATUS_STYLES: Record<OverrideStatus, string> = {
  active: "bg-success/10 text-success border-success/30",
  draft: "bg-warning/10 text-warning border-warning/30",
  disabled: "bg-muted text-muted-foreground border-muted",
};

const INITIAL_OVERRIDES: TenantOverride[] = [
  {
    id: "OVR-1011",
    tenant: "Mercury Logistics",
    category: "dispatch",
    key: "auto_assign_enabled",
    value: "false",
    status: "active",
    updatedAt: "2026-03-30T14:20:00Z",
    note: "Manual dispatch only for high-value routes.",
  },
  {
    id: "OVR-1010",
    tenant: "RapidHaul West",
    category: "retention",
    key: "tracking_retention_days",
    value: "45",
    status: "active",
    updatedAt: "2026-03-29T10:18:00Z",
  },
  {
    id: "OVR-1009",
    tenant: "Coastal Freight",
    category: "notifications",
    key: "incident_escalation_channel",
    value: "email",
    status: "draft",
    updatedAt: "2026-03-28T09:02:00Z",
  },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

export default function TenantOverridesSettings() {
  const [overrides, setOverrides] = useState<TenantOverride[]>(INITIAL_OVERRIDES);

  const form = useForm<OverrideFormValues>({
    resolver: zodResolver(OVERRIDE_SCHEMA),
    defaultValues: {
      tenant: "",
      category: "dispatch",
      key: "",
      value: "",
      note: "",
      enabled: true,
    },
  });

  const summary = useMemo(() => {
    const tenants = new Set(overrides.map((item) => item.tenant));
    const active = overrides.filter((item) => item.status === "active").length;
    const draft = overrides.filter((item) => item.status === "draft").length;
    return { tenants: tenants.size, active, draft };
  }, [overrides]);

  const updateStatus = (id: string, status: OverrideStatus) => {
    setOverrides((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const handleSubmit = (values: OverrideFormValues) => {
    const created: TenantOverride = {
      id: `OVR-${Date.now().toString().slice(-4)}`,
      tenant: values.tenant,
      category: values.category,
      key: values.key,
      value: values.value,
      status: values.enabled ? "active" : "draft",
      updatedAt: new Date().toISOString(),
      note: values.note,
    };
    setOverrides((prev) => [created, ...prev]);
    form.reset({
      tenant: "",
      category: "dispatch",
      key: "",
      value: "",
      note: "",
      enabled: true,
    });
  };

  const columns: ColumnDef<TenantOverride>[] = [
    {
      accessorKey: "tenant",
      header: "Tenant",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.tenant}</p>
          <p className="text-xs text-muted-foreground">{row.original.id}</p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.category}
        </Badge>
      ),
    },
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.key}</span>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.value}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[row.original.status])}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.updatedAt)}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "active")}>
              Activate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "draft")}>
              Move to draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus(row.original.id, "disabled")}>
              Disable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active overrides</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tenants impacted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.tenants}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft overrides</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.draft}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Tenant Overrides
          </CardTitle>
          <CardDescription>Create customer-specific configuration overrides without branching the codebase.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tenant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <FormControl>
                        <Input placeholder="Tenant name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dispatch">Dispatch</SelectItem>
                            <SelectItem value="notifications">Notifications</SelectItem>
                            <SelectItem value="retention">Retention</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Config Key</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. auto_assign_enabled" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Override Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. false" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Optional context for this override." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <FormLabel>Enable immediately</FormLabel>
                      <p className="text-sm text-muted-foreground">Active overrides take effect instantly for the tenant.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" isLoading={form.formState.isSubmitting}>
                  Save Override
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Overrides</CardTitle>
          <CardDescription>Review tenant-specific configurations currently in effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={overrides} noResultStatement="No overrides configured yet." />
        </CardContent>
      </Card>
    </section>
  );
}
