import type { WaybillRecord } from "@/features/payouts-invoicing/types";
import {
  Calendar, CheckCircle2, DollarSign, Download, FileText, ImageIcon, Loader2, MapPin, MessageSquare, Package, Pencil, Save, Scan, Truck, User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import {
  SheetDescription, SheetHeader, SheetTitle,
} from "@/components/shadcn/sheet";
import { statusConfig } from "@/features/payouts-invoicing/utils/statusConfig";

export function WaybillThumbnail({ waybill }: { waybill: WaybillRecord }) {
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

export function WaybillDetailView({
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
