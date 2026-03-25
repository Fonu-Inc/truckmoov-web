import { Card, CardContent } from "@/components/ui/card";
import JobActions from "../components/JobActions";
import JobCard from "../components/JobCard";
import JobStats from "../components/JobStats";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import JobFormModal from "../components/JobFormModal";

export default function Job() {
  const [openJobForm, setOpenJobForm] = useState(false);

  return (
    <section className="space-y-6">
      <JobStats />
      <JobActions />
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
        )}
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No jobs yet</h3>
        <p className="text-sm text-muted-foreground max-w-62.5 mb-4">
          Create your first job to start dispatching deliveries
        </p>
        <Button size="sm" onClick={() => setOpenJobForm(true)}>
          Create Job
        </Button>
      </div>
      <JobCard />
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter
          </p>
        </CardContent>
      </Card>


      {/* modals */}
      <JobFormModal open={openJobForm} onOpenChange={setOpenJobForm} />
    </section>
  )
}
