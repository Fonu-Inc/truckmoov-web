import {
  Bell,
  CheckCircle2,
  Cpu,
  CreditCard,
  HelpCircle,
  Loader2,
  Users,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { useAuthStore } from "@/stores/authStore";
// Local type aliases (hook deleted)
type TicketCategory = "device_tracking" | "sim_connectivity" | "messaging" | "billing" | "account_access" | "other";
type ContextType = "device" | "sim" | "vehicle" | "whatsapp" | "billing" | "none";
type TicketPriority = "low" | "medium" | "high" | "critical";

type ReportIssueProps = { onSuccess: () => void };

type ContextItem = {
  id: string;
  label: string;
  status?: string;
  extra?: string;
};

const categories: {
  value: TicketCategory; label: string; icon: React.ElementType; contextType: ContextType;
}[] = [
  {
    value: "device_tracking", label: "Device & Tracking", icon: Cpu, contextType: "device",
  },
  {
    value: "sim_connectivity", label: "SIM & Connectivity", icon: Wifi, contextType: "sim",
  },
  {
    value: "messaging", label: "Messaging (WhatsApp / SMS / Calls)", icon: Bell, contextType: "whatsapp",
  },
  {
    value: "billing", label: "Billing & Subscription", icon: CreditCard, contextType: "billing",
  },
  {
    value: "account_access", label: "Account / Access", icon: Users, contextType: "none",
  },
  {
    value: "other", label: "Other", icon: HelpCircle, contextType: "none",
  },
];

export function ReportIssue({ onSuccess }: ReportIssueProps) {
  const { user } = useAuthStore();
  const createTicket = async (..._args: any[]): Promise<any> => null;
  const [
    step,
    setStep,
  ] = useState(1);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  // Form state
  const [
    category,
    setCategory,
  ] = useState<TicketCategory | null>(null);
  const [
    contextType,
    setContextType,
  ] = useState<ContextType>("none");
  const [contextId] = useState<string | null>(null);
  const [contextSnapshot] = useState<Record<string, unknown> | null>(null);
  const [
    subject,
    setSubject,
  ] = useState("");
  const [
    description,
    setDescription,
  ] = useState("");
  const [
    priority,
    setPriority,
  ] = useState<TicketPriority>("medium");

  // Context options — empty stubs (no Supabase fetch)
  const contextOptions: ContextItem[] = [];

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim())
      return;

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
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(c => c.value === category);

  return (
    <div className="space-y-6 w-full">
      {/* Step 1: Category Selection */}
      <Card className={step !== 1 ? "opacity-60" : ""}>
        <CardHeader
          className="cursor-pointer"
          onClick={() => step > 1 && setStep(1)}
        >
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
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setContextType(cat.contextType);
                    setStep(cat.contextType === "none" ? 3 : 2);
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
          <CardHeader
            className="cursor-pointer"
            onClick={() => step > 2 && setStep(2)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${step > 2 ? "bg-chart-2 text-white" : "bg-primary text-primary-foreground"}`}>
                  {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
                </div>
                <CardTitle className="text-lg">
                  Select
                  {contextType === "device" ? "Device" : contextType === "sim" ? "SIM" : contextType === "vehicle" ? "Vehicle" : "Context"}
                </CardTitle>
              </div>
            </div>
            {step === 2 && (
              <CardDescription>
                Select the affected
                {" "}
                {contextType}
                {" "}
                to auto-attach diagnostic information
              </CardDescription>
            )}
          </CardHeader>
          {step === 2 && (
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No
                  {contextType}
                  s found.
                </p>
                <Button
                  variant="link"
                  onClick={() => setStep(3)}
                  className="mt-2"
                >
                  Skip this step
                </Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(3)}
                >
                  Skip - No specific
                  {" "}
                  {contextType}
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
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. What happened? What did you expect? When did it start?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={v => setPriority(v as TicketPriority)}
              >
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
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
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
