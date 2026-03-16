import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function UploadImage() {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isUploading, setIsUploading] = useState(false);
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);


 const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
   toast.error("File is larger than 2MB")
   return;
  }

  const objectUrl = URL.createObjectURL(file);
  setPreviewUrl(objectUrl);

  if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const handleRemoveLogo = async () => {
  setPreviewUrl(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
 };


 return (
  <div className="flex items-center gap-6">
   <Avatar className="h-20 w-20 rounded-lg">
    <AvatarImage src={previewUrl ?? undefined} className="object-contain" />
    <AvatarFallback className="bg-primary/20 text-primary text-xl rounded-lg">
     Logo
    </AvatarFallback>
   </Avatar>
   <div className="space-y-2">
    <input
     ref={fileInputRef}
     type="file"
     accept="image/png,image/jpeg,image/svg+xml,image/webp"
     className="hidden"
     onChange={handleLogoUpload}
    />
    <Button
     variant="outline"
     size="sm"
     onClick={() => fileInputRef.current?.click()}
     disabled={isUploading}
    >
     <Upload className="h-4 w-4 mr-2" />
     {isUploading ? "Uploading..." : "Upload Logo"}
    </Button>
    <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2MB.</p>
    {previewUrl && (
     <Button
      variant="ghost"
      size="sm"
      className="text-xs text-destructive"
      onClick={handleRemoveLogo}
      disabled={isUploading}
     >
      Remove logo
     </Button>
    )}
   </div>
  </div>
 )
}
