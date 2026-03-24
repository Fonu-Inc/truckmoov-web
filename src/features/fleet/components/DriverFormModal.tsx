import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useDriverStore } from "../stores/driver";
import { FormMode } from "@/shared/types";

type DriverFormModalProps = {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 mode?: FormMode
}

export default function DriverFormModal({ open, onOpenChange, mode = "create" }: DriverFormModalProps) {
 const form = useForm({
  defaultValues: {
   firstName: "",
   lastName: "",
   phone: "",
   email: "",
   licenseNumber: "",
   licenseExpiry: "",
   status: "available",
   communicationPreference: "whatsapp",
  },
 });

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-125 bg-card border-border">
    <DialogHeader>
     <DialogTitle>{mode === "edit" ? "Edit Driver" : "Add New Driver"}</DialogTitle>
    </DialogHeader>
    <Form {...form}>
     <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
         <FormItem>
          <FormLabel>First Name</FormLabel>
          <FormControl>
           <Input placeholder="John" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Last Name</FormLabel>
          <FormControl>
           <Input placeholder="Doe" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Phone Number</FormLabel>
          <FormControl>
           <Input placeholder="+27 82 123 4567" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Email (Optional)</FormLabel>
          <FormControl>
           <Input placeholder="driver@email.com" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="licenseNumber"
        render={({ field }) => (
         <FormItem>
          <FormLabel>License Number</FormLabel>
          <FormControl>
           <Input placeholder="DL123456789" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="licenseExpiry"
        render={({ field }) => (
         <FormItem>
          <FormLabel>License Expiry</FormLabel>
          <FormControl>
           <Input type="date" {...field} />
          </FormControl>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Status</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Select status" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            <SelectItem value="active">Active (On Job)</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />
       <FormField
        control={form.control}
        name="communicationPreference"
        render={({ field }) => (
         <FormItem>
          <FormLabel>Communication</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
            <SelectTrigger>
             <SelectValue placeholder="Select channel" />
            </SelectTrigger>
           </FormControl>
           <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="voice">Voice Call</SelectItem>
           </SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )}
       />
      </div>

      <div className="flex justify-end gap-3 pt-4">
       <DialogClose asChild>
        <Button type="button" variant="outline">
         Cancel
        </Button>
       </DialogClose>
       <Button type="submit" variant="gradient">
        Add Driver
       </Button>
      </div>
     </form>
    </Form>
   </DialogContent>
  </Dialog>
 )
}
