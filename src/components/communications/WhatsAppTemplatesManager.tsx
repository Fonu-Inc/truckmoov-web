import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileText,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppTemplate {
  id: string;
  tenant_id: string;
  name: string;
  language: string;
  category: string | null;
  status: string;
  meta_template_id: string | null;
  body_text: string | null;
  header_type: string | null;
  header_content: string | null;
  footer_text: string | null;
  buttons: any;
  variables: any;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

interface WhatsAppTemplatesManagerProps {
  tenantId: string;
}

const CATEGORIES = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
];

export function WhatsAppTemplatesManager({ tenantId }: WhatsAppTemplatesManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    language: "en",
    category: "UTILITY",
    body_text: "",
    header_type: "",
    header_content: "",
    footer_text: "",
  });

  const fetchTemplates = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [tenantId]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      DRAFT: { color: "bg-muted text-muted-foreground", label: "Draft", icon: <Edit className="h-3 w-3" /> },
      SUBMITTED: { color: "bg-warning/20 text-warning", label: "Submitted", icon: <Clock className="h-3 w-3" /> },
      APPROVED: { color: "bg-success/20 text-success", label: "Approved", icon: <CheckCircle className="h-3 w-3" /> },
      REJECTED: { color: "bg-destructive/20 text-destructive", label: "Rejected", icon: <XCircle className="h-3 w-3" /> },
    };
    const { color, label, icon } = config[status] || config.DRAFT;
    return (
      <Badge className={`${color} gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const handleOpenDialog = (template?: WhatsAppTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        language: template.language,
        category: template.category || "UTILITY",
        body_text: template.body_text || "",
        header_type: template.header_type || "",
        header_content: template.header_content || "",
        footer_text: template.footer_text || "",
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        language: "en",
        category: "UTILITY",
        body_text: "",
        header_type: "",
        header_content: "",
        footer_text: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.body_text) {
      toast.error("Name and body text are required");
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        tenant_id: tenantId,
        name: formData.name,
        language: formData.language,
        category: formData.category,
        body_text: formData.body_text,
        header_type: formData.header_type || null,
        header_content: formData.header_content || null,
        footer_text: formData.footer_text || null,
        content_json: {
          body: formData.body_text,
          header: formData.header_content ? { type: formData.header_type, content: formData.header_content } : null,
          footer: formData.footer_text || null,
        },
        status: "DRAFT" as const,
        updated_at: new Date().toISOString(),
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("whatsapp_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
        toast.success("Template updated");
      } else {
        const { error } = await supabase.from("whatsapp_templates").insert([templateData]);
        if (error) throw error;
        toast.success("Template created");
      }

      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: WhatsAppTemplate) => {
    try {
      const { error } = await supabase.from("whatsapp_templates").delete().eq("id", template.id);
      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleDuplicate = async (template: WhatsAppTemplate) => {
    try {
      const { error } = await supabase.from("whatsapp_templates").insert([{
        tenant_id: tenantId,
        name: `${template.name}_copy`,
        language: template.language,
        category: template.category,
        body_text: template.body_text,
        header_type: template.header_type,
        header_content: template.header_content,
        footer_text: template.footer_text,
        content_json: { body: template.body_text },
        status: "DRAFT" as const,
      }]);
      if (error) throw error;
      toast.success("Template duplicated");
      fetchTemplates();
    } catch (error) {
      console.error("Failed to duplicate template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            WhatsApp Templates
          </h3>
          <p className="text-sm text-muted-foreground">Manage message templates for business-initiated conversations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
      </div>

      {/* Templates Table */}
      <Card className="bg-card/50 border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Template Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="border-border/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {template.body_text}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{template.language}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update your WhatsApp message template"
                : "Create a new WhatsApp message template for business-initiated conversations"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="job_notification"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                />
                <p className="text-xs text-muted-foreground">Lowercase, underscores only</p>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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

            <div className="space-y-2">
              <Label>Header (Optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={formData.header_type} onValueChange={(v) => setFormData({ ...formData, header_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-2"
                  placeholder="Header content"
                  value={formData.header_content}
                  onChange={(e) => setFormData({ ...formData, header_content: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Body Text *</Label>
              <Textarea
                placeholder="Hello {{1}}, your job {{2}} is ready for pickup at {{3}}."
                value={formData.body_text}
                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{1}}"}, {"{{2}}"}, etc. for variables
              </p>
            </div>

            <div className="space-y-2">
              <Label>Footer (Optional)</Label>
              <Input
                placeholder="Reply STOP to opt out"
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingTemplate ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WhatsAppTemplatesManager;
