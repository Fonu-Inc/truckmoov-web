import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganizationSettingsForm from "../components/OrganizationSettingsForm";
import { Separator } from "@/components/ui/separator";
import UploadImage from "../components/UploadImage";

export default function Settings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your organization's information and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <UploadImage />

        <Separator />
        <OrganizationSettingsForm />
      </CardContent>
    </Card>
  )
}
