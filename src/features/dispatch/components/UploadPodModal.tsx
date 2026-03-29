import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ModalProps } from "@/shared/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, FileText, PenLine, Upload, X } from "lucide-react"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const podSchema = z.object({
  type: z.enum(["photo", "signature", "document"], { required_error: "Document type is required" }),
  notes: z.string().optional(),
})

type PodFormData = z.infer<typeof podSchema>

const TYPE_ICONS = {
  photo: <Camera className="h-4 w-4" />,
  signature: <PenLine className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
}

type UploadPodModalProps = ModalProps

export default function UploadPodModal({ open, onOpenChange }: UploadPodModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<PodFormData>({
    resolver: zodResolver(podSchema),
    defaultValues: {
      type: undefined,
      notes: "",
    },
  })

  const handleFile = useCallback((selected: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(selected.type)) {
      toast.error("Only images (JPG, PNG, WebP) or PDF files are allowed")
      return
    }
    setFile(selected)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  const handleSubmit = (_data: PodFormData) => {
    onOpenChange(false)
    setFile(null)
    form.reset()
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setFile(null)
      form.reset()
    }
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Proof of Delivery
          </DialogTitle>
          <DialogDescription>
            Attach a photo, signature, or document as delivery proof.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="photo">
                        <span className="flex items-center gap-2">
                          <Camera className="h-4 w-4" /> Photo
                        </span>
                      </SelectItem>
                      <SelectItem value="signature">
                        <span className="flex items-center gap-2">
                          <PenLine className="h-4 w-4" /> Signature
                        </span>
                      </SelectItem>
                      <SelectItem value="document">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Document
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Drag and drop file here</p>
                <p className="text-xs text-muted-foreground mb-4">JPG, PNG, WebP or PDF</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Button type="button" variant="outline" size="sm">Select File</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {file.type.startsWith("image/")
                      ? <Camera className="h-5 w-5 text-primary" />
                      : <FileText className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-48">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Received by John at reception desk..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!file}>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
