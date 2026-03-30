import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/features/auth/api/types";

type UserRoleSelectProps = {
 value?: string;
 onValueChange?: (value: string) => void;
 label?: string;
 id?: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
 ENTERPRISE_ADMIN: "Enterprise Admin - Full access",
 AGGREGATOR_ADMIN: "Aggregator Admin - Manage linked operators",
 OWNER_OPERATOR: "Owner-Operator - Execute assigned jobs",
 PLATFORM_ADMIN: "Platform Admin - Platform-wide administration",
 FLEET_ADMIN: "Fleet Admin - Manage fleet & drivers",
 OPERATIONS_MANAGER: "Operations Manager - Monitor operations",
 DISPATCHER: "Dispatcher - Assign and track jobs",
 FINANCE_VIEWER: "Finance Viewer - Read-only financial access",
};

const rolesOption: Array<{ value: UserRole; label: string }> = Object.entries(ROLE_LABELS).map(([value, label]) => ({
 value: value as UserRole,
 label,
}));

export default function UserRoleSelect({ value, onValueChange, label = "Role", id = "role" }: UserRoleSelectProps) {
 return (
  <div className="space-y-2">
   <Label htmlFor={id}>{label}</Label>
   <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger id={id}>
     <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
     {rolesOption.map(option => (
      <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
     ))}
    </SelectContent>
   </Select>
  </div>
 );
}
