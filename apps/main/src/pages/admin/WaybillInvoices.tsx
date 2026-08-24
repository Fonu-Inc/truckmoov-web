import {
  formatWithPattern, toDateParam,
} from "@truckmoov/app-core/utils/time-utils";
import {
  AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock, DollarSign, Download, Eye, FileText, ImageIcon, Loader2, Mail, MapPin, MessageSquare, MoreHorizontal, Package, Pencil, Plus, Receipt, Save, Scan, Search, Send, Settings2, Share2, SlidersHorizontal, ToggleLeft, ToggleRight, Trash2, Truck, Upload, User, XCircle,
} from "lucide-react";
import React, {
  useCallback, useEffect, useRef, useState,
} from "react";
import { toast } from "sonner";
import { SendInvoiceEmailDialog } from "@/components/invoices/SendInvoiceEmailDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { ExportButton } from "@/components/shadcn/export-button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/shadcn/select";
import { Separator } from "@/components/shadcn/separator";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/shadcn/sheet";
import { Switch } from "@/components/shadcn/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/shadcn/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { useCurrency } from "@/contexts/CurrencyContext";

type WaybillRecord = any;
type WaybillInvoice = any;
type PricingRule = any;
type InvoiceConfig = {
  tax_enabled: boolean; tax_rate_percent: number; tax_label: string; invoice_prefix: string; company_name?: string; company_address?: string; company_phone?: string; company_email?: string; bank_name?: string; bank_account_name?: string; bank_account_number?: string; payment_terms_days: number; notes_template?: string; auto_send_enabled?: boolean;
} & Record<string, any>;
function useWaybillInvoice() {
  return {
    waybills: [] as WaybillRecord[],
    invoices: [] as WaybillInvoice[],
    pricingRules: [] as PricingRule[],
    invoiceConfig: null as InvoiceConfig | null,
    isLoading: false,
    fetchWaybills: async () => {},
    fetchInvoices: async () => {},
    fetchPricingRules: async () => {},
    fetchInvoiceConfig: async () => {},
    createWaybill: async (..._args: any[]): Promise<any> => null,
    extractWaybill: async (..._args: any[]) => {},
    updateWaybillFields: async (..._args: any[]): Promise<any> => null,
    generateInvoice: async (..._args: any[]): Promise<any> => null,
    updateInvoice: (..._args: any[]) => {},
    deleteInvoice: async (..._args: any[]) => {},
    addPricingRule: (..._args: any[]) => {},
    updatePricingRule: (..._args: any[]) => {},
    deletePricingRule: (..._args: any[]) => {},
    updateInvoiceConfig: (..._args: any[]) => {},
    recordInvoiceShare: (..._args: any[]) => {},
    generateInvoicePDF: async (..._args: any[]): Promise<any> => null,
    getInvoicePdfUrl: async (..._args: any[]): Promise<string | null> => null,
  };
}
function useWaybillRealtimeEvents(_opts: any) {}

const statusConfig: Record<string, {
  label: string; color: string; icon: React.ElementType;
}> = {
  received: {
    label: "Received", color: "bg-info/10 text-info border-info/20", icon: Clock,
  },
  processing: {
    label: "Processing", color: "bg-warning/10 text-warning border-warning/20", icon: Loader2,
  },
  extracted: {
    label: "Extracted", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2,
  },
  extraction_failed: {
    label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle,
  },
  needs_review: {
    label: "Needs Review", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle,
  },
  approved: {
    label: "Approved", color: "bg-info/10 text-info border-info/20", icon: CheckCircle2,
  },
  invoice_generated: {
    label: "Invoiced", color: "bg-primary/10 text-primary border-primary/20", icon: Receipt,
  },
  invoiced: {
    label: "Invoiced", color: "bg-primary/10 text-primary border-primary/20", icon: Receipt,
  },
  rejected: {
    label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle,
  },
  archived: {
    label: "Archived", color: "bg-muted text-muted-foreground border-muted", icon: FileText,
  },
};

const invoiceStatusConfig: Record<string, {
  label: string; color: string;
}> = {
  draft: {
    label: "Draft", color: "bg-muted text-muted-foreground border-muted",
  },
  pending_review: {
    label: "Pending Review", color: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    label: "Approved", color: "bg-info/10 text-info border-info/20",
  },
  sent: {
    label: "Sent", color: "bg-primary/10 text-primary border-primary/20",
  },
  paid: {
    label: "Paid", color: "bg-success/10 text-success border-success/20",
  },
  partially_paid: {
    label: "Partially Paid", color: "bg-warning/10 text-warning border-warning/20",
  },
  overdue: {
    label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Cancelled", color: "bg-muted text-muted-foreground border-muted",
  },
  disputed: {
    label: "Disputed", color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const DEMO_WAYBILLS: WaybillRecord[] = [
  {
    id: "demo-w-1", tenant_id: "demo", org_id: null, status: "invoice_generated", source_type: "whatsapp", source_message_id: null, source_phone: "+2348012345678", driver_name: "Adebayo Okafor", image_url: null, image_storage_path: null, extracted_data: null, destination: "Abuja", origin: "Lagos", vehicle_number: "LAG-234-XR", waybill_number: "WB-20284", customer_name: "Dangote Cement", waybill_date: "2026-04-22", quantity: 30, quantity_unit: "tons", weight_kg: 30000, weight_tons: 30, matched_pricing_rule_id: null, calculated_price_ngn: 850000, ai_confidence_score: 0.96, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-22T08:14:00Z", updated_at: "2026-04-22T08:20:00Z",
  },
  {
    id: "demo-w-2", tenant_id: "demo", org_id: null, status: "extracted", source_type: "upload", source_message_id: null, source_phone: null, driver_name: "Chinedu Eze", image_url: null, image_storage_path: null, extracted_data: null, destination: "Port Harcourt", origin: "Lagos", vehicle_number: "LAG-901-KN", waybill_number: "WB-20285", customer_name: "Nigerian Breweries", waybill_date: "2026-04-23", quantity: 18, quantity_unit: "pallets", weight_kg: 12000, weight_tons: 12, matched_pricing_rule_id: null, calculated_price_ngn: 620000, ai_confidence_score: 0.93, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-23T10:02:00Z", updated_at: "2026-04-23T10:08:00Z",
  },
  {
    id: "demo-w-3", tenant_id: "demo", org_id: null, status: "needs_review", source_type: "whatsapp", source_message_id: null, source_phone: "+2348023456789", driver_name: "Ibrahim Musa", image_url: null, image_storage_path: null, extracted_data: null, destination: "Kano", origin: "Kaduna", vehicle_number: "KAD-455-ZT", waybill_number: "WB-20286", customer_name: "BUA Foods", waybill_date: "2026-04-23", quantity: 24, quantity_unit: "tons", weight_kg: 24000, weight_tons: 24, matched_pricing_rule_id: null, calculated_price_ngn: 410000, ai_confidence_score: 0.71, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-23T13:35:00Z", updated_at: "2026-04-23T13:40:00Z",
  },
  {
    id: "demo-w-4", tenant_id: "demo", org_id: null, status: "received", source_type: "whatsapp", source_message_id: null, source_phone: "+2348034567890", driver_name: "Olumide Bello", image_url: null, image_storage_path: null, extracted_data: null, destination: null, origin: null, vehicle_number: null, waybill_number: null, customer_name: null, waybill_date: null, quantity: null, quantity_unit: null, weight_kg: null, weight_tons: null, matched_pricing_rule_id: null, calculated_price_ngn: null, ai_confidence_score: null, ai_model_used: null, confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T07:48:00Z", updated_at: "2026-04-24T07:48:00Z",
  },
  {
    id: "demo-w-5", tenant_id: "demo", org_id: null, status: "extracted", source_type: "whatsapp", source_message_id: null, source_phone: "+2348045678901", driver_name: "Tunde Akinwale", image_url: null, image_storage_path: null, extracted_data: null, destination: "Onitsha", origin: "Lagos", vehicle_number: "LAG-712-MV", waybill_number: "WB-20287", customer_name: "Flour Mills of Nigeria", waybill_date: "2026-04-24", quantity: 40, quantity_unit: "tons", weight_kg: 40000, weight_tons: 40, matched_pricing_rule_id: null, calculated_price_ngn: 720000, ai_confidence_score: 0.94, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T09:22:00Z", updated_at: "2026-04-24T09:30:00Z",
  },
  {
    id: "demo-w-6", tenant_id: "demo", org_id: null, status: "extraction_failed", source_type: "upload", source_message_id: null, source_phone: null, driver_name: "Femi Adeyemi", image_url: null, image_storage_path: null, extracted_data: null, destination: null, origin: null, vehicle_number: null, waybill_number: null, customer_name: null, waybill_date: null, quantity: null, quantity_unit: null, weight_kg: null, weight_tons: null, matched_pricing_rule_id: null, calculated_price_ngn: null, ai_confidence_score: null, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: "Image too blurry", processed_at: null, processed_by: null, created_at: "2026-04-24T11:05:00Z", updated_at: "2026-04-24T11:06:00Z",
  },
  {
    id: "demo-w-7", tenant_id: "demo", org_id: null, status: "invoice_generated", source_type: "whatsapp", source_message_id: null, source_phone: "+2348056789012", driver_name: "Yusuf Garba", image_url: null, image_storage_path: null, extracted_data: null, destination: "Ibadan", origin: "Lagos", vehicle_number: "OYO-118-CL", waybill_number: "WB-20288", customer_name: "Cadbury Nigeria", waybill_date: "2026-04-21", quantity: 22, quantity_unit: "tons", weight_kg: 22000, weight_tons: 22, matched_pricing_rule_id: null, calculated_price_ngn: 320000, ai_confidence_score: 0.97, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-21T14:55:00Z", updated_at: "2026-04-21T15:02:00Z",
  },
  {
    id: "demo-w-8", tenant_id: "demo", org_id: null, status: "approved", source_type: "whatsapp", source_message_id: null, source_phone: "+2348067890123", driver_name: "Kunle Adesola", image_url: null, image_storage_path: null, extracted_data: null, destination: "Enugu", origin: "Lagos", vehicle_number: "LAG-553-WP", waybill_number: "WB-20289", customer_name: "Innoson Motors", waybill_date: "2026-04-24", quantity: 15, quantity_unit: "tons", weight_kg: 15000, weight_tons: 15, matched_pricing_rule_id: null, calculated_price_ngn: 580000, ai_confidence_score: 0.95, ai_model_used: "gemini-2.5-pro", confidence_per_field: null, extraction_error: null, processed_at: null, processed_by: null, created_at: "2026-04-24T16:18:00Z", updated_at: "2026-04-24T16:25:00Z",
  },
];

const DEMO_INVOICES: WaybillInvoice[] = [
  {
    id: "demo-i-1", tenant_id: "demo", org_id: null, invoice_number: "INV-20284", waybill_id: "demo-w-1", status: "paid", customer_name: "Dangote Cement", customer_phone: "+2348011112222", customer_email: "accounts@dangote.com", customer_address: "Marina, Lagos", line_items: [], subtotal_ngn: 850000, tax_rate_percent: 7.5, tax_amount_ngn: 63750, discount_ngn: 0, total_ngn: 913750, amount_paid_ngn: 913750, invoice_date: "2026-04-22", due_date: "2026-05-22", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Abuja", vehicle_number: "LAG-234-XR", waybill_number: "WB-20284", waybill_date: "2026-04-22", quantity: 30, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-04-22T11:00:00Z", sent_to: "accounts@dangote.com", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-22T10:50:00Z", created_at: "2026-04-22T10:30:00Z", updated_at: "2026-04-22T10:50:00Z",
  },
  {
    id: "demo-i-2", tenant_id: "demo", org_id: null, invoice_number: "INV-20288", waybill_id: "demo-w-7", status: "sent", customer_name: "Cadbury Nigeria", customer_phone: "+2348022223333", customer_email: "finance@cadbury.ng", customer_address: "Lateef Jakande Rd, Ikeja", line_items: [], subtotal_ngn: 320000, tax_rate_percent: 7.5, tax_amount_ngn: 24000, discount_ngn: 0, total_ngn: 344000, amount_paid_ngn: 0, invoice_date: "2026-04-21", due_date: "2026-05-21", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Ibadan", vehicle_number: "OYO-118-CL", waybill_number: "WB-20288", waybill_date: "2026-04-21", quantity: 22, quantity_unit: "tons", sent_via: "WHATSAPP", sent_at: "2026-04-21T16:10:00Z", sent_to: "+2348022223333", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-21T15:30:00Z", created_at: "2026-04-21T15:15:00Z", updated_at: "2026-04-21T16:10:00Z",
  },
  {
    id: "demo-i-3", tenant_id: "demo", org_id: null, invoice_number: "INV-20278", waybill_id: "demo-w-x", status: "overdue", customer_name: "Honeywell Flour", customer_phone: "+2348033334444", customer_email: "pay@honeywell.ng", customer_address: "Apapa, Lagos", line_items: [], subtotal_ngn: 1250000, tax_rate_percent: 7.5, tax_amount_ngn: 93750, discount_ngn: 0, total_ngn: 1343750, amount_paid_ngn: 0, invoice_date: "2026-03-12", due_date: "2026-04-11", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Maiduguri", vehicle_number: "LAG-882-RY", waybill_number: "WB-20278", waybill_date: "2026-03-12", quantity: 35, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-03-12T17:00:00Z", sent_to: "pay@honeywell.ng", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-03-12T16:30:00Z", updated_at: "2026-04-11T00:00:00Z",
  },
  {
    id: "demo-i-4", tenant_id: "demo", org_id: null, invoice_number: "INV-20281", waybill_id: "demo-w-y", status: "partially_paid", customer_name: "Nestlé Nigeria", customer_phone: "+2348044445555", customer_email: "ap@nestle.ng", customer_address: "Ilupeju, Lagos", line_items: [], subtotal_ngn: 980000, tax_rate_percent: 7.5, tax_amount_ngn: 73500, discount_ngn: 20000, total_ngn: 1033500, amount_paid_ngn: 500000, invoice_date: "2026-04-05", due_date: "2026-05-05", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Calabar", vehicle_number: "LAG-664-TM", waybill_number: "WB-20281", waybill_date: "2026-04-05", quantity: 28, quantity_unit: "tons", sent_via: "EMAIL", sent_at: "2026-04-05T12:00:00Z", sent_to: "ap@nestle.ng", pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-04-05T11:30:00Z", updated_at: "2026-04-15T09:00:00Z",
  },
  {
    id: "demo-i-5", tenant_id: "demo", org_id: null, invoice_number: "INV-20283", waybill_id: "demo-w-z", status: "approved", customer_name: "Lafarge Africa", customer_phone: "+2348055556666", customer_email: "invoices@lafarge.ng", customer_address: "Ewekoro, Ogun", line_items: [], subtotal_ngn: 740000, tax_rate_percent: 7.5, tax_amount_ngn: 55500, discount_ngn: 0, total_ngn: 795500, amount_paid_ngn: 0, invoice_date: "2026-04-20", due_date: "2026-05-20", payment_terms: "NET 30", notes: null, origin: "Ewekoro", destination: "Sokoto", vehicle_number: "OGN-220-FH", waybill_number: "WB-20283", waybill_date: "2026-04-20", quantity: 25, quantity_unit: "tons", sent_via: null, sent_at: null, sent_to: null, pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: "2026-04-20T14:00:00Z", created_at: "2026-04-20T13:40:00Z", updated_at: "2026-04-20T14:00:00Z",
  },
  {
    id: "demo-i-6", tenant_id: "demo", org_id: null, invoice_number: "INV-20285", waybill_id: "demo-w-2", status: "draft", customer_name: "Nigerian Breweries", customer_phone: "+2348066667777", customer_email: "finance@nb.ng", customer_address: "Iganmu, Lagos", line_items: [], subtotal_ngn: 620000, tax_rate_percent: 7.5, tax_amount_ngn: 46500, discount_ngn: 0, total_ngn: 666500, amount_paid_ngn: 0, invoice_date: "2026-04-23", due_date: "2026-05-23", payment_terms: "NET 30", notes: null, origin: "Lagos", destination: "Port Harcourt", vehicle_number: "LAG-901-KN", waybill_number: "WB-20285", waybill_date: "2026-04-23", quantity: 18, quantity_unit: "pallets", sent_via: null, sent_at: null, sent_to: null, pdf_storage_path: null, pdf_url: null, created_by: null, approved_by: null, approved_at: null, created_at: "2026-04-23T10:30:00Z", updated_at: "2026-04-23T10:30:00Z",
  },
];

const DEMO_PRICING_RULES: PricingRule[] = [
  {
    id: "demo-p-1", tenant_id: "demo", org_id: null, rule_name: "Lagos → Abuja • Cement", origin: "Lagos", destination: "Abuja", vehicle_type: "30-ton trailer", price_ngn: 850000, price_per_unit_ngn: 28333, unit_type: "ton", customer_name: "Dangote Cement", effective_from: "2026-01-01", effective_to: null, is_active: true, notes: "Long-term framework agreement", destination_aliases: [
      "FCT",
      "Abuja Central",
    ], pricing_mode: "FLAT", currency: "NGN", minimum_charge: 800000, created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "demo-p-2", tenant_id: "demo", org_id: null, rule_name: "Lagos → Port Harcourt • Beverages", origin: "Lagos", destination: "Port Harcourt", vehicle_type: "20-ton truck", price_ngn: 620000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2026-02-15", effective_to: null, is_active: true, notes: null, destination_aliases: [
      "PH",
      "Rivers",
    ], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "demo-p-3", tenant_id: "demo", org_id: null, rule_name: "Kaduna → Kano • Per-Ton", origin: "Kaduna", destination: "Kano", vehicle_type: "Flatbed", price_ngn: 17000, price_per_unit_ngn: 17000, unit_type: "ton", customer_name: null, effective_from: "2026-03-01", effective_to: null, is_active: true, notes: "Charged per ton above minimum", destination_aliases: [], pricing_mode: "PER_WEIGHT", currency: "NGN", minimum_charge: 380000, created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "demo-p-4", tenant_id: "demo", org_id: null, rule_name: "Lagos → Onitsha • Flour Mills", origin: "Lagos", destination: "Onitsha", vehicle_type: "40-ton trailer", price_ngn: 720000, price_per_unit_ngn: null, unit_type: null, customer_name: "Flour Mills of Nigeria", effective_from: "2026-01-10", effective_to: "2026-12-31", is_active: true, notes: null, destination_aliases: ["Anambra"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "demo-p-5", tenant_id: "demo", org_id: null, rule_name: "Lagos → Ibadan • Express", origin: "Lagos", destination: "Ibadan", vehicle_type: "Box truck", price_ngn: 320000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2025-11-01", effective_to: null, is_active: true, notes: "Same-day delivery rate", destination_aliases: ["Oyo"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, created_at: "2025-11-01T00:00:00Z",
  },
  {
    id: "demo-p-6", tenant_id: "demo", org_id: null, rule_name: "Lagos → Maiduguri • Long Haul", origin: "Lagos", destination: "Maiduguri", vehicle_type: "40-ton trailer", price_ngn: 1450000, price_per_unit_ngn: null, unit_type: null, customer_name: null, effective_from: "2026-02-01", effective_to: null, is_active: false, notes: "Suspended pending security review", destination_aliases: ["Borno"], pricing_mode: "FLAT", currency: "NGN", minimum_charge: 1200000, created_at: "2026-02-01T00:00:00Z",
  },
];

export default function WaybillInvoices() {
  const {
    waybills, invoices, pricingRules, invoiceConfig,
    fetchWaybills, fetchInvoices, fetchPricingRules,
    fetchInvoiceConfig, createWaybill, extractWaybill, updateWaybillFields,
    generateInvoice, updateInvoice, deleteInvoice, addPricingRule, updatePricingRule,
    deletePricingRule, updateInvoiceConfig, recordInvoiceShare, generateInvoicePDF, getInvoicePdfUrl,
  } = useWaybillInvoice();
  const { format: formatAmount } = useCurrency();
  const canDeleteAssets = true;
  const [
    invoiceToDelete,
    setInvoiceToDelete,
  ] = useState<WaybillInvoice | null>(null);

  const displayWaybills = waybills.length > 0 ? waybills : DEMO_WAYBILLS;
  const displayInvoices = invoices.length > 0 ? invoices : DEMO_INVOICES;
  const displayPricingRules = pricingRules.length > 0 ? pricingRules : DEMO_PRICING_RULES;

  const [
    activeTab,
    setActiveTab,
  ] = useState("waybills");
  const [
    selectedWaybill,
    setSelectedWaybill,
  ] = useState<WaybillRecord | null>(null);
  const [
    selectedInvoice,
    setSelectedInvoice,
  ] = useState<WaybillInvoice | null>(null);
  const [
    showUploadDialog,
    setShowUploadDialog,
  ] = useState(false);
  const [
    showPricingDialog,
    setShowPricingDialog,
  ] = useState(false);
  const [
    extracting,
    setExtracting,
  ] = useState<string | null>(null);
  const [
    generating,
    setGenerating,
  ] = useState<string | null>(null);
  const [
    waybillSearch,
    setWaybillSearch,
  ] = useState("");
  const [
    waybillStatus,
    setWaybillStatus,
  ] = useState("all");
  const [
    invoiceSearch,
    setInvoiceSearch,
  ] = useState("");
  const [
    invoiceStatus,
    setInvoiceStatus,
  ] = useState("all");

  const [
    wbDateEnabled,
    setWbDateEnabled,
  ] = useState(false);
  const [
    wbDateFrom,
    setWbDateFrom,
  ] = useState("");
  const [
    wbDateTo,
    setWbDateTo,
  ] = useState("");
  const [
    wbPriceEnabled,
    setWbPriceEnabled,
  ] = useState(false);
  const [
    wbPriceMin,
    setWbPriceMin,
  ] = useState("");
  const [
    wbPriceMax,
    setWbPriceMax,
  ] = useState("");
  const [
    wbVehicleEnabled,
    setWbVehicleEnabled,
  ] = useState(false);
  const [
    wbVehicleType,
    setWbVehicleType,
  ] = useState("all");

  const [
    invVehicleEnabled,
    setInvVehicleEnabled,
  ] = useState(false);
  const [
    invVehicleType,
    setInvVehicleType,
  ] = useState("all");
  const [
    invDueEnabled,
    setInvDueEnabled,
  ] = useState(false);
  const [
    invDueFrom,
    setInvDueFrom,
  ] = useState("");
  const [
    invDueTo,
    setInvDueTo,
  ] = useState("");
  const [
    invAmountEnabled,
    setInvAmountEnabled,
  ] = useState(false);
  const [
    invAmountMin,
    setInvAmountMin,
  ] = useState("");
  const [
    invAmountMax,
    setInvAmountMax,
  ] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const inferVehicleType = (vehicleNumber: string | null): string => {
    if (!vehicleNumber)
      return "unknown";
    const v = vehicleNumber.toUpperCase();
    if (v.includes("XR") || v.includes("RY") || v.includes("FH"))
      return "trailer-40t";
    if (v.includes("KN") || v.includes("TM"))
      return "truck-20t";
    if (v.includes("CL") || v.includes("MV"))
      return "box-truck";
    return "flatbed";
  };

  const filteredWaybills = displayWaybills.filter((w) => {
    const q = waybillSearch.toLowerCase();
    const matchesSearch = !q || [
      w.waybill_number,
      w.destination,
      w.vehicle_number,
      w.customer_name,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = waybillStatus === "all" || w.status === waybillStatus;
    const created = new Date(w.created_at);
    const matchesDateFrom = !wbDateEnabled || !wbDateFrom || created >= new Date(wbDateFrom);
    const matchesDateTo = !wbDateEnabled || !wbDateTo || created <= new Date(`${wbDateTo}T23:59:59`);
    const price = w.calculated_price_ngn ?? 0;
    const matchesPriceMin = !wbPriceEnabled || !wbPriceMin || price >= Number(wbPriceMin);
    const matchesPriceMax = !wbPriceEnabled || !wbPriceMax || price <= Number(wbPriceMax);
    const matchesVehicle = !wbVehicleEnabled || wbVehicleType === "all" || inferVehicleType(w.vehicle_number) === wbVehicleType;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesPriceMin && matchesPriceMax && matchesVehicle;
  });

  const filteredInvoices = displayInvoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase();
    const matchesSearch = !q || [
      inv.invoice_number,
      inv.customer_name,
      inv.destination,
      inv.origin,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = invoiceStatus === "all" || inv.status === invoiceStatus;
    const matchesVehicle = !invVehicleEnabled || invVehicleType === "all" || inferVehicleType(inv.vehicle_number) === invVehicleType;
    const due = inv.due_date ? new Date(inv.due_date) : null;
    const matchesDueFrom = !invDueEnabled || !invDueFrom || (due && due >= new Date(invDueFrom));
    const matchesDueTo = !invDueEnabled || !invDueTo || (due && due <= new Date(`${invDueTo}T23:59:59`));
    const matchesAmtMin = !invAmountEnabled || !invAmountMin || inv.total_ngn >= Number(invAmountMin);
    const matchesAmtMax = !invAmountEnabled || !invAmountMax || inv.total_ngn <= Number(invAmountMax);
    return matchesSearch && matchesStatus && matchesVehicle && matchesDueFrom && matchesDueTo && matchesAmtMin && matchesAmtMax;
  });

  const wbActiveFilters = [
    wbDateEnabled,
    wbPriceEnabled,
    wbVehicleEnabled,
  ].filter(Boolean).length;
  const invActiveFilters = [
    invDueEnabled,
    invAmountEnabled,
    invVehicleEnabled,
  ].filter(Boolean).length;

  const resetWaybillFilters = () => {
    setWbDateEnabled(false);
    setWbDateFrom("");
    setWbDateTo("");
    setWbPriceEnabled(false);
    setWbPriceMin("");
    setWbPriceMax("");
    setWbVehicleEnabled(false);
    setWbVehicleType("all");
  };
  const resetInvoiceFilters = () => {
    setInvDueEnabled(false);
    setInvDueFrom("");
    setInvDueTo("");
    setInvAmountEnabled(false);
    setInvAmountMin("");
    setInvAmountMax("");
    setInvVehicleEnabled(false);
    setInvVehicleType("all");
  };

  useWaybillRealtimeEvents({
    onWaybillChange: fetchWaybills,
    onInvoiceChange: fetchInvoices,
    showToasts: true,
  });

  useEffect(
    () => {
      fetchWaybills();
      fetchInvoices();
      fetchPricingRules();
      fetchInvoiceConfig();
    },
    [
      fetchWaybills,
      fetchInvoices,
      fetchPricingRules,
      fetchInvoiceConfig,
    ],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file)
        return;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const waybill = await createWaybill({
          source_type: "upload",
          image_url: URL.createObjectURL(file),
        });
        if (waybill) {
          setExtracting(waybill.id);
          await extractWaybill(
            waybill.id,
            undefined,
            base64,
          );
          setExtracting(null);
          setShowUploadDialog(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [
      createWaybill,
      extractWaybill,
    ],
  );

  const handleExtract = useCallback(
    async (waybill: WaybillRecord) => {
      setExtracting(waybill.id);
      await extractWaybill(
        waybill.id,
        waybill.image_url || undefined,
      );
      setExtracting(null);
    },
    [extractWaybill],
  );

  const handleGenerateInvoice = useCallback(
    async (waybillId: string) => {
      setGenerating(waybillId);
      const invoice = await generateInvoice(waybillId);
      if (invoice) {
        await generateInvoicePDF(invoice.id);
      }
      setGenerating(null);
    },
    [
      generateInvoice,
      generateInvoicePDF,
    ],
  );

  const stats = {
    totalInvoices: displayInvoices.length,
    draftInvoices: displayInvoices.filter(i => i.status === "draft").length,
    pendingReviewInvoices: displayInvoices.filter(i => i.status === "pending_review").length,
    approvedInvoices: displayInvoices.filter(i => i.status === "approved").length,
    pendingInvoices: displayInvoices.filter(i => [
      "draft",
      "pending_review",
      "approved",
      "sent",
      "overdue",
    ].includes(i.status)).length,
  };

  const tabKpis = (() => {
    if (activeTab === "invoices") {
      return [
        {
          label: "Total Invoices", value: stats.totalInvoices, icon: Download,
        },
        {
          label: "Pending Invoices", value: stats.pendingInvoices, icon: Clock,
        },
        {
          label: "Pending Review", value: stats.pendingReviewInvoices, icon: AlertTriangle,
        },
        {
          label: "Approved Invoices", value: stats.approvedInvoices, icon: CheckCircle2,
        },
      ];
    }
    if (activeTab === "pricing") {
      const activeRules = displayPricingRules.filter((r: any) => r.is_active !== false).length;
      const flatRules = displayPricingRules.filter((r: any) => r.pricing_type === "flat" || r.type === "flat").length;
      const perWeightRules = displayPricingRules.filter((r: any) => r.pricing_type === "per_weight" || r.type === "per_weight").length;
      return [
        {
          label: "Total Pricing Rules", value: displayPricingRules.length, icon: DollarSign,
        },
        {
          label: "Active Rules", value: activeRules, icon: CheckCircle2,
        },
        {
          label: "Flat-Rate Rules", value: flatRules, icon: FileText,
        },
        {
          label: "Per-Weight Rules", value: perWeightRules, icon: Truck,
        },
      ];
    }
    if (activeTab === "settings") {
      const taxEnabled = (invoiceConfig as any)?.tax_enabled ? "On" : "Off";
      const autoSend = (invoiceConfig as any)?.auto_send_enabled ? "On" : "Off";
      return [
        {
          label: "Default Tax", value: taxEnabled, icon: Settings2,
        },
        {
          label: "Auto-Send Invoices", value: autoSend, icon: Send,
        },
        {
          label: "Pricing Rules", value: displayPricingRules.length, icon: DollarSign,
        },
        {
          label: "Total Invoices", value: stats.totalInvoices, icon: Download,
        },
      ];
    }
    const totalWaybills = displayWaybills.length;
    const needsReview = displayWaybills.filter((w: any) => w.status === "needs_review").length;
    const extracted = displayWaybills.filter((w: any) => w.status === "extracted" || w.status === "approved").length;
    const invoiced = displayWaybills.filter((w: any) => w.status === "invoice_generated").length;
    return [
      {
        label: "Total Waybills", value: totalWaybills, icon: FileText,
      },
      {
        label: "Extracted", value: extracted, icon: CheckCircle2,
      },
      {
        label: "Needs Review", value: needsReview, icon: AlertTriangle,
      },
      {
        label: "Invoiced", value: invoiced, icon: Download,
      },
    ];
  })();

  const VEHICLE_TYPE_OPTIONS = [
    {
      value: "all", label: "All vehicle types",
    },
    {
      value: "trailer-40t", label: "40-ton trailer",
    },
    {
      value: "truck-20t", label: "20-ton truck",
    },
    {
      value: "box-truck", label: "Box truck",
    },
    {
      value: "flatbed", label: "Flatbed",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="waybills">
              <FileText className="h-4 w-4 mr-1.5" />
              Waybills
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Download className="h-4 w-4 mr-1.5" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="h-4 w-4 mr-1.5" />
              Pricing Rules
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings2 className="h-4 w-4 mr-1.5" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {activeTab === "waybills" && (
          <div className="flex items-center justify-end mt-6">
            <Dialog
              open={showUploadDialog}
              onOpenChange={setShowUploadDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Waybill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Waybill Image</DialogTitle>
                  <DialogDescription>Upload a photo of a waybill. AI will extract the key fields automatically.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Click to upload waybill photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="flex items-center justify-end mt-6">
            <Button onClick={() => setShowPricingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-1 mt-6">
            <h2 className="text-xl font-semibold tracking-tight">Invoice Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure your company details, tax, banking and invoice defaults shown on every generated invoice.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {tabKpis.map((stat, i) => (
            <Card
              key={i}
              className="p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold truncate">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <TabsContent
          value="waybills"
          className="mt-4"
        >
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Waybills
                  </CardTitle>
                  <CardDescription>All captured waybills from drivers, WhatsApp uploads and manual entries.</CardDescription>
                </div>
                <ExportButton
                  filename="waybills"
                  rows={filteredWaybills}
                  columns={[
                    {
                      header: "Status", accessor: w => w.status,
                    },
                    {
                      header: "Source", accessor: w => w.source_type,
                    },
                    {
                      header: "Waybill #", accessor: w => w.waybill_number || "",
                    },
                    {
                      header: "Destination", accessor: w => w.destination || "",
                    },
                    {
                      header: "Vehicle", accessor: w => w.vehicle_number || "",
                    },
                    {
                      header: "Customer", accessor: w => w.customer_name || "",
                    },
                    {
                      header: "Price", accessor: w => w.calculated_price_ngn ?? "",
                    },
                    {
                      header: "Date", accessor: w => toDateParam(w.created_at),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by waybill #, destination, vehicle, customer..."
                    value={waybillSearch}
                    onChange={e => setWaybillSearch(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Select
                  value={waybillStatus}
                  onValueChange={setWaybillStatus}
                >
                  <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(statusConfig).map(([
                      k,
                      v,
                    ]) => (
                      <SelectItem
                        key={k}
                        value={k}
                      >
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card/50 border-border/50 h-9 gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {" "}
                      Filter
                      {wbActiveFilters > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 px-1.5"
                        >
                          {wbActiveFilters}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                    align="end"
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show waybills by...</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="wb-flt-date"
                            checked={wbDateEnabled}
                            onCheckedChange={c => setWbDateEnabled(c === true)}
                          />
                          <Label
                            htmlFor="wb-flt-date"
                            className="text-sm cursor-pointer"
                          >
                            Date
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            disabled={!wbDateEnabled}
                            value={wbDateFrom}
                            onChange={e => setWbDateFrom(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="date"
                            disabled={!wbDateEnabled}
                            value={wbDateTo}
                            onChange={e => setWbDateTo(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="wb-flt-price"
                            checked={wbPriceEnabled}
                            onCheckedChange={c => setWbPriceEnabled(c === true)}
                          />
                          <Label
                            htmlFor="wb-flt-price"
                            className="text-sm cursor-pointer"
                          >
                            Price (₦)
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            disabled={!wbPriceEnabled}
                            value={wbPriceMin}
                            onChange={e => setWbPriceMin(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            disabled={!wbPriceEnabled}
                            value={wbPriceMax}
                            onChange={e => setWbPriceMax(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="wb-flt-veh"
                            checked={wbVehicleEnabled}
                            onCheckedChange={c => setWbVehicleEnabled(c === true)}
                          />
                          <Label
                            htmlFor="wb-flt-veh"
                            className="text-sm cursor-pointer"
                          >
                            Vehicle type
                          </Label>
                        </div>
                        <Select
                          value={wbVehicleType}
                          onValueChange={setWbVehicleType}
                          disabled={!wbVehicleEnabled}
                        >
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPE_OPTIONS.map(o => (
                              <SelectItem
                                key={o.value}
                                value={o.value}
                              >
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button className="flex-1">Apply</Button>
                      <Button
                        variant="outline"
                        onClick={resetWaybillFilters}
                        className="flex-1"
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Waybill #</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWaybills.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No waybills found</p>
                            <p className="text-sm">Upload a waybill image or adjust filters</p>
                          </TableCell>
                        </TableRow>
                      )
                    : filteredWaybills.map((wb) => {
                        const sc = statusConfig[wb.status] || statusConfig.received;
                        return (
                          <TableRow
                            key={wb.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedWaybill(wb)}
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={sc.color}
                              >
                                <sc.icon className="h-3 w-3 mr-1" />
                                {sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {wb.image_url || wb.image_storage_path
                                  ? (
                                      <div className="h-8 w-8 rounded border overflow-hidden bg-muted flex-shrink-0">
                                        <WaybillThumbnail waybill={wb} />
                                      </div>
                                    )
                                  : (
                                      <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                                      </div>
                                    )}
                                <span className="capitalize">{wb.source_type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{wb.waybill_number || "—"}</TableCell>
                            <TableCell>{wb.destination || "—"}</TableCell>
                            <TableCell>{wb.vehicle_number || "—"}</TableCell>
                            <TableCell>{wb.customer_name || "—"}</TableCell>
                            <TableCell>{wb.calculated_price_ngn ? formatAmount(wb.calculated_price_ngn) : "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatWithPattern(
                                wb.created_at,
                                "dd MMM yyyy",
                              )}
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex gap-1 justify-end items-center">
                                {[
                                  "received",
                                  "extraction_failed",
                                ].includes(wb.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={extracting === wb.id}
                                    onClick={() => handleExtract(wb)}
                                  >
                                    {extracting === wb.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scan className="h-3.5 w-3.5" />}
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      aria-label="Waybill actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                  >
                                    <DropdownMenuItem onClick={() => setSelectedWaybill(wb)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {[
                                      "received",
                                      "extraction_failed",
                                    ].includes(wb.status) && (
                                      <DropdownMenuItem
                                        disabled={extracting === wb.id}
                                        onClick={() => handleExtract(wb)}
                                      >
                                        <Scan className="h-4 w-4 mr-2" />
                                        Extract Fields
                                      </DropdownMenuItem>
                                    )}
                                    {[
                                      "extracted",
                                      "needs_review",
                                      "approved",
                                    ].includes(wb.status) && (
                                      <DropdownMenuItem
                                        disabled={generating === wb.id}
                                        onClick={() => handleGenerateInvoice(wb.id)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Generate Invoice
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="invoices"
          className="mt-4"
        >
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Invoices
                  </CardTitle>
                  <CardDescription>Customer invoices generated from waybills with status, amounts and due dates.</CardDescription>
                </div>
                <ExportButton
                  filename="invoices"
                  rows={filteredInvoices}
                  columns={[
                    {
                      header: "Invoice #", accessor: i => i.invoice_number,
                    },
                    {
                      header: "Status", accessor: i => i.status,
                    },
                    {
                      header: "Customer", accessor: i => i.customer_name || "",
                    },
                    {
                      header: "Origin", accessor: i => i.origin || "",
                    },
                    {
                      header: "Destination", accessor: i => i.destination || "",
                    },
                    {
                      header: "Vehicle", accessor: i => i.vehicle_number || "",
                    },
                    {
                      header: "Amount", accessor: i => i.total_ngn ?? "",
                    },
                    {
                      header: "Due Date", accessor: i => i.due_date || "",
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice #, customer, route..."
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                    className="pl-10 bg-card/50 border-border/50"
                  />
                </div>
                <Select
                  value={invoiceStatus}
                  onValueChange={setInvoiceStatus}
                >
                  <SelectTrigger className="w-full md:w-[180px] bg-card/50 border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(invoiceStatusConfig).map(([
                      k,
                      v,
                    ]) => (
                      <SelectItem
                        key={k}
                        value={k}
                      >
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card/50 border-border/50 h-9 gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {" "}
                      Filter
                      {invActiveFilters > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 px-1.5"
                        >
                          {invActiveFilters}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                    align="end"
                  >
                    <h4 className="text-xs font-medium text-foreground px-0.5">Only show invoices by...</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="inv-flt-veh"
                            checked={invVehicleEnabled}
                            onCheckedChange={c => setInvVehicleEnabled(c === true)}
                          />
                          <Label
                            htmlFor="inv-flt-veh"
                            className="text-sm cursor-pointer"
                          >
                            Vehicle type
                          </Label>
                        </div>
                        <Select
                          value={invVehicleType}
                          onValueChange={setInvVehicleType}
                          disabled={!invVehicleEnabled}
                        >
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPE_OPTIONS.map(o => (
                              <SelectItem
                                key={o.value}
                                value={o.value}
                              >
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="inv-flt-due"
                            checked={invDueEnabled}
                            onCheckedChange={c => setInvDueEnabled(c === true)}
                          />
                          <Label
                            htmlFor="inv-flt-due"
                            className="text-sm cursor-pointer"
                          >
                            Due date
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            disabled={!invDueEnabled}
                            value={invDueFrom}
                            onChange={e => setInvDueFrom(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="date"
                            disabled={!invDueEnabled}
                            value={invDueTo}
                            onChange={e => setInvDueTo(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="inv-flt-amt"
                            checked={invAmountEnabled}
                            onCheckedChange={c => setInvAmountEnabled(c === true)}
                          />
                          <Label
                            htmlFor="inv-flt-amt"
                            className="text-sm cursor-pointer"
                          >
                            Amount (₦)
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="From"
                            disabled={!invAmountEnabled}
                            value={invAmountMin}
                            onChange={e => setInvAmountMin(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            placeholder="To"
                            disabled={!invAmountEnabled}
                            value={invAmountMax}
                            onChange={e => setInvAmountMax(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button className="flex-1">Apply</Button>
                      <Button
                        variant="outline"
                        onClick={resetInvoiceFilters}
                        className="flex-1"
                      >
                        Show All
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0
                    ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <Download className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No invoices found</p>
                            <p className="text-sm">Generate invoices from extracted waybills</p>
                          </TableCell>
                        </TableRow>
                      )
                    : filteredInvoices.map((inv) => {
                        const ic = invoiceStatusConfig[inv.status] || invoiceStatusConfig.draft;
                        return (
                          <TableRow
                            key={inv.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={ic.color}
                              >
                                {ic.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{inv.customer_name}</TableCell>
                            <TableCell className="text-sm">
                              {inv.origin && inv.destination
                                ? (
                                    <span className="flex items-center gap-1">
                                      {inv.origin}
                                      {" "}
                                      <ArrowRight className="h-3 w-3" />
                                      {" "}
                                      {inv.destination}
                                    </span>
                                  )
                                : inv.destination || "—"}
                            </TableCell>
                            <TableCell>{inv.vehicle_number || "—"}</TableCell>
                            <TableCell className="text-right font-medium">{formatAmount(inv.total_ngn)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {inv.due_date
                                ? formatWithPattern(
                                    inv.due_date,
                                    "dd MMM yyyy",
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex gap-1 justify-end items-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      aria-label="Invoice actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                  >
                                    <DropdownMenuItem onClick={() => setSelectedInvoice(inv)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        if (inv.id.startsWith("demo-")) {
                                          toast.success("Download downloaded");
                                          return;
                                        }
                                        let path = inv.pdf_storage_path;
                                        if (!path) {
                                          const res = await generateInvoicePDF(inv.id);
                                          path = res?.storage_path ?? null;
                                        }
                                        if (!path)
                                          return;
                                        const url = await getInvoicePdfUrl(path);
                                        if (url) {
                                          window.open(
                                            url,
                                            "_blank",
                                          );
                                          toast.success("Download download started");
                                        }
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Receipt
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={![
                                        "approved",
                                        "sent",
                                        "paid",
                                      ].includes(inv.status)}
                                      onClick={() => setSelectedInvoice(inv)}
                                    >
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Share Receipt
                                    </DropdownMenuItem>
                                    {canDeleteAssets && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setInvoiceToDelete(inv)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Invoice
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="pricing"
          className="mt-4"
        >
          <PricingRulesPanel
            rules={displayPricingRules}
            onAdd={addPricingRule}
            onUpdate={updatePricingRule}
            onDelete={deletePricingRule}
            formatAmount={formatAmount}
            showDialog={showPricingDialog}
            setShowDialog={setShowPricingDialog}
          />
        </TabsContent>

        <TabsContent
          value="settings"
          className="mt-4"
        >
          <InvoiceSettingsPanel
            config={invoiceConfig}
            onSave={updateInvoiceConfig}
          />
        </TabsContent>
      </Tabs>

      <Sheet
        open={!!selectedWaybill}
        onOpenChange={open => !open && setSelectedWaybill(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedWaybill && (
            <WaybillDetailView
              waybill={selectedWaybill}
              onExtract={() => handleExtract(selectedWaybill)}
              onGenerateInvoice={() => handleGenerateInvoice(selectedWaybill.id)}
              onApprove={async () => {
                const updated = await updateWaybillFields(
                  selectedWaybill.id,
                  { status: "approved" },
                );
                if (updated)
                  setSelectedWaybill(updated);
              }}
              onUpdateFields={async (updates) => {
                const updated = await updateWaybillFields(
                  selectedWaybill.id,
                  updates,
                );
                if (updated)
                  setSelectedWaybill(updated);
              }}
              extracting={extracting === selectedWaybill.id}
              generating={generating === selectedWaybill.id}
              formatAmount={formatAmount}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!selectedInvoice}
        onOpenChange={open => !open && setSelectedInvoice(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedInvoice && (
            <InvoiceDetailView
              invoice={selectedInvoice}
              config={invoiceConfig}
              formatAmount={formatAmount}
              onUpdate={updates => updateInvoice(
                selectedInvoice.id,
                updates,
              )}
              onRecordShare={(channel, recipient) => recordInvoiceShare(
                selectedInvoice.id,
                channel,
                recipient,
              )}
              onGeneratePDF={() => generateInvoicePDF(selectedInvoice.id)}
              onGetPdfUrl={path => getInvoicePdfUrl(path)}
              onSendEmail={async (_invoiceId, _data) => {
                toast.info("Coming soon");
                return false;
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={o => !o && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete invoice
              {invoiceToDelete?.invoice_number}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be permanently
              removed for
              {" "}
              {invoiceToDelete?.customer_name || "this customer"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (invoiceToDelete) {
                  await deleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WaybillThumbnail({ waybill }: { waybill: WaybillRecord }) {
  const url = waybill.image_url || null;
  if (!url)
    return <ImageIcon className="h-4 w-4 text-muted-foreground/50 m-auto" />;
  return (
    <img
      src={url}
      alt="Waybill"
      className="h-full w-full object-cover"
    />
  );
}

function WaybillDetailView({
  waybill, onExtract, onGenerateInvoice, onApprove, onUpdateFields, extracting, generating, formatAmount,
}: {
  waybill: WaybillRecord;
  onExtract: () => void;
  onGenerateInvoice: () => void;
  onApprove: () => void;
  onUpdateFields: (updates: Record<string, unknown>) => Promise<void>;
  extracting: boolean;
  generating: boolean;
  formatAmount: (n: number) => string;
}) {
  const sc = statusConfig[waybill.status] || statusConfig.received;
  const [
    editing,
    setEditing,
  ] = useState(false);
  const [
    saving,
    setSaving,
  ] = useState(false);
  const [
    editForm,
    setEditForm,
  ] = useState({
    origin: waybill.origin || "",
    destination: waybill.destination || "",
    vehicle_number: waybill.vehicle_number || "",
    waybill_number: waybill.waybill_number || "",
    customer_name: waybill.customer_name || "",
    waybill_date: waybill.waybill_date || "",
    quantity: waybill.quantity?.toString() || "",
    quantity_unit: waybill.quantity_unit || "",
    weight_kg: waybill.weight_kg?.toString() || "",
    driver_name: waybill.driver_name || "",
  });

  const handleSaveFields = async () => {
    setSaving(true);
    await onUpdateFields({
      ...editForm,
      quantity: editForm.quantity ? Number(editForm.quantity) : null,
      weight_kg: editForm.weight_kg ? Number(editForm.weight_kg) : null,
    });
    setSaving(false);
    setEditing(false);
  };

  const previewUrl = waybill.image_url || null;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Waybill
          {" "}
          {waybill.waybill_number || waybill.id.slice(
            0,
            8,
          )}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={sc.color}
          >
            <sc.icon className="h-3 w-3 mr-1" />
            {sc.label}
          </Badge>
          {waybill.source_type === "whatsapp" && (
            <Badge
              variant="outline"
              className="ml-2 bg-success/10 text-success border-success/20"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              WhatsApp
            </Badge>
          )}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 mt-6">
        {previewUrl && (
          <div className="rounded-lg border overflow-hidden">
            <img
              src={previewUrl}
              alt="Waybill"
              className="w-full object-contain max-h-64"
            />
          </div>
        )}

        {editing
          ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Origin</Label>
                    <Input
                      value={editForm.origin}
                      onChange={e => setEditForm(f => ({
                        ...f, origin: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Destination</Label>
                    <Input
                      value={editForm.destination}
                      onChange={e => setEditForm(f => ({
                        ...f, destination: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vehicle #</Label>
                    <Input
                      value={editForm.vehicle_number}
                      onChange={e => setEditForm(f => ({
                        ...f, vehicle_number: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Waybill #</Label>
                    <Input
                      value={editForm.waybill_number}
                      onChange={e => setEditForm(f => ({
                        ...f, waybill_number: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Customer</Label>
                    <Input
                      value={editForm.customer_name}
                      onChange={e => setEditForm(f => ({
                        ...f, customer_name: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={editForm.waybill_date}
                      onChange={e => setEditForm(f => ({
                        ...f, waybill_date: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={editForm.quantity}
                      onChange={e => setEditForm(f => ({
                        ...f, quantity: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={editForm.quantity_unit}
                      onChange={e => setEditForm(f => ({
                        ...f, quantity_unit: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Weight (kg)</Label>
                    <Input
                      type="number"
                      value={editForm.weight_kg}
                      onChange={e => setEditForm(f => ({
                        ...f, weight_kg: e.target.value,
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Driver</Label>
                    <Input
                      value={editForm.driver_name}
                      onChange={e => setEditForm(f => ({
                        ...f, driver_name: e.target.value,
                      }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveFields}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )
          : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      icon: MapPin, label: "Origin", value: waybill.origin, fieldKey: "origin",
                    },
                    {
                      icon: MapPin, label: "Destination", value: waybill.destination, fieldKey: "destination",
                    },
                    {
                      icon: Truck, label: "Vehicle", value: waybill.vehicle_number, fieldKey: "vehicle_number",
                    },
                    {
                      icon: FileText, label: "Waybill #", value: waybill.waybill_number, fieldKey: "waybill_number",
                    },
                    {
                      icon: User, label: "Customer", value: waybill.customer_name, fieldKey: "customer_name",
                    },
                    {
                      icon: Calendar, label: "Date", value: waybill.waybill_date, fieldKey: "waybill_date",
                    },
                    {
                      icon: Package, label: "Quantity", value: waybill.quantity ? `${waybill.quantity} ${waybill.quantity_unit || ""}` : null, fieldKey: "quantity",
                    },
                    {
                      icon: DollarSign, label: "Price", value: waybill.calculated_price_ngn ? formatAmount(waybill.calculated_price_ngn) : null, fieldKey: null,
                    },
                  ].map((field, i) => {
                    const fieldConf = field.fieldKey && waybill.confidence_per_field
                      ? (waybill.confidence_per_field as Record<string, number>)[field.fieldKey]
                      : null;
                    return (
                      <div
                        key={i}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <field.icon className="h-3 w-3" />
                          {field.label}
                          {fieldConf != null && (
                            <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              fieldConf >= 0.8
                                ? "bg-success/10 text-success"
                                : fieldConf >= 0.5
                                  ? "bg-warning/10 text-warning"
                                  : "bg-destructive/10 text-destructive"
                            }`}
                            >
                              {Math.round(fieldConf * 100)}
                              %
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{field.value || "—"}</p>
                      </div>
                    );
                  })}
                </div>
                {[
                  "extracted",
                  "needs_review",
                ].includes(waybill.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Extracted Fields
                  </Button>
                )}
              </>
            )}

        {waybill.ai_confidence_score != null && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            AI Confidence:
            {" "}
            <span className="font-medium">
              {Math.round(waybill.ai_confidence_score * 100)}
              %
            </span>
            <span className="text-muted-foreground/60">
              (
              {waybill.ai_model_used}
              )
            </span>
          </div>
        )}

        {waybill.source_phone && (
          <div className="text-xs text-muted-foreground">
            Source:
            {" "}
            {waybill.source_phone}
            {" "}
            {waybill.driver_name && `(${waybill.driver_name})`}
          </div>
        )}

        {waybill.extraction_error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
            <strong>Error:</strong>
            {" "}
            {waybill.extraction_error}
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          {[
            "received",
            "extraction_failed",
          ].includes(waybill.status) && (
            <Button
              onClick={onExtract}
              disabled={extracting}
              className="flex-1"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
              {extracting ? "Extracting..." : "Extract with AI"}
            </Button>
          )}
          {[
            "extracted",
            "needs_review",
          ].includes(waybill.status) && (
            <Button
              variant="outline"
              onClick={onApprove}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {[
            "extracted",
            "needs_review",
            "approved",
          ].includes(waybill.status) && (
            <Button
              onClick={onGenerateInvoice}
              disabled={generating}
              className="flex-1"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {generating ? "Generating..." : "Generate Invoice"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function InvoiceDetailView({
  invoice, config, formatAmount, onUpdate, onRecordShare, onGeneratePDF, onGetPdfUrl, onSendEmail,
}: {
  invoice: WaybillInvoice;
  config: ReturnType<typeof useWaybillInvoice>["invoiceConfig"];
  formatAmount: (n: number) => string;
  onUpdate: (updates: Partial<WaybillInvoice>) => void;
  onRecordShare: (channel: "WHATSAPP" | "EMAIL" | "LINK", recipient: string) => void;
  onGeneratePDF: () => Promise<{ storage_path: string } | null>;
  onGetPdfUrl: (storagePath: string) => Promise<string | null>;
  onSendEmail: (invoiceId: string, data: {
    recipientEmail: string; recipientName: string; subject: string; message: string;
  }) => Promise<boolean>;
}) {
  const [
    generatingPdf,
    setGeneratingPdf,
  ] = useState(false);
  const [
    showEmailDialog,
    setShowEmailDialog,
  ] = useState(false);
  const [
    editing,
    setEditing,
  ] = useState(false);
  const ic = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft;

  const isDraft = invoice.status === "draft";

  const [
    editForm,
    setEditForm,
  ] = useState({
    customer_name: invoice.customer_name,
    customer_phone: invoice.customer_phone || "",
    customer_email: invoice.customer_email || "",
    origin: invoice.origin || "",
    destination: invoice.destination || "",
    vehicle_number: invoice.vehicle_number || "",
    waybill_number: invoice.waybill_number || "",
    quantity: invoice.quantity ?? 0,
    quantity_unit: invoice.quantity_unit || "",
    notes: invoice.notes || "",
    subtotal_ngn: invoice.subtotal_ngn,
    discount_ngn: invoice.discount_ngn ?? 0,
  });

  const handleSaveEdit = () => {
    const taxRate = invoice.tax_rate_percent ?? 0;
    const subtotal = editForm.subtotal_ngn;
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
    const total = subtotal + taxAmount - (editForm.discount_ngn || 0);

    onUpdate({
      customer_name: editForm.customer_name,
      customer_phone: editForm.customer_phone || null,
      customer_email: editForm.customer_email || null,
      origin: editForm.origin || null,
      destination: editForm.destination || null,
      vehicle_number: editForm.vehicle_number || null,
      waybill_number: editForm.waybill_number || null,
      quantity: editForm.quantity || null,
      quantity_unit: editForm.quantity_unit || null,
      notes: editForm.notes || null,
      subtotal_ngn: subtotal,
      tax_amount_ngn: taxAmount,
      discount_ngn: editForm.discount_ngn || null,
      total_ngn: total,
      line_items: [
        {
          description: `Transport: ${editForm.origin || "—"} → ${editForm.destination || "—"}`, total: subtotal,
        },
      ],
    } as Partial<WaybillInvoice>);
    setEditing(false);
    toast.success("Invoice updated");
  };

  const handleCancelEdit = () => {
    setEditForm({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || "",
      customer_email: invoice.customer_email || "",
      origin: invoice.origin || "",
      destination: invoice.destination || "",
      vehicle_number: invoice.vehicle_number || "",
      waybill_number: invoice.waybill_number || "",
      quantity: invoice.quantity ?? 0,
      quantity_unit: invoice.quantity_unit || "",
      notes: invoice.notes || "",
      subtotal_ngn: invoice.subtotal_ngn,
      discount_ngn: invoice.discount_ngn ?? 0,
    });
    setEditing(false);
  };

  const handleDownloadPdf = () => {
    const lineItemsHtml = (invoice.line_items as Array<{
      description: string; total: number;
    }>)
      ?.map(item => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.description}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatAmount(item.total)}</td></tr>`)
      .join("") || "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#333}.header{display:flex;justify-content:space-between;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f5f5;padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase}.totals{margin-left:auto;width:300px}.totals td{padding:6px 8px}.total-row{font-weight:bold;font-size:16px;border-top:2px solid #333}.bank-details{background:#f9f9f9;padding:16px;border-radius:8px;margin-top:20px}</style></head><body>
    <div class="header"><div><div style="font-size:18px;font-weight:bold">${config?.company_name || ""}</div>
    <div style="font-size:13px;color:#666">${config?.company_address || ""}</div></div>
    <div style="text-align:right"><div style="font-size:24px;font-weight:bold">INVOICE</div>
    <div style="margin-top:8px"><strong>${invoice.invoice_number}</strong></div>
    <div style="font-size:13px;color:#666">Date: ${invoice.invoice_date} | Due: ${invoice.due_date || "On receipt"}</div></div></div>
    <div style="margin-bottom:20px"><div style="font-size:12px;text-transform:uppercase;color:#999">Bill To</div><div style="font-weight:bold">${invoice.customer_name}</div></div>
    <div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:20px;font-size:13px"><strong>Route:</strong> ${invoice.origin || ""} → ${invoice.destination || ""} | <strong>Vehicle:</strong> ${invoice.vehicle_number || "—"} | <strong>Waybill:</strong> ${invoice.waybill_number || "—"}</div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lineItemsHtml}</tbody></table>
    <table class="totals"><tbody><tr><td>Subtotal</td><td style="text-align:right">${formatAmount(invoice.subtotal_ngn)}</td></tr>
    ${(invoice.tax_amount_ngn || 0) > 0 ? `<tr><td>Tax (${invoice.tax_rate_percent}%)</td><td style="text-align:right">${formatAmount(invoice.tax_amount_ngn || 0)}</td></tr>` : ""}
    <tr class="total-row"><td>Total</td><td style="text-align:right">${formatAmount(invoice.total_ngn)}</td></tr></tbody></table>
    ${config?.bank_name ? `<div class="bank-details"><div style="font-size:12px;text-transform:uppercase;color:#999;margin-bottom:8px">Payment Details</div><div>Bank: ${config.bank_name}</div><div>Account: ${config.bank_account_name}</div><div>Number: ${config.bank_account_number}</div></div>` : ""}
    ${invoice.notes ? `<div style="margin-top:16px;padding:12px;background:#fffef0;border-radius:6px;font-size:13px">${invoice.notes}</div>` : ""}
    </body></html>`;
    const w = window.open(
      "",
      "_blank",
    );
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(
        () => w.print(),
        500,
      );
    }
    toast.success("Invoice opened for printing/PDF");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nRoute: ${invoice.origin || ""} → ${invoice.destination || ""}\nAmount: ${formatAmount(invoice.total_ngn)}\nDue: ${invoice.due_date || "On receipt"}${config?.bank_name ? `\n\nPay to:\nBank: ${config.bank_name}\nAccount: ${config.bank_account_name}\nNumber: ${config.bank_account_number}` : ""}`);
    window.open(
      `https://wa.me/?text=${text}`,
      "_blank",
    );
    onUpdate({
      status: "sent", sent_via: "whatsapp", sent_at: new Date().toISOString(),
    } as Partial<WaybillInvoice>);
    onRecordShare(
      "WHATSAPP",
      invoice.customer_phone || "unknown",
    );
  };

  const handleShareEmail = () => {
    setShowEmailDialog(true);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice
          {" "}
          {invoice.invoice_number}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={ic.color}
          >
            {ic.label}
          </Badge>
          {isDraft && !editing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="ml-auto"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </SheetDescription>
      </SheetHeader>

      {editing && isDraft
        ? (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Customer Name</Label>
                  <Input
                    value={editForm.customer_name}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_name: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    value={editForm.customer_phone}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_phone: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    value={editForm.customer_email}
                    onChange={e => setEditForm(f => ({
                      ...f, customer_email: e.target.value,
                    }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Origin</Label>
                  <Input
                    value={editForm.origin}
                    onChange={e => setEditForm(f => ({
                      ...f, origin: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Input
                    value={editForm.destination}
                    onChange={e => setEditForm(f => ({
                      ...f, destination: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle #</Label>
                  <Input
                    value={editForm.vehicle_number}
                    onChange={e => setEditForm(f => ({
                      ...f, vehicle_number: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Waybill #</Label>
                  <Input
                    value={editForm.waybill_number}
                    onChange={e => setEditForm(f => ({
                      ...f, waybill_number: e.target.value,
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={e => setEditForm(f => ({
                      ...f, quantity: Number(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input
                    value={editForm.quantity_unit}
                    onChange={e => setEditForm(f => ({
                      ...f, quantity_unit: e.target.value,
                    }))}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Subtotal</Label>
                  <Input
                    type="number"
                    value={editForm.subtotal_ngn}
                    onChange={e => setEditForm(f => ({
                      ...f, subtotal_ngn: Number(e.target.value),
                    }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Discount</Label>
                  <Input
                    type="number"
                    value={editForm.discount_ngn}
                    onChange={e => setEditForm(f => ({
                      ...f, discount_ngn: Number(e.target.value),
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({
                    ...f, notes: e.target.value,
                  }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        : (
            <div className="space-y-6 mt-6">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {config?.company_name && <p className="font-bold text-lg">{config.company_name}</p>}
                {config?.company_address && <p className="text-sm text-muted-foreground">{config.company_address}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invoice Date:</span>
                    {" "}
                    <span className="font-medium">{invoice.invoice_date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    {" "}
                    <span className="font-medium">{invoice.due_date || "—"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Bill To</h3>
                <p className="font-medium">{invoice.customer_name}</p>
                {invoice.customer_phone && <p className="text-sm text-muted-foreground">{invoice.customer_phone}</p>}
                {invoice.customer_email && <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Transport Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    {" "}
                    {invoice.origin}
                    {" "}
                    →
                    {" "}
                    {invoice.destination}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle:</span>
                    {" "}
                    {invoice.vehicle_number || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waybill #:</span>
                    {" "}
                    {invoice.waybill_number || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    {" "}
                    {invoice.quantity}
                    {" "}
                    {invoice.quantity_unit}
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.line_items as Array<{
                      description: string; total: number;
                    }>)?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className="text-right">{formatAmount(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatAmount(invoice.subtotal_ngn)}</span>
                </div>
                {(invoice.tax_amount_ngn || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax (
                      {invoice.tax_rate_percent}
                      %)
                    </span>
                    <span>{formatAmount(invoice.tax_amount_ngn || 0)}</span>
                  </div>
                )}
                {(invoice.discount_ngn || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>
                      -
                      {formatAmount(invoice.discount_ngn || 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatAmount(invoice.total_ngn)}</span>
                </div>
              </div>
              {invoice.notes && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
              {config?.bank_name && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-muted-foreground text-xs mb-1">Payment Details</p>
                  <p>
                    <span className="text-muted-foreground">Bank:</span>
                    {" "}
                    {config.bank_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Account:</span>
                    {" "}
                    {config.bank_account_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Number:</span>
                    {" "}
                    {config.bank_account_number}
                  </p>
                </div>
              )}
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {isDraft && (
                    <Button
                      onClick={() => onUpdate({ status: "approved" } as Partial<WaybillInvoice>)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      onClick={() => onUpdate({ status: "paid" } as Partial<WaybillInvoice>)}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!invoice.pdf_storage_path
                    ? (
                        <Button
                          variant="outline"
                          onClick={async () => {
                            setGeneratingPdf(true);
                            await onGeneratePDF();
                            setGeneratingPdf(false);
                          }}
                          disabled={generatingPdf}
                          className="flex-1"
                        >
                          {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                          {generatingPdf ? "Generating…" : "Generate PDF"}
                        </Button>
                      )
                    : (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            const url = await onGetPdfUrl(invoice.pdf_storage_path!);
                            if (url) {
                              window.open(
                                url,
                                "_blank",
                              );
                            }
                            else {
                              toast.error("Could not load PDF");
                            }
                          }}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                      )}
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  {[
                    "approved",
                    "sent",
                    "paid",
                  ].includes(invoice.status) && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleShareWhatsApp}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShareEmail}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

      <SendInvoiceEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        invoiceNumber={invoice.invoice_number}
        customerName={invoice.customer_name}
        customerEmail={invoice.customer_email}
        totalAmount={formatAmount(invoice.total_ngn)}
        hasPdf={!!invoice.pdf_storage_path}
        onSend={data => onSendEmail(
          invoice.id,
          data,
        )}
      />
    </>
  );
}

function PricingRulesPanel({
  rules, onAdd, onUpdate, onDelete, formatAmount, showDialog, setShowDialog,
}: {
  rules: PricingRule[];
  onAdd: (rule: Partial<PricingRule>) => void;
  onUpdate: (ruleId: string, updates: Partial<PricingRule>) => void;
  onDelete: (ruleId: string) => void;
  formatAmount: (n: number) => string;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}) {
  const emptyForm: Partial<PricingRule> = {
    rule_name: "", destination: "", price_ngn: 0, origin: "", vehicle_type: "", customer_name: "", notes: "", price_per_unit_ngn: null, unit_type: "", pricing_mode: "FLAT", currency: "NGN", minimum_charge: null, destination_aliases: [],
  };
  const [
    form,
    setForm,
  ] = useState<Partial<PricingRule>>(emptyForm);
  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);
  const [
    deleteConfirm,
    setDeleteConfirm,
  ] = useState<string | null>(null);

  const openEdit = (rule: PricingRule) => {
    setForm({
      rule_name: rule.rule_name,
      destination: rule.destination,
      origin: rule.origin || "",
      price_ngn: rule.price_ngn,
      price_per_unit_ngn: rule.price_per_unit_ngn,
      unit_type: rule.unit_type || "",
      vehicle_type: rule.vehicle_type || "",
      customer_name: rule.customer_name || "",
      notes: rule.notes || "",
      effective_from: rule.effective_from,
      effective_to: rule.effective_to || "",
      pricing_mode: rule.pricing_mode || "FLAT",
      currency: rule.currency || "NGN",
      minimum_charge: rule.minimum_charge,
      destination_aliases: rule.destination_aliases || [],
    });
    setEditingId(rule.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(
        editingId,
        form,
      );
    }
    else {
      onAdd(form);
    }
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleClose = () => {
    setShowDialog(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const [
    search,
    setSearch,
  ] = useState("");
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<"all" | "active" | "inactive">("all");
  const [
    vehicleTypeEnabled,
    setVehicleTypeEnabled,
  ] = useState(false);
  const [
    vehicleTypeFilter,
    setVehicleTypeFilter,
  ] = useState("all");
  const [
    pricingModeEnabled,
    setPricingModeEnabled,
  ] = useState(false);
  const [
    pricingModeFilter,
    setPricingModeFilter,
  ] = useState<"all" | PricingRule["pricing_mode"]>("all");
  const [
    perUnitOnly,
    setPerUnitOnly,
  ] = useState(false);

  const vehicleTypeOptions = Array.from(new Set(rules.map(r => r.vehicle_type).filter(Boolean))) as string[];

  const filteredRules = rules.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [
      r.rule_name,
      r.destination,
      r.origin,
      r.customer_name,
      r.vehicle_type,
    ]
      .some(v => v?.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? r.is_active : !r.is_active);
    const matchesVehicle = !vehicleTypeEnabled || vehicleTypeFilter === "all" || r.vehicle_type === vehicleTypeFilter;
    const matchesMode = !pricingModeEnabled || pricingModeFilter === "all" || r.pricing_mode === pricingModeFilter;
    const matchesPerUnit = !perUnitOnly || (r.price_per_unit_ngn != null && r.price_per_unit_ngn > 0);
    return matchesSearch && matchesStatus && matchesVehicle && matchesMode && matchesPerUnit;
  });

  const ruleActiveFilters = [
    vehicleTypeEnabled,
    pricingModeEnabled,
    perUnitOnly,
  ].filter(Boolean).length;
  const resetRuleFilters = () => {
    setVehicleTypeEnabled(false);
    setVehicleTypeFilter("all");
    setPricingModeEnabled(false);
    setPricingModeFilter("all");
    setPerUnitOnly(false);
  };

  return (
    <div className="space-y-4">
      <Dialog
        open={showDialog}
        onOpenChange={(v) => {
          if (!v)
            handleClose();
          else
            setShowDialog(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
            <DialogDescription>Define a pricing agreement for a route or customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={form.rule_name}
                onChange={e => setForm(f => ({
                  ...f, rule_name: e.target.value,
                }))}
                placeholder="e.g. Lagos→Abuja Dangote Cement"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origin</Label>
                <Input
                  value={form.origin || ""}
                  onChange={e => setForm(f => ({
                    ...f, origin: e.target.value,
                  }))}
                  placeholder="e.g. Lagos"
                />
              </div>
              <div>
                <Label>Destination *</Label>
                <Input
                  value={form.destination}
                  onChange={e => setForm(f => ({
                    ...f, destination: e.target.value,
                  }))}
                  placeholder="e.g. Abuja"
                />
              </div>
            </div>
            <div>
              <Label>Destination Aliases (comma-separated)</Label>
              <Input
                value={(form.destination_aliases as string[] || []).join(", ")}
                onChange={e => setForm(f => ({
                  ...f, destination_aliases: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                }))}
                placeholder="e.g. FCT, Abuja Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pricing Mode</Label>
                <Select
                  value={form.pricing_mode || "FLAT"}
                  onValueChange={v => setForm(f => ({
                    ...f, pricing_mode: v as PricingRule["pricing_mode"],
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Rate</SelectItem>
                    <SelectItem value="PER_WEIGHT">Per Weight (ton/kg)</SelectItem>
                    <SelectItem value="PER_DISTANCE">Per Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency || "NGN"}
                  onValueChange={v => setForm(f => ({
                    ...f, currency: v,
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Flat Price (₦)</Label>
                <Input
                  type="number"
                  value={form.price_ngn || ""}
                  onChange={e => setForm(f => ({
                    ...f, price_ngn: Number(e.target.value),
                  }))}
                  placeholder="Total trip price"
                />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Input
                  value={form.vehicle_type || ""}
                  onChange={e => setForm(f => ({
                    ...f, vehicle_type: e.target.value,
                  }))}
                  placeholder="e.g. 30-ton trailer"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Price Per Unit (₦)</Label>
                <Input
                  type="number"
                  value={form.price_per_unit_ngn ?? ""}
                  onChange={e => setForm(f => ({
                    ...f, price_per_unit_ngn: e.target.value ? Number(e.target.value) : null,
                  }))}
                  placeholder="Optional per-unit rate"
                />
              </div>
              <div>
                <Label>Unit Type</Label>
                <Input
                  value={form.unit_type || ""}
                  onChange={e => setForm(f => ({
                    ...f, unit_type: e.target.value,
                  }))}
                  placeholder="e.g. ton, bag, trip"
                />
              </div>
              <div>
                <Label>Minimum Charge (₦)</Label>
                <Input
                  type="number"
                  value={form.minimum_charge ?? ""}
                  onChange={e => setForm(f => ({
                    ...f, minimum_charge: e.target.value ? Number(e.target.value) : null,
                  }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label>Customer Name</Label>
              <Input
                value={form.customer_name || ""}
                onChange={e => setForm(f => ({
                  ...f, customer_name: e.target.value,
                }))}
                placeholder="Specific customer (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Effective From</Label>
                <Input
                  type="date"
                  value={form.effective_from || ""}
                  onChange={e => setForm(f => ({
                    ...f, effective_from: e.target.value,
                  }))}
                />
              </div>
              <div>
                <Label>Effective To</Label>
                <Input
                  type="date"
                  value={(form.effective_to as string) || ""}
                  onChange={e => setForm(f => ({
                    ...f, effective_to: e.target.value || null,
                  }))}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes || ""}
                onChange={e => setForm(f => ({
                  ...f, notes: e.target.value,
                }))}
                placeholder="Agreement details, special conditions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.rule_name || !form.destination}
            >
              {editingId ? "Update Rule" : "Save Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Rules
              </CardTitle>
              <CardDescription>
                Define route, vehicle and customer pricing agreements that auto-price waybills.
              </CardDescription>
            </div>
            <ExportButton
              filename="pricing-rules"
              rows={filteredRules}
              columns={[
                {
                  header: "Rule", accessor: r => r.rule_name,
                },
                {
                  header: "Origin", accessor: r => r.origin || "",
                },
                {
                  header: "Destination", accessor: r => r.destination,
                },
                {
                  header: "Vehicle Type", accessor: r => r.vehicle_type || "",
                },
                {
                  header: "Customer", accessor: r => r.customer_name || "",
                },
                {
                  header: "Mode", accessor: r => r.pricing_mode,
                },
                {
                  header: "Flat Price (NGN)", accessor: r => r.price_ngn,
                },
                {
                  header: "Per Unit (NGN)", accessor: r => r.price_per_unit_ngn ?? "",
                },
                {
                  header: "Unit", accessor: r => r.unit_type || "",
                },
                {
                  header: "Active", accessor: r => (r.is_active ? "Yes" : "No"),
                },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by rule, route, customer, vehicle type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full md:w-[150px] bg-card/50 border-border/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/50 border-border/50 h-9 gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {" "}
                  Filter
                  {ruleActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5"
                    >
                      {ruleActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto"
                align="end"
              >
                <h4 className="text-xs font-medium text-foreground px-0.5">Only show pricing rules by...</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pr-flt-veh"
                        checked={vehicleTypeEnabled}
                        onCheckedChange={c => setVehicleTypeEnabled(c === true)}
                      />
                      <Label
                        htmlFor="pr-flt-veh"
                        className="text-sm cursor-pointer"
                      >
                        Vehicle type
                      </Label>
                    </div>
                    <Select
                      value={vehicleTypeFilter}
                      onValueChange={setVehicleTypeFilter}
                      disabled={!vehicleTypeEnabled}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All vehicle types</SelectItem>
                        {vehicleTypeOptions.map(v => (
                          <SelectItem
                            key={v}
                            value={v}
                          >
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pr-flt-mode"
                        checked={pricingModeEnabled}
                        onCheckedChange={c => setPricingModeEnabled(c === true)}
                      />
                      <Label
                        htmlFor="pr-flt-mode"
                        className="text-sm cursor-pointer"
                      >
                        Pricing mode
                      </Label>
                    </div>
                    <Select
                      value={pricingModeFilter}
                      onValueChange={v => setPricingModeFilter(v as typeof pricingModeFilter)}
                      disabled={!pricingModeEnabled}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All modes</SelectItem>
                        <SelectItem value="FLAT">Flat Rate</SelectItem>
                        <SelectItem value="PER_WEIGHT">Per Weight</SelectItem>
                        <SelectItem value="PER_DISTANCE">Per Distance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="per-unit-only"
                      checked={perUnitOnly}
                      onCheckedChange={c => setPerUnitOnly(c === true)}
                    />
                    <Label
                      htmlFor="per-unit-only"
                      className="text-sm cursor-pointer"
                    >
                      Has per-unit pricing
                    </Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button className="flex-1">Apply</Button>
                  <Button
                    variant="outline"
                    onClick={resetRuleFilters}
                    className="flex-1"
                  >
                    Show All
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Flat Price</TableHead>
                <TableHead className="text-right">Per Unit</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No pricing rules match these filters</p>
                        <p className="text-sm">Adjust filters or add a new pricing agreement</p>
                      </TableCell>
                    </TableRow>
                  )
                : filteredRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell className="text-sm">
                        {rule.origin
                          ? (
                              <span className="flex items-center gap-1">
                                {rule.origin}
                                {" "}
                                <ArrowRight className="h-3 w-3" />
                                {" "}
                                {rule.destination}
                              </span>
                            )
                          : rule.destination}
                      </TableCell>
                      <TableCell>{rule.vehicle_type || "—"}</TableCell>
                      <TableCell>{rule.customer_name || <span className="text-muted-foreground">Any</span>}</TableCell>
                      <TableCell className="text-right font-medium">{formatAmount(rule.price_ngn)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {rule.price_per_unit_ngn ? `${formatAmount(rule.price_per_unit_ngn)}/${rule.unit_type || "unit"}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rule.effective_from
                          ? formatWithPattern(
                              rule.effective_from,
                              "dd MMM yy",
                            )
                          : "—"}
                        {rule.effective_to
                          ? ` → ${formatWithPattern(
                            rule.effective_to,
                            "dd MMM yy",
                          )}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={rule.is_active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Pricing rule actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44"
                          >
                            <DropdownMenuItem onClick={() => onUpdate(
                              rule.id,
                              { is_active: !rule.is_active } as Partial<PricingRule>,
                            )}
                            >
                              {rule.is_active
                                ? (
                                    <>
                                      <ToggleRight className="h-4 w-4 mr-2 text-success" />
                                      Deactivate
                                    </>
                                  )
                                : (
                                    <>
                                      <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                                      Activate
                                    </>
                                  )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirm(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {deleteConfirm === rule.id && (
                          <AlertDialog
                            open={true}
                            onOpenChange={o => !o && setDeleteConfirm(null)}
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete pricing rule?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove "
                                  {rule.rule_name}
                                  ". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => {
                                    onDelete(rule.id);
                                    setDeleteConfirm(null);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceSettingsPanel({
  config, onSave,
}: {
  config: InvoiceConfig | null;
  onSave: (c: Record<string, unknown>) => void;
}) {
  const [
    form,
    setForm,
  ] = useState({
    tax_enabled: config?.tax_enabled || false,
    tax_rate_percent: config?.tax_rate_percent || 7.5,
    tax_label: config?.tax_label || "VAT",
    invoice_prefix: config?.invoice_prefix || "INV",
    company_name: config?.company_name || "",
    company_address: config?.company_address || "",
    company_phone: config?.company_phone || "",
    company_email: config?.company_email || "",
    bank_name: config?.bank_name || "",
    bank_account_name: config?.bank_account_name || "",
    bank_account_number: config?.bank_account_number || "",
    payment_terms_days: config?.payment_terms_days || 30,
    notes_template: config?.notes_template || "",
  });

  useEffect(
    () => {
      if (config) {
        setForm({
          tax_enabled: config.tax_enabled,
          tax_rate_percent: config.tax_rate_percent,
          tax_label: config.tax_label,
          invoice_prefix: config.invoice_prefix,
          company_name: config.company_name || "",
          company_address: config.company_address || "",
          company_phone: config.company_phone || "",
          company_email: config.company_email || "",
          bank_name: config.bank_name || "",
          bank_account_name: config.bank_account_name || "",
          bank_account_number: config.bank_account_number || "",
          payment_terms_days: config.payment_terms_days,
          notes_template: config.notes_template || "",
        });
      }
    },
    [config],
  );

  return (
    <div className="space-y-6 w-full px-2 md:px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>These appear on generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input
              value={form.company_name}
              onChange={e => setForm(f => ({
                ...f, company_name: e.target.value,
              }))}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              value={form.company_address}
              onChange={e => setForm(f => ({
                ...f, company_address: e.target.value,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                value={form.company_phone}
                onChange={e => setForm(f => ({
                  ...f, company_phone: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.company_email}
                onChange={e => setForm(f => ({
                  ...f, company_email: e.target.value,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Tax</Label>
            <Switch
              checked={form.tax_enabled}
              onCheckedChange={v => setForm(f => ({
                ...f, tax_enabled: v,
              }))}
            />
          </div>
          {form.tax_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tax Label</Label>
                <Input
                  value={form.tax_label}
                  onChange={e => setForm(f => ({
                    ...f, tax_label: e.target.value,
                  }))}
                />
              </div>
              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.tax_rate_percent}
                  onChange={e => setForm(f => ({
                    ...f, tax_rate_percent: Number(e.target.value),
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Bank details shown on invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bank Name</Label>
            <Input
              value={form.bank_name}
              onChange={e => setForm(f => ({
                ...f, bank_name: e.target.value,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Account Name</Label>
              <Input
                value={form.bank_account_name}
                onChange={e => setForm(f => ({
                  ...f, bank_account_name: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={form.bank_account_number}
                onChange={e => setForm(f => ({
                  ...f, bank_account_number: e.target.value,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Invoice Prefix</Label>
              <Input
                value={form.invoice_prefix}
                onChange={e => setForm(f => ({
                  ...f, invoice_prefix: e.target.value,
                }))}
              />
            </div>
            <div>
              <Label>Payment Terms (days)</Label>
              <Input
                type="number"
                value={form.payment_terms_days}
                onChange={e => setForm(f => ({
                  ...f, payment_terms_days: Number(e.target.value),
                }))}
              />
            </div>
          </div>
          <div>
            <Label>Default Notes</Label>
            <Textarea
              value={form.notes_template}
              onChange={e => setForm(f => ({
                ...f, notes_template: e.target.value,
              }))}
              placeholder="e.g. Payment is due within 30 days..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={() => onSave(form)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base shadow-mtn"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
