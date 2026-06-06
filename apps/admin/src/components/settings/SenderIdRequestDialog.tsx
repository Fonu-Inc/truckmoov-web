import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/shadcn/select";
import {Upload, FileText, X, Loader2, Download} from "lucide-react";
import { useTenantSenderIds, type SenderIdType } from "@/hooks/useTenantSenderIds";
import { useAuthStore } from "@/stores/authStore";
import { generateSenderIdRequestLetter } from "@/utils/senderIdTemplateGenerator";
import { toast } from "sonner";

interface SenderIdRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SenderIdRequestDialog({ open, onOpenChange }: SenderIdRequestDialogProps) {
  const { user } = useAuthStore();
  const { requestSenderId } = useTenantSenderIds();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [formData, setFormData] = useState({
    sender_id: "",
    sender_type: "sms" as SenderIdType,
    request_notes: "" });

  const handleDownloadTemplate = async () => {
    try {
      await generateSenderIdRequestLetter({
        senderId: formData.sender_id || undefined,
        senderType: formData.sender_type === 'both' ? 'SMS & Voice' : formData.sender_type.toUpperCase() });
      toast.success("Template downloaded - edit the highlighted fields and upload");
    } catch (error) {
      toast.error("Failed to generate template");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    toast.info('Coming soon');
    return;
  };

  const handleRemoveFile = async () => {
    if (!uploadedFile) return;
    toast.info('Coming soon');
    return;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sender_id.trim()) {
      toast.error("Please enter a sender ID");
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload your request letter");
      return;
    }

    toast.info('Coming soon');
    return;
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({ sender_id: "", sender_type: "sms", request_notes: "" });
    setUploadedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Sender ID</DialogTitle>
          <DialogDescription>
            Submit a sender ID for approval. Download the template letter, edit it with your company details, then upload the signed version.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender_id">Sender ID</Label>
              <Input
                id="sender_id"
                placeholder="e.g., MYCOMPANY"
                value={formData.sender_id}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_id: e.target.value }))}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Max 11 alphanumeric characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_type">Type</Label>
              <Select
                value={formData.sender_type}
                onValueChange={(value: SenderIdType) => setFormData(prev => ({ ...prev, sender_type: value }))}
              >
                <SelectTrigger id="sender_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS Only</SelectItem>
                  <SelectItem value="voice">Voice Only</SelectItem>
                  <SelectItem value="both">SMS & Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Request Letter Upload Section */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Request Letter</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Download the template, fill in your company details (highlighted in yellow), print on company letterhead, sign, scan, and upload.
            </p>

            {!uploadedFile ? (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Signed Request Letter
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  PDF or Word document, max 5MB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {uploadedFile.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_notes">Additional Notes (optional)</Label>
            <Textarea
              id="request_notes"
              placeholder="Any additional context for the administrator..."
              value={formData.request_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, request_notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.sender_id.trim() || !uploadedFile}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


