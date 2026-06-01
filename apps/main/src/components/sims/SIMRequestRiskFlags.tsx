import { Badge } from "@/components/shadcn/badge";
import { AlertTriangle, ShieldAlert, TrendingUp, Database } from "lucide-react";
import { SIMProvisioningRequest } from "@/hooks/useFonuSIM";

interface RiskFlag {
  type: "high" | "medium" | "low";
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface SIMRequestRiskFlagsProps {
  request: SIMProvisioningRequest;
  kycStatus: string | null;
}

export function SIMRequestRiskFlags({ request, kycStatus }: SIMRequestRiskFlagsProps) {
  const riskFlags: RiskFlag[] = [];

  // Large volume flag (>50 SIMs)
  if (request.number_of_sims && request.number_of_sims > 50) {
    riskFlags.push({
      type: "high",
      label: "Large Volume",
      description: `${request.number_of_sims} SIMs requested - requires additional verification`,
      icon: <TrendingUp className="h-3 w-3" />,
    });
  } else if (request.number_of_sims && request.number_of_sims > 20) {
    riskFlags.push({
      type: "medium",
      label: "Moderate Volume",
      description: `${request.number_of_sims} SIMs requested`,
      icon: <TrendingUp className="h-3 w-3" />,
    });
  }

  // Missing KYC flag
  if (!kycStatus || kycStatus !== "verified") {
    riskFlags.push({
      type: "high",
      label: "KYC Not Verified",
      description: kycStatus === "pending" || kycStatus === "under_review" 
        ? "KYC verification in progress" 
        : "Tenant has not completed KYC verification",
      icon: <ShieldAlert className="h-3 w-3" />,
    });
  }

  // Unusual data limit flag (>10GB per SIM)
  if (request.requested_data_limit_mb && request.requested_data_limit_mb > 10240) {
    riskFlags.push({
      type: "medium",
      label: "High Data Limit",
      description: `${(request.requested_data_limit_mb / 1024).toFixed(1)}GB per SIM - above standard allocation`,
      icon: <Database className="h-3 w-3" />,
    });
  }

  // Missing device mapping for large orders
  if (request.number_of_sims && request.number_of_sims > 10 && !request.device_mapping_enabled) {
    riskFlags.push({
      type: "low",
      label: "No Device Mapping",
      description: "Large order without device mapping - manual assignment required",
      icon: <AlertTriangle className="h-3 w-3" />,
    });
  }

  if (riskFlags.length === 0) {
    return null;
  }

  const getBadgeVariant = (type: RiskFlag["type"]) => {
    switch (type) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "outline";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Risk Flags</p>
      <div className="flex flex-wrap gap-2">
        {riskFlags.map((flag, index) => (
          <Badge
            key={index}
            variant={getBadgeVariant(flag.type)}
            className="flex items-center gap-1"
            title={flag.description}
          >
            {flag.icon}
            {flag.label}
          </Badge>
        ))}
      </div>
      {riskFlags.some((f) => f.type === "high") && (
        <p className="text-xs text-destructive mt-1">
          ⚠️ High-risk flags require additional review before approval
        </p>
      )}
    </div>
  );
}
