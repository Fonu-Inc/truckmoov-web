import { useUploadImageToBucket } from "@/features/auth/api";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type ImageUploadInputProps = {
  onChange: (url: string) => void;
  value?: string;
};

export default function ImageUploadInput({ onChange, value }: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadImage, isPending } = useUploadImageToBucket();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is larger than 2MB");
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";

    await uploadImage(
      { files: [file] },
      {
        onSuccess: (data) => {
          onChange(data.data.url);
        },
      }
    );
  };

  return (
    <div
      className="relative flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-background transition-colors hover:bg-accent/50"
      onClick={() => !isPending && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {isPending ? (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Uploading...</span>
        </div>
      ) : value ? (
        <img src={value} alt="Plate number" className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Upload className="h-5 w-5" />
          <span className="text-xs">Upload image</span>
          <span className="text-xs opacity-60">PNG, JPG, WebP · Max 2MB</span>
        </div>
      )}

      {value && !isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex flex-col items-center gap-1 text-white">
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs">Change image</span>
          </div>
        </div>
      )}
    </div>
  );
}
