import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@radix-ui/react-avatar";
import { Clock, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function UsersTable() {
 return (
  <Table>
   <TableHeader>
    <TableRow className="border-border/50 hover:bg-transparent">
     <TableHead>User</TableHead>
     <TableHead>Role</TableHead>
     <TableHead>Status</TableHead>
     <TableHead>Last Active</TableHead>
     <TableHead className="w-[60px]"></TableHead>
    </TableRow>
   </TableHeader>
   <TableBody>
    {isLoadingUsers ? (
     <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
       Loading users...
      </TableCell>
     </TableRow>
    ) : tenantUsers.length === 0 ? (
     <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
       No team members yet. Invite someone to get started.
      </TableCell>
     </TableRow>
    ) : tenantUsers.map((tenantUser) => (
     <TableRow key={tenantUser.id} className="border-border/50">
      <TableCell>
       <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
         <AvatarFallback className="bg-linear-to-br from-primary to-accent text-xs">
          {tenantUser.name.split(" ").map((n) => n[0]).join("")}
         </AvatarFallback>
        </Avatar>
        <div>
         <p className="font-medium">{tenantUser.name}</p>
         <p className="text-sm text-muted-foreground">{tenantUser.email}</p>
        </div>
       </div>
      </TableCell>
      <TableCell>
       <Badge className={roleColors[tenantUser.role]}>{tenantUser.role}</Badge>
      </TableCell>
      <TableCell>
       <Badge className={statusColors[tenantUser.status]}>{tenantUser.status}</Badge>
      </TableCell>
      <TableCell>
       <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="h-3 w-3" />
        {tenantUser.lastActive}
       </div>
      </TableCell>
      <TableCell>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
         </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
         <DropdownMenuItem onClick={() => handleEditUser(tenantUser)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit User
         </DropdownMenuItem>
         <DropdownMenuItem>
          <Mail className="h-4 w-4 mr-2" />
          Resend Invite
         </DropdownMenuItem>
         <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleOpenRemoveDialog(tenantUser)}
         >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
         </DropdownMenuItem>
        </DropdownMenuContent>
       </DropdownMenu>
      </TableCell>
     </TableRow>
    ))}
   </TableBody>
  </Table>
 )
}
