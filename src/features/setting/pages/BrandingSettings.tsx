import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import UploadImage from "../components/UploadImage";
import BrandingColorPaletterForm from "../components/BrandingColorPaletteForm";

export default function BrandingSettings() {
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
     <UploadImage />
    </CardContent>
   </Card>
   <BrandingColorPaletterForm />
  </div>
 )
}
