import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUploadModal } from "@/shared/components/BulkUploadModal";
import { InboxIcon, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDriverStore } from "../stores/driver";
import DriverFormModal from "./DriverFormModal";

export default function DriverTableActions() {
 const showInbox = useDriverStore((state) => state.showInbox)
 const setShowInbox = useDriverStore((state) => state.setShowInbox)

 const [statusFilter, setStatusFilter] = useState("all");
 const [addDriverModal, setAddDriverModal] = useState(false)

 return (
  <>
   <div className="flex flex-col flex-wrap sm:flex-row gap-4 items-start sm:items-center justify-between">
    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
     <TabsList className="bg-muted/50">
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="available">Available</TabsTrigger>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="offline">Offline</TabsTrigger>
      <TabsTrigger value="suspended">Suspended</TabsTrigger>
     </TabsList>
    </Tabs>

    <div className="flex gap-2">
     <Button variant="outline" onClick={() => setShowInbox(!showInbox)}>
      <InboxIcon className="h-4 w-4" />
      {showInbox ? "Hide Inbox" : "Message Inbox"}
     </Button>
     <BulkUploadModal
      title="Bulk Upload Drivers"
      description="Upload a CSV file with driver information. Download the template for the correct format."
      templateUrl="/templates/driver_template.csv"
      onUpload={async (dat) => {
      }}
     />
     <Button variant="gradient" onClick={() => setAddDriverModal(true)}>
      <Plus className="h-4 w-4" />
      Add Driver
     </Button>
    </div>
   </div>
   <div className="flex gap-4">
    <div className="relative flex-1">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
     <Input
      placeholder="Search by name, phone, or license..."
      className="pl-10 bg-card/50 border-border/50"
     />
    </div>
    <Select>
     <SelectTrigger className="w-45 bg-card/50 border-border/50">
      <SelectValue placeholder="Communication" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">All Channels</SelectItem>
      <SelectItem value="whatsapp">WhatsApp</SelectItem>
      <SelectItem value="sms">SMS</SelectItem>
      <SelectItem value="email">Email</SelectItem>
      <SelectItem value="voice">Voice</SelectItem>
     </SelectContent>
    </Select>
   </div>

   <DriverFormModal open={addDriverModal} onOpenChange={setAddDriverModal}/>
  </>
 )
}
