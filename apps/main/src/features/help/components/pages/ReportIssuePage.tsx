import { useNavigate } from "react-router";
import { ReportIssue } from "@/components/support/ReportIssue";

export default function ReportIssuePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Report an Issue</h2>
        <p className="text-sm text-muted-foreground">
          Submit a new ticket to the platform support team with relevant context and details.
        </p>
      </div>
      <ReportIssue onSuccess={() => navigate("/help")} />
    </div>
  );
}
