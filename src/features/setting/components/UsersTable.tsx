import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import EditUserDialog from "./EditUserDialog";
import DeleteDialog from "@/shared/components/DeleteDialog";
import { useQuery } from "@tanstack/react-query";
import { getInvitedUserQueryOptions, useDeleteInvitedUser, useResendInvitedUserMail } from "@/features/auth/api";
import { InvitedUser } from "@/features/auth/api/types";
import AppAvatar from "@/shared/components/AppAvatar";
import RoleBadge from "./RoleBadge";
import StatusBadge from "../../../shared/components/StatusBadge";
import { timeAgo } from "@/shared/utils/time-functions";

export default function UsersTable() {
 const {
  data,
  isPending: gettingInvitedUser
 } = useQuery(getInvitedUserQueryOptions())
 const { mutateAsync: resendInvite } = useResendInvitedUserMail()
 const { mutateAsync: deleteUser, isPending: deletingUser } = useDeleteInvitedUser()
 const rows = useMemo(() => data?.data.users ?? [], [data])
 const [editUser, setEditUser] = useState(false);
 const [removeUser, setRemoveUser] = useState(false);
 const [selectedUser, setSelectedUser] = useState<InvitedUser>();

 async function handleDeleteUser() {
  if (!selectedUser) return;
  await deleteUser({ userId: selectedUser.userId }, {
   onSuccess: () => setRemoveUser(false)
  })
 }

 async function handleResendEmail(email: string) {
  await resendInvite({
   data: {
    email: email
   }
  })
 }

 function toggleModal(user: InvitedUser, type: "edit" | "remove") {
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

 const columns: ColumnDef<InvitedUser>[] = [
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
  {
   accessorKey: "status",
   header: "Status",
   cell: ({ row }) => {
    const userStatus = row.original.status
    return (
     <StatusBadge status={userStatus} />
    )
   }
  },
  {
   accessorKey: "last-active",
   header: "Last Active",
   cell: ({ row }) => {
    const lastActive = row.original.lastActiveAt
    return (
     <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {lastActive ? (
       <>
        <Clock className="h-3 w-3" />
        {timeAgo(lastActive)}
       </>
      ) : "N/A"}
     </div>
    )
   }
  },
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
   <DeleteDialog
    open={removeUser}
    onOpenChange={setRemoveUser}
    handleDeleteFn={handleDeleteUser}
    isLoading={deletingUser}
    title="Remove User"
    description={`Are you sure you want to remove ${selectedUser?.profile?.fullName} from your organization? They will lose access to all resources.`}
   />
  </>
 )
}
