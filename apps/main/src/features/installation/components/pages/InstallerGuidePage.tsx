import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { InstallerGuide } from "@truckmoov/reusables/components/installation/InstallerGuide";
import { useOutletContext } from "react-router";

export default function InstallerGuidePage() {
  const {
    catalog,
    catalogLoading,
  } = useOutletContext<InstallationLayoutContext>();

  return (
    <InstallerGuide
      catalog={catalog}
      loading={catalogLoading}
    />
  );
}
