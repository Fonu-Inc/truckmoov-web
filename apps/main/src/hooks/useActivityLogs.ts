import {
  useEffect, useState,
} from "react";

type ActivityLog = {
  id: string;
  description: string;
  created_at: string;
  actor_name?: string;
};

type UseActivityLogsOptions = {
  entityType: string;
  entityId: string;
  enabled?: boolean;
};

export function useActivityLogs({
  entityId, enabled = true,
}: UseActivityLogsOptions) {
  const [
    logs,
    setLogs,
  ] = useState<ActivityLog[]>([]);
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  useEffect(
    () => {
      if (!enabled || !entityId)
        return;
      setIsLoading(true);
      // Stub: no activity logs available yet
      const timer = setTimeout(
        () => {
          setLogs([]);
          setIsLoading(false);
        },
        300,
      );
      return () => clearTimeout(timer);
    },
    [
      entityId,
      enabled,
    ],
  );

  return {
    logs, isLoading,
  };
}
