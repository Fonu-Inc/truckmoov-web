import type { SetupProblem } from "./devicesSimsData";
import { Link } from "react-router";
import { NotMonitoredNote, SectionCard } from "./SectionCard";

type Props = {
  problems: SetupProblem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  installIssues: number | null;
  installOverdue: number | null;
};

function installSummary(issues: number | null, overdue: number | null) {
  if (issues === null || overdue === null)
    return null;
  if (issues + overdue === 0)
    return "No installation jobs have a reported problem or are overdue.";
  return `Installation jobs: ${issues} with a reported problem, ${overdue} overdue.`;
}

export function SetupProblemsSection({
  problems,
  isLoading,
  isError,
  onRetry,
  installIssues,
  installOverdue,
}: Props) {
  const summary = installSummary(
    installIssues,
    installOverdue,
  );
  return (
    <SectionCard
      title="Not set up correctly"
      description="Trackers and SIMs that look incomplete across all companies."
      rows={problems}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      emptyText="Nothing looks incomplete."
      rowKey={p => p.key}
      footer={(
        <>
          {summary && (
            <p className="text-sm">
              {summary}
              {" "}
              <Link
                to="/installers"
                className="text-primary underline"
              >
                Open installations
              </Link>
            </p>
          )}
          <NotMonitoredNote>Trackers that stopped reporting are not checked yet.</NotMonitoredNote>
        </>
      )}
      renderRow={p => (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{p.what}</p>
            <p className="text-xs text-muted-foreground">{p.company}</p>
            <p className="text-sm">{p.explanation}</p>
          </div>
          <Link
            to={p.to}
            className="text-sm text-primary underline"
          >
            {p.linkLabel}
          </Link>
        </div>
      )}
    />
  );
}
