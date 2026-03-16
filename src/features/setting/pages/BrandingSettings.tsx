import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import UploadImage from "../../../shared/components/UploadImage";
import BrandingColorPaletterForm from "../components/BrandingColorPaletteForm";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationsSettingsQueryOptions, useUpdateOrganizationSettings } from "@/features/auth/api";
import { useMemo } from "react";
import { Branding } from "@/features/auth/api/types";

export default function BrandingSettings() {
 const { data } = useQuery(getOrganizationsSettingsQueryOptions())
 const orgLogoUrl = useMemo(() => data?.data?.branding?.logoUrl, [data])

 const {
  mutateAsync: updateOrgSetitng,
  isPending: isUpdatingOrgSettings
 } = useUpdateOrganizationSettings()

 async function updateOrgLogo(url: string) {
  await updateOrgSetitng({
   data: {
    branding: {
     logoUrl: url
    } as Branding
   }
  })
 }
 return (
  <div className="space-y-6">
   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <ImageIcon className="h-5 w-5" />
      Organization Logo
     </CardTitle>
     <CardDescription>
      Upload your organization's logo. It will appear in the sidebar and header.
     </CardDescription>
    </CardHeader>
    <CardContent>
     <UploadImage
      onUpload={updateOrgLogo}
      currentUrl={orgLogoUrl}
      uploading={isUpdatingOrgSettings}
     />
    </CardContent>
   </Card>
   <BrandingColorPaletterForm />
  </div>
 )
}
