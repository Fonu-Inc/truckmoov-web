import { formatDate } from "@truckmoov/app-core/utils/time-utils";
import {
  Copy,
  Eye,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Textarea } from "@/components/shadcn/textarea";

type SMSTemplate = {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = [
  {
    value: "job", label: "Job Notifications",
  },
  {
    value: "delivery", label: "Delivery Updates",
  },
  {
    value: "safety", label: "Safety Alerts",
  },
  {
    value: "payment", label: "Payment Notifications",
  },
  {
    value: "general", label: "General",
  },
];

const categoryColors: Record<string, string> = {
  job: "bg-primary/20 text-primary border-primary/30",
  delivery: "bg-success/20 text-success border-success/30",
  safety: "bg-destructive/20 text-destructive border-destructive/30",
  payment: "bg-warning/20 text-warning border-warning/30",
  general: "bg-muted text-muted-foreground border-muted",
};

type FormData = {
  name: string;
  category: string;
  content: string;
};

const emptyForm: FormData = {
  name: "",
  category: "general",
  content: "",
};

const DUMMY_TEMPLATES: SMSTemplate[] = [
  {
    id: "dummy-1",
    tenant_id: "demo",
    name: "Job Assignment",
    category: "job",
    content: "Hi {{driver_name}}, you've been assigned job {{job_id}}. Pickup: {{pickup_location}}. ETA: {{eta}}.",
    variables: [
      "driver_name",
      "job_id",
      "pickup_location",
      "eta",
    ],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dummy-2",
    tenant_id: "demo",
    name: "Delivery Confirmation",
    category: "delivery",
    content: "Delivery for job {{job_id}} confirmed at {{delivery_location}}. Thank you {{driver_name}}!",
    variables: [
      "job_id",
      "delivery_location",
      "driver_name",
    ],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dummy-3",
    tenant_id: "demo",
    name: "Speed Alert",
    category: "safety",
    content: "Safety alert: {{driver_name}}, you exceeded the speed limit. Please slow down for your safety.",
    variables: ["driver_name"],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dummy-4",
    tenant_id: "demo",
    name: "Payment Released",
    category: "payment",
    content: "Hi {{driver_name}}, payment of ₦{{amount}} for job {{job_id}} has been released to your wallet.",
    variables: [
      "driver_name",
      "amount",
      "job_id",
    ],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dummy-5",
    tenant_id: "demo",
    name: "Pickup Reminder",
    category: "job",
    content: "Reminder: pickup for job {{job_id}} at {{pickup_location}} is scheduled. ETA: {{eta}}.",
    variables: [
      "job_id",
      "pickup_location",
      "eta",
    ],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dummy-6",
    tenant_id: "demo",
    name: "General Broadcast",
    category: "general",
    content: "Hello {{driver_name}}, please check the app for important fleet updates.",
    variables: ["driver_name"],
    is_active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function SMSTemplatesManager() {
  const dbTemplates: SMSTemplate[] = [];
  const isLoading = false;
  const isSaving = false;
  const createTemplate = async (_name: string, _category: string, _content: string): Promise<boolean> => false;
  const updateTemplate = async (_id: string, _name: string, _category: string, _content: string): Promise<boolean> => false;
  const deleteTemplate = (_id: string): void => {};
  const duplicateTemplate = (_template: SMSTemplate): void => {};
  const templates = dbTemplates.length > 0 ? dbTemplates : DUMMY_TEMPLATES;
  const [
    isDialogOpen,
    setIsDialogOpen,
  ] = useState(false);
  const [
    isPreviewOpen,
    setIsPreviewOpen,
  ] = useState(false);
  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState<SMSTemplate | null>(null);
  const [
    formData,
    setFormData,
  ] = useState<FormData>(emptyForm);
  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");
  const [activeFilter] = useState<string>("all");
  const [_draftCategory] = useState("all");
  const [_draftActive] = useState<string>("all");
  const [_enableCategoryFilter] = useState(false);
  const [_enableActiveFilter] = useState(false);

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
        formData.content,
      );
    }
    else {
      success = await createTemplate(
        formData.name,
        formData.category,
        formData.content,
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

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesSearch
      = !searchQuery
        || t.name.toLowerCase().includes(searchQuery.toLowerCase())
        || t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive
      = activeFilter === "all"
        || (activeFilter === "active" ? t.is_active : !t.is_active);
    return matchesCategory && matchesSearch && matchesActive;
  });

  const getCharCount = (text: string) => text?.length || 0;
  const getSMSCount = (text: string) => Math.ceil((text?.length || 0) / 160);

  // Extract variables from content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(v => v.replace(
      /\{\{|\}\}/g,
      "",
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array.from({ length: 3 })].map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* All Templates Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                All Templates
              </CardTitle>
              <CardDescription className="mt-1">Reusable SMS and WhatsApp templates — manage approval status, variables, and category tags.</CardDescription>
            </div>
            <ExportButton
              filename="sms-templates"
              rows={filteredTemplates}
              columns={[
                {
                  header: "Name", accessor: t => t.name,
                },
                {
                  header: "Category", accessor: t => t.category,
                },
                {
                  header: "Content", accessor: t => t.content,
                },
                {
                  header: "Updated", accessor: t => formatDate(t.updated_at),
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                    Try adjusting your search or filters, or create a new template.
                  </p>
                  <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )
            : (
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
                                {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                              </Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
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
                              {variables.slice(
                                0,
                                3,
                              ).map(v => (
                                <Badge
                                  key={v}
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
                              {variables.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  +
                                  {variables.length - 3}
                                  {" "}
                                  more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">
                              {getCharCount(template.content)}
                              {" "}
                              chars /
                              {getSMSCount(template.content)}
                              {" "}
                              SMS
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPreview(template)}
                            >
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
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
                  onChange={e => setFormData({
                    ...formData, name: e.target.value,
                  })}
                  placeholder="e.g., Job Assignment"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData({
                    ...formData, category: value,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                      >
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
                  {getCharCount(formData.content)}
                  {" "}
                  chars /
                  {getSMSCount(formData.content)}
                  {" "}
                  SMS
                </div>
              </div>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({
                  ...formData, content: e.target.value,
                })}
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
                  ].map(v => (
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
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.content}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      >
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
                  {extractVariables(selectedTemplate.content).map(v => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false);
              if (selectedTemplate)
                handleOpenEdit(selectedTemplate);
            }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
