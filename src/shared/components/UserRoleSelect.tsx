import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/features/auth/api/types";

type UserRoleSelectProps = {
 value?: string;
 onValueChange?: (value: string) => void;
 label?: string;
 id?: string;
};

const rolesOption: Array<{
 value: UserRole,
 label: string;
}> = [
  {
   value: "ENTERPRISE_ADMIN",
   label: "Admin - Full access"
  },
  {
   value: "FLEET_ADMIN",
   label: "Manager - Manage fleet & drivers"
  },
  {
   value: "OPERATIONS_MANAGER",
   label: "Supervisor - Monitor operations"
  },
  {
   value: "DISPATCHER",
   label: "Dispatcher - Assign jobs"
  },
  {
   value: "FINANCE_VIEWER",
   label: "Viewer - Read-only access"
  },
 ]

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
