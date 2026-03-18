import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import EditUserDialog from "./EditUserDialog";
import RemoveUserDialog from "./RemoveUserDialog";

export default function UsersTable() {
 const rows = []
 const [editUser, setEditUser] = useState(false);
 const [removeUser, setRemoveUser] = useState(false);

 const columns: ColumnDef<any>[] = [
  {
   accessorKey: "user",
   header: "User"
  },
  {
   accessorKey: "role",
   header: "Role"
  },
  {
   accessorKey: "status",
   header: "Status"
  },
  {
   accessorKey: "last-active",
   header: "Last Active"
  },
  {
   id: "actions",
   cell: () => {
    return (
     <DropdownMenu>
      <DropdownMenuTrigger>
       <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
       <DropdownMenuItem onClick={() => setEditUser(true)}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit User
       </DropdownMenuItem>
       <DropdownMenuItem>
        <Mail className="h-4 w-4 mr-2" />
        Resend Invite
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => setRemoveUser(true)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Remove
       </DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>
    )
   }
  },
 ]

 return (
  <>
   <DataTable
    data={rows}
    columns={columns}
    noResultStatement="User not Invited yet"
   />
   <EditUserDialog
    open={editUser}
    onOpenChange={setEditUser}
   />
   <RemoveUserDialog
    open={removeUser}
    onOpenChange={setRemoveUser}
   />
  </>
 )
}
