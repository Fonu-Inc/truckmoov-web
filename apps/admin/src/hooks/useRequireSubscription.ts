export interface SubscriptionGate {
  /** True when the user may perform restricted (write) actions. */
  hasActiveSubscription: boolean;
  /**
   * Wrap a click handler. Subscription is no longer part of Get Started,
   * so the original handler is always invoked.
   */
  requireSubscription<T extends unknown[]>(
    fn?: (...args: T) => void,
  ): (...args: T) => void;
}

/**
 * Compatibility hook for older action wrappers. Subscription is no longer
 * part of the Get Started flow, so this never blocks actions.
 */
export function useRequireSubscription(): SubscriptionGate {
  const requireSubscription =
    <T extends unknown[]>(fn?: (...args: T) => void) =>
    (...args: T) => {
      fn?.(...args);
    };

  return { hasActiveSubscription: true, requireSubscription };
}



