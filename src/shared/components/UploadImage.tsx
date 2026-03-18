import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUploadImageToBucket } from "@/features/auth/api";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type UploadImageProps = {
 onUpload: (url: string) => Promise<void>;
 currentUrl?: string | null;
 uploading: boolean;
 text?: string
}

export default function UploadImage({ onUpload, currentUrl, uploading, text }: UploadImageProps) {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);

 const { mutateAsync: uploadImage, isPending: uploadingImage } = useUploadImageToBucket()

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

  await uploadImage(
   { 
    files: [file]
   },
   {
    onSuccess: async (data) => {
     const imageUrl = data.data.url
     await onUpload(imageUrl);
    } 
   }
  );
 };

 const handleRemoveLogo = async () => {
  setPreviewUrl(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
 };

 useEffect(() => {
  setPreviewUrl(currentUrl);
 }, [currentUrl])


 return (
  <div className="flex items-center gap-6">
   <Avatar className="h-20 w-20 rounded-full">
    <AvatarImage src={previewUrl ?? undefined} className="object-contain" />
    <AvatarFallback className="bg-primary/20 text-primary text-xl">
     {text ?? "Logo"}
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
     isLoading={uploadingImage || uploading}
    >
     <Upload className="h-4 w-4 mr-2" />
     Upload Logo
    </Button>
    <p className="text-xs text-muted-foreground">PNG, JPG, SVG or WebP. Max 2MB.</p>
    {previewUrl && !uploadingImage && (
     <Button
      variant="ghost"
      size="sm"
      className="text-xs text-destructive"
      onClick={handleRemoveLogo}
      isLoading={uploadingImage || uploading}
     >
      Remove logo
     </Button>
    )}
   </div>
  </div>
 )
}
