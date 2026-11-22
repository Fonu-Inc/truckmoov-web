import {
  File as FileIcon, X,
} from "lucide-react";
import {
  useEffect, useState,
} from "react";
import { Button } from "@/components/shadcn/button";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(
    1,
    Math.round(bytes / 1024),
  )} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentChip({
  file, onRemove,
}: {
  file: File; onRemove: () => void;
}) {
  const [
    preview,
    setPreview,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      if (!file.type.startsWith("image/"))
        return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  return (
    <div className="mb-2 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-2">
      {preview
        ? (
            <img
              src={preview}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          )
        : <FileIcon className="h-8 w-8 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove attachment"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
