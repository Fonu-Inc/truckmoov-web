import type {
  SmsTemplate, SmsTemplateCategory,
} from "@truckmoov/api/notification";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import {
  CATEGORY_LABEL, segmentCount, SMS_TEMPLATE_LIMIT, variablesOf,
} from "./smsTemplateText";
import { useSmsTemplateActions } from "./useSmsTemplateActions";

type Props = {
  /** The template to edit, a copy to start from, or null for a blank one. */
  template: SmsTemplate | null;
  mode: "create" | "edit";
  onClose: () => void;
};

export function SmsTemplateFormDialog({
  template, mode, onClose,
}: Props) {
  const [
    name,
    setName,
  ] = useState(mode === "create" && template ? `${template.name} copy` : template?.name ?? "");
  const [
    category,
    setCategory,
  ] = useState<SmsTemplateCategory>(template?.category ?? "general");
  const [
    content,
    setContent,
  ] = useState(template?.content ?? "");
  const { save } = useSmsTemplateActions(onClose);
  const variables = variablesOf(content);
  const ready = name.trim() && content.trim();

  const submit = () => save.mutate({
    id: mode === "edit" ? template?.id : undefined,
    input: {
      name, category, content, is_active: template?.is_active ?? true,
    },
  });

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit SMS template" : "New SMS template"}</DialogTitle>
          <DialogDescription>
            Write
            {"{{name}}"}
            {" "}
            where a value goes, such as a tenant or a date.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="sms-name"
              required
            >
              Name
            </Label>
            <Input
              id="sms-name"
              maxLength={80}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={next => setCategory(next as SmsTemplateCategory)}
            >
              <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as SmsTemplateCategory[]).map(key => (
                  <SelectItem
                    key={key}
                    value={key}
                  >
                    {CATEGORY_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="sms-content"
              required
            >
              Message
            </Label>
            <Textarea
              id="sms-content"
              rows={5}
              maxLength={SMS_TEMPLATE_LIMIT}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <p className="flex justify-between text-xs text-muted-foreground">
              <span>{`${segmentCount(content)} SMS part${segmentCount(content) === 1 ? "" : "s"}`}</span>
              <span>{`${content.length}/${SMS_TEMPLATE_LIMIT}`}</span>
            </p>
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {variables.map(variable => (
                  <Badge
                    key={variable}
                    variant="secondary"
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={!ready}
            loading={save.isPending}
            onClick={submit}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
