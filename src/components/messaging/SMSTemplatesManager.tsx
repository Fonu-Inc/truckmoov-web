import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Copy,
  MoreHorizontal,
  Send,
  Eye,
  Loader2,
} from "lucide-react";
import { useSMSTemplates, SMSTemplate } from "@/hooks/useSMSTemplates";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "job", label: "Job Notifications" },
  { value: "delivery", label: "Delivery Updates" },
  { value: "safety", label: "Safety Alerts" },
  { value: "payment", label: "Payment Notifications" },
  { value: "general", label: "General" },
];

const categoryColors: Record<string, string> = {
  job: "bg-primary/20 text-primary border-primary/30",
  delivery: "bg-success/20 text-success border-success/30",
  safety: "bg-destructive/20 text-destructive border-destructive/30",
  payment: "bg-warning/20 text-warning border-warning/30",
  general: "bg-muted text-muted-foreground border-muted",
};

interface FormData {
  name: string;
  category: string;
  content: string;
}

const emptyForm: FormData = {
  name: "",
  category: "general",
  content: "",
};

export function SMSTemplatesManager() {
  const { templates, isLoading, isSaving, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useSMSTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setIsDialogOpen(true);
  };

  const handleOpenPreview = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      return;
    }

    let success: boolean;
    if (selectedTemplate) {
      success = await updateTemplate(
        selectedTemplate.id,
        formData.name,
        formData.category,
        formData.content
      );
    } else {
      success = await createTemplate(
        formData.name,
        formData.category,
        formData.content
      );
    }

    if (success) {
      setIsDialogOpen(false);
      setFormData(emptyForm);
    }
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
  };

  const handleDuplicate = (template: SMSTemplate) => {
    duplicateTemplate(template);
  };

  const filteredTemplates =
    categoryFilter === "all"
      ? templates
      : templates.filter((t) => t.category === categoryFilter);

  const getCharCount = (text: string) => text?.length || 0;
  const getSMSCount = (text: string) => Math.ceil((text?.length || 0) / 160);

  // Extract variables from content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map((v) => v.replace(/\{\{|\}\}/g, ""));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {templates.length} Templates
          </Badge>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
              Create SMS templates for driver communications
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const variables = extractVariables(template.content);
            return (
              <Card
                key={template.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-base">{template.name}</h4>
                      <Badge className={`mt-2 ${categoryColors[template.category] || categoryColors.general}`}>
                        {CATEGORIES.find((c) => c.value === template.category)?.label || template.category}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenPreview(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.content}
                  </p>
                  
                  {variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {variables.slice(0, 3).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                      {variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{variables.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {getCharCount(template.content)} chars / {getSMSCount(template.content)} SMS
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleOpenPreview(template)}>
                      <Send className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create SMS Template"}
            </DialogTitle>
            <DialogDescription>
              Create reusable SMS templates for driver communications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Job Assignment"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message Content</Label>
                <div className="text-xs text-muted-foreground">
                  {getCharCount(formData.content)} chars / {getSMSCount(formData.content)} SMS
                </div>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter SMS message..."
                rows={4}
              />
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Available Variables</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Click to insert. Variables will be replaced with actual values.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "driver_name",
                    "job_id",
                    "pickup_location",
                    "delivery_location",
                    "amount",
                    "eta",
                  ].map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="font-mono cursor-pointer hover:bg-primary/10"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          content: `${formData.content}{{${v}}}`,
                        });
                      }}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name || !formData.content}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>Preview SMS template</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedTemplate?.content}</p>
              </CardContent>
            </Card>

            {selectedTemplate && extractVariables(selectedTemplate.content).length > 0 && (
              <div>
                <Label className="text-sm">Variables used:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {extractVariables(selectedTemplate.content).map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              if (selectedTemplate) handleOpenEdit(selectedTemplate);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
