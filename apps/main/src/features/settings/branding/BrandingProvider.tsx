import { useQuery } from "@tanstack/react-query";
import { getOrganizationSettingsQueryOptions } from "@truckmoov/api/auth";
import { useEffect } from "react";
import { applyBrandingToDocument, clearBrandingFromDocument } from "./tokens";

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    ...getOrganizationSettingsQueryOptions(),
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    applyBrandingToDocument(data?.data?.branding);
    return () => clearBrandingFromDocument();
  }, [data?.data?.branding]);

  return <>{children}</>;
}
