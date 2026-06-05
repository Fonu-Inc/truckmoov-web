import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Label } from "@/components/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Badge } from "@/components/shadcn/badge";
import { useSupportTickets, TicketCategory, ContextType, TicketPriority } from "@/hooks/useSupportTickets";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { 
  Cpu, 
  Wifi, 
  Bell, 
  CreditCard, 
  Users, 
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface ReportIssueProps {
  onSuccess: () => void;
}

interface ContextItem {
  id: string;
  label: string;
  status?: string;
  extra?: string;
}

const categories: { value: TicketCategory; label: string; icon: React.ElementType; contextType: ContextType }[] = [
  { value: "device_tracking", label: "Device & Tracking", icon: Cpu, contextType: "device" },
  { value: "sim_connectivity", label: "SIM & Connectivity", icon: Wifi, contextType: "sim" },
  { value: "messaging", label: "Messaging (WhatsApp / SMS / Calls)", icon: Bell, contextType: "whatsapp" },
  { value: "billing", label: "Billing & Subscription", icon: CreditCard, contextType: "billing" },
  { value: "account_access", label: "Account / Access", icon: Users, contextType: "none" },
  { value: "other", label: "Other", icon: HelpCircle, contextType: "none" },
];

export function ReportIssue({ onSuccess }: ReportIssueProps) {
  const { user } = useAuthStore();
  const { createTicket } = useSupportTickets();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Form state
  const [category, setCategory] = useState<TicketCategory | null>(null);
  const [contextType, setContextType] = useState<ContextType>("none");
  const [contextId, setContextId] = useState<string | null>(null);
  const [contextSnapshot, setContextSnapshot] = useState<Record<string, unknown> | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");

  // Context options
  const [contextOptions, setContextOptions] = useState<ContextItem[]>([]);

  const tenantId = user?.tenantId ?? null;

  // Load context options when category changes
  useEffect(() => {
    if (!category) return;

    const selectedCategory = categories.find((c) => c.value === category);
    if (!selectedCategory || selectedCategory.contextType === "none") {
      setContextType("none");
      setContextOptions([]);
      return;
    }

    setContextType(selectedCategory.contextType);
    loadContextOptions(selectedCategory.contextType);
  }, [category]);

  const loadContextOptions = async (type: ContextType) => {
    setIsLoadingContext(true);
    try {
      let options: ContextItem[] = [];

      if (type === "device") {
        const { data } = await supabase
          .from("devices")
          .select("id, imei, manufacturer, model, status, health_status, last_seen")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(50);

        options = (data || []).map((d) => ({
          id: d.id,
          label: `${d.imei} - ${d.manufacturer} ${d.model || ""}`.trim(),
          status: d.health_status || d.status,
          extra: d.last_seen ? `Last seen: ${new Date(d.last_seen).toLocaleString()}` : "Never seen",
        }));
      } else if (type === "sim") {
        const { data } = await supabase
          .from("iot_sims")
          .select("id, iccid, msisdn, carrier, status, data_usage_mb, data_limit_mb")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(50);

        options = (data || []).map((s) => ({
          id: s.id,
          label: `${s.msisdn} (${s.iccid.slice(-6)})`,
          status: s.status,
          extra: `${s.carrier} • ${s.data_usage_mb}/${s.data_limit_mb} MB`,
        }));
      } else if (type === "vehicle") {
        const { data } = await supabase
          .from("vehicles")
          .select("id, registration_number, make, model, status")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(50);

        options = (data || []).map((v) => ({
          id: v.id,
          label: `${v.registration_number} - ${v.make} ${v.model}`,
          status: v.status,
        }));
      }

      setContextOptions(options);
    } catch (err) {
      console.error("Error loading context options:", err);
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Load context snapshot when context is selected
  const loadContextSnapshot = async (type: ContextType, id: string) => {
    try {
      let snapshot: Record<string, unknown> = {};

      if (type === "device") {
        const { data: device } = await supabase
          .from("devices")
          .select("*")
          .eq("id", id)
          .single();

        if (device) {
          snapshot = {
            imei: device.imei,
            manufacturer: device.manufacturer,
            model: device.model,
            status: device.status,
            lifecycle_status: device.lifecycle_status,
            health_status: device.health_status,
            last_seen: device.last_seen,
            signal_strength: device.signal_strength,
            battery_level: device.battery_level,
            firmware_version: device.firmware_version,
            verification_status: device.verification_status,
          };
        }
      } else if (type === "sim") {
        const { data: sim } = await supabase
          .from("iot_sims")
          .select("*")
          .eq("id", id)
          .single();

        if (sim) {
          snapshot = {
            iccid: sim.iccid,
            msisdn: sim.msisdn,
            carrier: sim.carrier,
            status: sim.status,
            data_usage_mb: sim.data_usage_mb,
            data_limit_mb: sim.data_limit_mb,
            network_type: sim.network_type,
            signal_strength: sim.signal_strength,
            last_activity: sim.last_activity,
          };
        }
      } else if (type === "vehicle") {
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", id)
          .single();

        if (vehicle) {
          snapshot = {
            registration_number: vehicle.registration_number,
            make: vehicle.make,
            model: vehicle.model,
            status: vehicle.status,
            type: vehicle.type,
          };
        }
      }

      setContextSnapshot(snapshot);
    } catch (err) {
      console.error("Error loading context snapshot:", err);
    }
  };

  const handleContextSelect = (id: string) => {
    setContextId(id);
    loadContextSnapshot(contextType, id);
  };

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        contextType,
        contextId: contextId || undefined,
        contextSnapshot: contextSnapshot || undefined,
      });

      if (ticket) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.value === category);

  return (
    <div className="space-y-6 w-full">
      {/* Step 1: Category Selection */}
      <Card className={step !== 1 ? "opacity-60" : ""}>
        <CardHeader className="cursor-pointer" onClick={() => step > 1 && setStep(1)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 1 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              <CardTitle className="text-lg">Issue Category</CardTitle>
            </div>
            {category && step > 1 && (
              <Badge variant="outline">{selectedCategory?.label}</Badge>
            )}
          </div>
          {step === 1 && (
            <CardDescription>What type of issue are you experiencing?</CardDescription>
          )}
        </CardHeader>
        {step === 1 && (
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setStep(2);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-colors hover:border-primary/50 ${
                    category === cat.value ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <cat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Step 2: Context Selection */}
      {step >= 2 && contextType !== "none" && (
        <Card className={step !== 2 ? "opacity-60" : ""}>
          <CardHeader className="cursor-pointer" onClick={() => step > 2 && setStep(2)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 2 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                  {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                </div>
                <CardTitle className="text-lg">Select {contextType === "device" ? "Device" : contextType === "sim" ? "SIM" : contextType === "vehicle" ? "Vehicle" : "Context"}</CardTitle>
              </div>
              {contextId && step > 2 && (
                <Badge variant="outline">
                  {contextOptions.find((o) => o.id === contextId)?.label.slice(0, 30)}...
                </Badge>
              )}
            </div>
            {step === 2 && (
              <CardDescription>
                Select the affected {contextType} to auto-attach diagnostic information
              </CardDescription>
            )}
          </CardHeader>
          {step === 2 && (
            <CardContent>
              {isLoadingContext ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : contextOptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {contextType}s found.</p>
                  <Button variant="link" onClick={() => setStep(3)} className="mt-2">
                    Skip this step
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contextOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        handleContextSelect(option.id);
                        setStep(3);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover:border-primary/50 ${
                        contextId === option.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        {option.extra && (
                          <p className="text-xs text-muted-foreground">{option.extra}</p>
                        )}
                      </div>
                      {option.status && (
                        <Badge variant="outline" className="capitalize">
                          {option.status}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                  Skip - No specific {contextType}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 3: Ticket Details */}
      {step >= 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {contextType === "none" ? "2" : "3"}
              </div>
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </div>
            <CardDescription>Describe your issue in detail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Context Preview */}
            {contextSnapshot && Object.keys(contextSnapshot).length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  Context auto-attached
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {Object.entries(contextSnapshot).slice(0, 6).map(([key, value]) => (
                    <div key={key}>
                      <span className="capitalize">{key.replace(/_/g, " ")}: </span>
                      <span className="text-foreground">{String(value) || "N/A"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. What happened? What did you expect? When did it start?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General question or minor issue</SelectItem>
                  <SelectItem value="medium">Medium - Affecting operations</SelectItem>
                  <SelectItem value="high">High - Significant business impact</SelectItem>
                  <SelectItem value="critical">Critical - Complete system down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Start Over
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!subject.trim() || !description.trim() || isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
