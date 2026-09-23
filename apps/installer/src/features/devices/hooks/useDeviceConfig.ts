/**
 * Device configuration data for the Config Queue, Verification and
 * Troubleshooting surfaces.
 *
 * ponytail: stubbed, exactly as `apps/main`'s InstallationLayout stubs it —
 * `packages/api` exposes no device config-queue endpoint (no lifecycle status,
 * no `device_installation_events`, no mark-configured / reset mutations). The
 * reference app reads these from Supabase, which this repo never calls.
 *
 * The components themselves are real and shared from
 * `@truckmoov/reusables/components/installation/*`; they render their own
 * empty states off this. Replace the bodies here when the endpoint lands —
 * nothing else in the app needs to change.
 */
export type ConfigQueueDevice = Record<string, unknown>;
export type DeviceCatalogEntry = Record<string, unknown>;

const NO_DEVICES: ConfigQueueDevice[] = [];
const NO_CATALOG: DeviceCatalogEntry[] = [];

export function useDeviceConfig() {
  return {
    configQueueDevices: NO_DEVICES,
    loading: false,
    refetch: () => {},
    markConfigured: async () => ({ success: false }),
    resetToConfigPending: async () => ({ success: false }),
    // Installers may configure but never reset — matches the reference's
    // canConfigureDevices() / canResetDevices() split.
    canConfigureDevices: () => true,
    canResetDevices: () => false,
  };
}

export function useDeviceCatalog() {
  return {
    catalog: NO_CATALOG,
    loading: false,
  };
}
