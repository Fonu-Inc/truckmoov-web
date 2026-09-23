import { InstallerGuide } from "@truckmoov/reusables/components/installation/InstallerGuide";
import { useDeviceCatalog } from "@/features/devices/hooks/useDeviceConfig";

export default function GuidePage() {
  const {
    catalog, loading,
  } = useDeviceCatalog();

  return (
    <InstallerGuide
      catalog={catalog}
      loading={loading}
    />
  );
}
