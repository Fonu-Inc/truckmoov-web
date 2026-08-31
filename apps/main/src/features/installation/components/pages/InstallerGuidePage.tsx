import type { InstallationLayoutContext } from "@/features/installation/components/layout/InstallationLayout";
import { useOutletContext } from "react-router";
import { InstallerGuide } from "@/features/installation/components/ui/InstallerGuide";

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
