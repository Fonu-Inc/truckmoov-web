import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EditUserDialogProps = {
 open: boolean;
 onOpenChange: (value: boolean) => void
}

export default function EditUserDialog({ open, onOpenChange }: EditUserDialogProps) {
 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent>
    <DialogHeader>
     <DialogTitle>Edit User</DialogTitle>
     <DialogDescription>
      Update user details and permissions
     </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
     <div className="space-y-2">
      <Label htmlFor="editName">Full Name</Label>
      <Input
       id="editName"
       placeholder="Enter full name"
      />
     </div>
     <div className="space-y-2">
      <Label htmlFor="editEmail">Email</Label>
      <Input
       id="editEmail"
       disabled
       className="bg-muted"
      />
      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
     </div>
     <div className="space-y-2">
      <Label htmlFor="editRole">Role</Label>
      <Select>
       <SelectTrigger>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="admin">Admin - Full access</SelectItem>
        <SelectItem value="manager">Manager - Manage fleet & drivers</SelectItem>
        <SelectItem value="supervisor">Supervisor - Monitor operations</SelectItem>
        <SelectItem value="dispatcher">Dispatcher - Assign jobs</SelectItem>
        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
       </SelectContent>
      </Select>
     </div>
    </div>
    <div className="flex justify-end gap-3">
     <DialogClose>
      <Button variant="outline">
       Cancel
      </Button>
     </DialogClose>
     <Button>
      Save Changes
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}
