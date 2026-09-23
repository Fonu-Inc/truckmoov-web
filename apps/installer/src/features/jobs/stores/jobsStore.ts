import type {
  EvidenceItem,
  InstallationJob,
  Installer,
  InstallerNotification,
} from "@/features/jobs/demoData";
import { create } from "zustand";
import {
  CURRENT_INSTALLER,
  SEED_JOBS,
  SEED_NOTIFICATIONS,
} from "@/features/jobs/demoData";

/**
 * Session state for the demo job domain.
 *
 * ponytail: deliberately NOT persisted. The reference app keeps this in
 * localStorage, which makes mock data look like a backend and leaves stale
 * rows behind after the real endpoints land. Edits here last for the tab and
 * reset on reload — the same call as the admin installers page.
 */
type JobsState = {
  installer: Installer;
  jobs: InstallationJob[];
  notifications: InstallerNotification[];

  updateInstaller: (patch: Partial<Installer>) => void;
  startJob: (jobId: string) => void;
  completeJob: (jobId: string) => void;
  toggleChecklistItem: (jobId: string, itemId: string) => void;
  setInstallerNotes: (jobId: string, notes: string) => void;
  addEvidence: (jobId: string, item: EvidenceItem) => void;
  removeEvidence: (jobId: string, evidenceId: string) => void;
  reportIssue: (jobId: string, type: string, description: string, photos: EvidenceItem[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
};

const now = () => new Date().toISOString();

function patchJob(
  jobs: InstallationJob[],
  jobId: string,
  fn: (job: InstallationJob) => InstallationJob,
) {
  return jobs.map(j => (j.id === jobId ? fn(j) : j));
}

export const useJobsStore = create<JobsState>(set => ({
  installer: CURRENT_INSTALLER,
  jobs: SEED_JOBS,
  notifications: SEED_NOTIFICATIONS,

  updateInstaller: patch => set(s => ({
    installer: {
      ...s.installer, ...patch, lastActivity: now(),
    },
  })),

  startJob: jobId => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job,
        status: "in_progress",
        history: [
          ...job.history,
          {
            at: now(), label: "Installation started",
          },
        ],
      }),
    ),
  })),

  completeJob: jobId => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job,
        status: "completed",
        completedAt: now(),
        history: [
          ...job.history,
          {
            at: now(), label: "Installation completed",
          },
        ],
      }),
    ),
  })),

  toggleChecklistItem: (jobId, itemId) => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job,
        checklist: {
          ...job.checklist, [itemId]: !job.checklist[itemId],
        },
      }),
    ),
  })),

  setInstallerNotes: (jobId, notes) => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job, installerNotes: notes,
      }),
    ),
  })),

  addEvidence: (jobId, item) => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job,
        evidence: [
          ...job.evidence,
          item,
        ],
      }),
    ),
  })),

  removeEvidence: (jobId, evidenceId) => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job, evidence: job.evidence.filter(e => e.id !== evidenceId),
      }),
    ),
  })),

  reportIssue: (jobId, type, description, photos) => set(s => ({
    jobs: patchJob(
      s.jobs,
      jobId,
      job => ({
        ...job,
        status: "issue_reported",
        issue: {
          type,
          description,
          reportedAt: now(),
          photos,
        },
        history: [
          ...job.history,
          {
            at: now(), label: `Issue reported: ${type}`,
          },
        ],
      }),
    ),
  })),

  markNotificationRead: id => set(s => ({
    notifications: s.notifications.map(n => (n.id === id
      ? {
          ...n, read: true,
        }
      : n)),
  })),

  markAllNotificationsRead: () => set(s => ({
    notifications: s.notifications.map(n => ({
      ...n, read: true,
    })),
  })),
}));

/** The signed-in installer's jobs and notifications. */
export function useMyJobs() {
  const installer = useJobsStore(s => s.installer);
  const jobs = useJobsStore(s => s.jobs);
  return jobs.filter(j => j.installerId === installer.id);
}

export function useMyNotifications() {
  const installer = useJobsStore(s => s.installer);
  const notifications = useJobsStore(s => s.notifications);
  return notifications.filter(n => n.installerId === installer.id);
}
