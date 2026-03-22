import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Mail, MoreHorizontal, Pencil, RotateCwSquare, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import EditUserDialog from "./EditUserDialog";
import RemoveUserDialog from "./RemoveUserDialog";
import { useQuery } from "@tanstack/react-query";
import { getInvitedUserQueryOptions, useResendInvitedUserMail } from "@/features/auth/api";
import { User } from "@/features/auth/api/types";
import AppAvatar from "@/shared/components/AppAvatar";
import RoleBadge from "./RoleBadge";

export default function UsersTable() {
 const {
  data,
  isPending: gettingInvitedUser
 } = useQuery(getInvitedUserQueryOptions())
 const { mutateAsync: resendInvite } = useResendInvitedUserMail()
 const rows = useMemo(() => data?.data.users ?? [], [data])
 const [editUser, setEditUser] = useState(false);
 const [removeUser, setRemoveUser] = useState(false);
 const [selectedUser, setSelectedUser] = useState<User>();

 async function handleResendEmail(email: string) {
  await resendInvite({
   data: {
    email: email
   }
  })
 }

 function toggleModal(user: User, type: "edit" | "remove") {
  setSelectedUser(user);
  if (type === "edit") {
   setEditUser(true)
   return;
  }
  if (type === "remove") {
   setRemoveUser(true)
   return;
  }
 }

 const columns: ColumnDef<User>[] = [
  {
   accessorKey: "user",
   header: "User",
   cell: ({ row }) => {
    const userName = row.original.profile.fullName
    const userEmail = row.original.email
    return (
     <div className="flex items-center gap-3">
      <AppAvatar value={userName} className="w-8 h-8" />
      <div>
       <p className="font-medium truncate">{userName}</p>
       <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
      </div>
     </div>
    )
   }
  },
  {
   accessorKey: "role",
   header: "Role",
   cell: ({ row }) => {
    const userRole = row.original.role
    return (
     <RoleBadge role={userRole} />
    )
   }
  },
  // {
  //  accessorKey: "status",
  //  header: "Status"
  // },
  // {
  //  accessorKey: "last-active",
  //  header: "Last Active"
  // },
  {
   id: "actions",
   cell: ({ row }) => {
    const user = row.original

    return (
     <DropdownMenu>
      <DropdownMenuTrigger>
       <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
       <DropdownMenuItem onClick={() => toggleModal(user, "edit")}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit User
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => handleResendEmail(user.email)}>
        <Mail className="h-4 w-4 mr-2" />
        Resend Invite
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => toggleModal(user, "remove")} className="text-red-500 hover:bg-red-500">
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
    isLoading={gettingInvitedUser}
   />
   <EditUserDialog
    user={selectedUser}
    open={editUser}
    onOpenChange={setEditUser}
   />
   <RemoveUserDialog
    user={selectedUser}
    open={removeUser}
    onOpenChange={setRemoveUser}
   />
  </>
 )
}
