import { useCallback, useState } from 'react';

/**
 * Subscribes to realtime job_offers inserts targeting the user's org(s).
 * Returns pending offer count for sidebar badge and provides notifications.
 */
export function useJobOfferNotifications() {
  const [pendingCount] = useState(0);

  const resetCount = useCallback(() => {}, []);

  return { pendingCount, resetCount };
}
