import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import JobFormModal from "./JobFormModal";

export default function JobActions() {
 const [statusFilter, setStatusFilter] = useState("all");
 const [openJobForm, setOpenJobForm] = useState(false);

 return (
  <>
   <div className="flex flex-col flex-wrap sm:flex-row gap-4 items-start sm:items-center justify-between">
    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
     <TabsList className="bg-muted/50">
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="created">Pending</TabsTrigger>
      <TabsTrigger value="assigned">Assigned</TabsTrigger>
      <TabsTrigger value="in_progress">In Progress</TabsTrigger>
      <TabsTrigger value="completed">Completed</TabsTrigger>
     </TabsList>
    </Tabs>

    <div className="flex gap-2">
     {/* {isAIRouteOptEnabled && (
      <Button variant="outline" onClick={() => setIsRouteOptimizationOpen(true)}>
       <Route className="h-4 w-4" />
       Optimize Routes
      </Button>
     )} */}
     <Button onClick={() => setOpenJobForm(true)}>
      <Plus className="h-4 w-4" />
      Create Job
     </Button>
    </div>
   </div>

   <div className="flex gap-4">
    <div className="relative flex-1">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
     <Input
      placeholder="Search by reference, pickup, or delivery..."
      className="pl-10 bg-card/50 border-border/50"
     />
    </div>
    <Select>
     <SelectTrigger className="w-45 bg-card/50 border-border/50">
      <SelectValue placeholder="Sort by" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="deadline">Deadline</SelectItem>
      <SelectItem value="amount">Amount</SelectItem>
      <SelectItem value="created">Created Date</SelectItem>
     </SelectContent>
    </Select>
   </div>


   <JobFormModal open={openJobForm} onOpenChange={setOpenJobForm} />
  </>
 )
}
