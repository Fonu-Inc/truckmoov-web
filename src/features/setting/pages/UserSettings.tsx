import { Card } from "@/components/ui/card";
import InviteUserDialog from "../components/InviteUserDialog";
import UsersTable from "../components/UsersTable";

export default function UserSettings() {
 return (
  <>
   <section className="flex items-center justify-between">
    <div>
     <h3 className="text-lg font-semibold">Team Members</h3>
     <p className="text-sm text-muted-foreground">Manage who has access to your organization</p>
    </div>
    <InviteUserDialog />
   </section>
   <Card>
    {/* <UsersTable /> */}
   </Card>
  </>
 )
}
