import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Textarea } from "@/components/shadcn/textarea";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
  SlidersHorizontal as Filter,
} from "lucide-react";
import { ExportButton } from "@/components/shadcn/export-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { toast } from "sonner";

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
  const [templates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
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

  const DEMO_TEMPLATES: WhatsAppTemplate[] = [
    { id: "demo-1", tenant_id: tenantId, name: "job_offer_notification", language: "en", category: "UTILITY", status: "APPROVED", meta_template_id: "MT_001", body_text: "Hi {{1}}, you have a new job offer from {{2}} to {{3}}. Reply YES to accept.", header_type: "TEXT", header_content: "New Job Offer", footer_text: "FleetPro Dispatch", buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 12).toISOString(), updated_at: new Date(Date.now() - 86400000 * 2).toISOString(), last_synced_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "demo-2", tenant_id: tenantId, name: "delivery_confirmation", language: "en", category: "UTILITY", status: "APPROVED", meta_template_id: "MT_002", body_text: "Your delivery {{1}} has been confirmed. ETA: {{2}}.", header_type: null, header_content: null, footer_text: null, buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date(Date.now() - 86400000 * 5).toISOString(), last_synced_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "demo-3", tenant_id: tenantId, name: "monthly_promo_blast", language: "en_US", category: "MARKETING", status: "SUBMITTED", meta_template_id: null, body_text: "Save 15% on all premium routes this month. Use code FLEET15.", header_type: "IMAGE", header_content: "promo_banner.jpg", footer_text: "Offer ends Apr 30", buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 3).toISOString(), updated_at: new Date(Date.now() - 86400000 * 1).toISOString(), last_synced_at: null },
    { id: "demo-4", tenant_id: tenantId, name: "otp_verification", language: "en", category: "AUTHENTICATION", status: "APPROVED", meta_template_id: "MT_004", body_text: "Your verification code is {{1}}. Valid for 10 minutes.", header_type: null, header_content: null, footer_text: null, buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 45).toISOString(), updated_at: new Date(Date.now() - 86400000 * 30).toISOString(), last_synced_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "demo-5", tenant_id: tenantId, name: "trip_completed_summary", language: "en", category: "UTILITY", status: "APPROVED", meta_template_id: "MT_005", body_text: "Trip {{1}} completed. Distance: {{2}} km. Duration: {{3}}.", header_type: "TEXT", header_content: "Trip Summary", footer_text: null, buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 18).toISOString(), updated_at: new Date(Date.now() - 86400000 * 4).toISOString(), last_synced_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "demo-6", tenant_id: tenantId, name: "payment_reminder", language: "en", category: "UTILITY", status: "REJECTED", meta_template_id: null, body_text: "Reminder: Invoice {{1}} of {{2}} is overdue. Please settle promptly.", header_type: null, header_content: null, footer_text: null, buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 7).toISOString(), updated_at: new Date(Date.now() - 86400000 * 6).toISOString(), last_synced_at: null },
    { id: "demo-7", tenant_id: tenantId, name: "driver_shift_reminder", language: "en_GB", category: "UTILITY", status: "DRAFT", meta_template_id: null, body_text: "Your shift starts at {{1}}. Please report to {{2}}.", header_type: null, header_content: null, footer_text: null, buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 1).toISOString(), updated_at: new Date(Date.now() - 86400000 * 1).toISOString(), last_synced_at: null },
    { id: "demo-8", tenant_id: tenantId, name: "weekend_special_offer", language: "en_US", category: "MARKETING", status: "APPROVED", meta_template_id: "MT_008", body_text: "Book a weekend trip and get free fuel allowance up to ₦20,000.", header_type: "IMAGE", header_content: "weekend_offer.jpg", footer_text: "Limited time only", buttons: null, variables: null, created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date(Date.now() - 86400000 * 8).toISOString(), last_synced_at: new Date(Date.now() - 14400000).toISOString() },
  ];

  const useDemo = !isLoading && templates.length === 0;
  const displayTemplates = useDemo ? DEMO_TEMPLATES : templates;

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

    toast.info('Coming soon');
    return;
  };

  const handleDelete = async (template: WhatsAppTemplate) => {
    toast.info('Coming soon');
    return;
  };

  const handleDuplicate = async (template: WhatsAppTemplate) => {
    toast.info('Coming soon');
    return;
  };

  const filteredTemplates = displayTemplates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesLanguage = languageFilter === "all" || t.language === languageFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesLanguage;
  });

  const filterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (languageFilter !== "all" ? 1 : 0);

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
          <Button variant="outline" onClick={() => { toast.info('Coming soon'); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Templates
              {useDemo && (
                <Badge variant="outline" className="text-[10px]">Demo data</Badge>
              )}
            </CardTitle>
            <ExportButton
              filename="whatsapp-templates"
              rows={filteredTemplates}
              columns={[
                { header: "Name", accessor: (t) => t.name },
                { header: "Category", accessor: (t) => t.category || "" },
                { header: "Language", accessor: (t) => t.language },
                { header: "Status", accessor: (t) => t.status },
                { header: "Updated", accessor: (t) => new Date(t.updated_at).toLocaleDateString() },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card/50 border-border/50"
                >
                  <Filter className="h-4 w-4 mr-2" /> Filter
                  {filterCount > 0 && (
                    <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground">{filterCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto" align="end">
                <h4 className="text-xs font-medium text-foreground px-0.5">
                  Only show templates by...
                </h4>
                <div className="space-y-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="tmpl-flt-category"
                        checked={categoryFilter !== "all"}
                        onCheckedChange={(c) => setCategoryFilter(c === true ? (categoryFilter !== "all" ? categoryFilter : CATEGORIES[0]?.value ?? "all") : "all")}
                      />
                      <Label htmlFor="tmpl-flt-category" className="text-sm cursor-pointer">Category</Label>
                    </div>
                    <Select
                      value={categoryFilter === "all" ? "" : categoryFilter}
                      onValueChange={(v) => setCategoryFilter(v || "all")}
                      disabled={categoryFilter === "all"}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Language */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="tmpl-flt-language"
                        checked={languageFilter !== "all"}
                        onCheckedChange={(c) => setLanguageFilter(c === true ? (languageFilter !== "all" ? languageFilter : LANGUAGES[0]?.value ?? "all") : "all")}
                      />
                      <Label htmlFor="tmpl-flt-language" className="text-sm cursor-pointer">Language</Label>
                    </div>
                    <Select
                      value={languageFilter === "all" ? "" : languageFilter}
                      onValueChange={(v) => setLanguageFilter(v || "all")}
                      disabled={languageFilter === "all"}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select language" /></SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button className="flex-1">Apply</Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setCategoryFilter("all");
                      setLanguageFilter("all");
                    }}
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
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
