import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationSettingsForm from "../components/OrganizationSettingsForm";
import { Separator } from "@/components/ui/separator";
import UploadImage from "../../../shared/components/UploadImage";
import { useUpdateUserProfile } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { useMemo } from "react";

export default function Settings() {
  const { user } = useAuthStore();
  const userLogoUrl = useMemo(() => user.profile?.profilePictureUrl, [user])

  const {
    mutateAsync: updateUserProfile,
    isPending: isUpdatingUserProfile
  } = useUpdateUserProfile()

  async function updateProfileLogo(url: string) {
    await updateUserProfile({
      data: {
        profilePictureUrl: url
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your organization's information and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UploadImage
          onUpload={updateProfileLogo}
          currentUrl={userLogoUrl}
          uploading={isUpdatingUserProfile}
          text="Profile"
        />

        <Separator />
        <OrganizationSettingsForm />
      </CardContent>
    </Card>
  )
}
