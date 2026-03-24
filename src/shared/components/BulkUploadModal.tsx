import { useState, useCallback } from "react";
import { Upload, FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BulkUploadModalProps {
 title: string;
 description: string;
 onUpload: (file: File) => Promise<void>;
 templateUrl?: string;
}

export function BulkUploadModal({
 title,
 description,
 onUpload,
 templateUrl,
}: BulkUploadModalProps) {
 const [open, setOpen] = useState(false);
 const [isDragging, setIsDragging] = useState(false);
 const [file, setFile] = useState<File | null>(null);
 const [isPending, setIsPending] = useState(false);

 const handleFile = useCallback((selected: File) => {
  if (!selected.name.endsWith(".csv")) {
   toast.error("Please upload a CSV file");
   return;
  }
  setFile(selected);
 }, []);

 const handleDrop = useCallback(
  (e: React.DragEvent) => {
   e.preventDefault();
   setIsDragging(false);
   const dropped = e.dataTransfer.files[0];
   if (dropped) handleFile(dropped);
  },
  [handleFile]
 );

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files?.[0];
  if (selected) handleFile(selected);
 };

 const handleReset = () => setFile(null);

 const handleImport = async () => {
  if (!file) return;
  setIsPending(true);
  try {
   await onUpload(file);
   setFile(null);
   setOpen(false);
  } finally {
   setIsPending(false);
  }
 };

 const downloadTemplate = () => {
  if (!templateUrl) return;
  const a = document.createElement("a");
  a.href = templateUrl;
  a.download = templateUrl.split("/").pop() ?? "template.csv";
  a.click();
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   <DialogTrigger asChild>
    <Button variant="outline">
     <Upload className="h-4 w-4" />
     Bulk Import
    </Button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-150">
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
     <DialogDescription>{description}</DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
     {!file ? (
      <>
       {templateUrl && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
         <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
           <p className="text-sm font-medium">Download Template</p>
           <p className="text-xs text-muted-foreground">Use our CSV template for correct formatting</p>
          </div>
         </div>
         <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download
         </Button>
        </div>
       )}

       <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
         "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
         isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
       >
        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-1">Drag and drop your CSV file here</p>
        <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
        <input
         type="file"
         accept=".csv"
         onChange={handleFileSelect}
         className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Button variant="outline" size="sm">Select File</Button>
       </div>
      </>
     ) : (
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
       <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
         <p className="font-medium">{file.name}</p>
         <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
       </div>
       <Button variant="ghost" size="icon-sm" onClick={handleReset} disabled={isPending}>
        <X className="h-4 w-4" />
       </Button>
      </div>
     )}

     <div className="flex justify-end gap-3 pt-2">
      <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
       Cancel
      </Button>
      <Button onClick={handleImport} disabled={!file} isLoading={isPending}>
       Import
      </Button>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
}
