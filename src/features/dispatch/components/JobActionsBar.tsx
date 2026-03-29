import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

export default function JobActionsBar() {
 return (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
   <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
     placeholder="Search jobs..."
     className="pl-9"
    />
   </div>
   <Select>
    <SelectTrigger className="w-full sm:w-45">
     <Filter className="h-4 w-4 mr-2" />
     <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
     <SelectItem value="all">All Status</SelectItem>
     <SelectItem value="created">Pending</SelectItem>
     <SelectItem value="in_progress">In Progress</SelectItem>
     <SelectItem value="completed">Completed</SelectItem>
     <SelectItem value="cancelled">Cancelled</SelectItem>
    </SelectContent>
   </Select>
  </div>
 )
}
