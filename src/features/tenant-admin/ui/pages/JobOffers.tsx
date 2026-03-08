import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobOffersInbox } from "@/components/jobs/JobOffersInbox";

export default function JobOffersPage() {
  return (
    <DashboardLayout
      title="Job Offers"
      subtitle="Review and respond to incoming job offers from enterprises"
    >
      <JobOffersInbox />
    </DashboardLayout>
  );
}
