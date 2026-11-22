import type {
  SmsTemplate, SmsTemplateCategory,
} from "@truckmoov/api/notification";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Send, Trash2,
} from "lucide-react";
import {
  useMemo, useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent,
} from "@/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { StateNotice } from "../components/StateNotice";
import { SmsTemplateFormDialog } from "./SmsTemplateFormDialog";
import { smsTemplatesOptions } from "./smsTemplateQueries";
import { SmsTemplateTestDialog } from "./SmsTemplateTestDialog";
import {
  CATEGORY_LABEL, segmentCount,
} from "./smsTemplateText";
import { useSmsTemplateActions } from "./useSmsTemplateActions";

const ANY = "any";

type Dialog = {
  kind: "form"; mode: "create" | "edit"; template: SmsTemplate | null;
} | {
  kind: "test"; template: SmsTemplate;
} | null;

function TemplateCard({
  template, canManage, onOpen,
}: {
  template: SmsTemplate; canManage: boolean; onOpen: (dialog: Dialog) => void;
}) {
  const {
    save, remove,
  } = useSmsTemplateActions();
  const toggle = (active: boolean) => save.mutate({
    id: template.id,
    input: {
      name: template.name, category: template.category, content: template.content, is_active: active,
    },
  });

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{template.name}</p>
            <Badge
              variant="outline"
              className="mt-1 text-[10px]"
            >
              {CATEGORY_LABEL[template.category]}
            </Badge>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${template.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onOpen({
                  kind: "form", mode: "edit", template,
                })}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onOpen({
                  kind: "form", mode: "create", template,
                })}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onOpen({
                  kind: "test", template,
                })}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send a test
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => remove.mutate(template.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.content}</p>
        <div className="flex flex-wrap items-center gap-1">
          {template.variables.map(variable => (
            <Badge
              key={variable}
              variant="secondary"
              className="text-[10px]"
            >
              {variable}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{`${segmentCount(template.content)} SMS part${segmentCount(template.content) === 1 ? "" : "s"}`}</span>
          <label className="flex items-center gap-2">
            {template.is_active ? "Active" : "Inactive"}
            <Switch
              checked={template.is_active}
              disabled={!canManage || save.isPending}
              aria-label={`${template.name} active`}
              onCheckedChange={toggle}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export function SmsTemplatesPanel({ canManage }: { canManage: boolean }) {
  const [
    search,
    setSearch,
  ] = useState("");
  const [
    category,
    setCategory,
  ] = useState<SmsTemplateCategory | "">("");
  const [
    dialog,
    setDialog,
  ] = useState<Dialog>(null);
  const templates = useQuery(smsTemplatesOptions());
  const shown = useMemo(
    () => (templates.data ?? []).filter(t =>
      (!category || t.category === category)
      && `${t.name} ${t.content}`.toLowerCase().includes(search.trim().toLowerCase())),
    [
      templates.data,
      search,
      category,
    ],
  );
  const filtered = Boolean(search.trim() || category);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search templates"
            className="pl-10"
            placeholder="Search templates"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={category || ANY}
          onValueChange={next => setCategory(next === ANY ? "" : next as SmsTemplateCategory)}
        >
          <SelectTrigger
            className="w-48"
            aria-label="Category filter"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All categories</SelectItem>
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
        {canManage && (
          <Button onClick={() => setDialog({
            kind: "form", mode: "create", template: null,
          })}
          >
            <Plus className="h-4 w-4" />
            New template
          </Button>
        )}
      </div>

      {templates.isPending && <Skeleton className="h-40 w-full" />}
      {templates.isError && !templates.data && (
        <StateNotice
          title="Could not load templates."
          body="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void templates.refetch()}
        />
      )}
      {templates.data && shown.length === 0 && (
        <StateNotice
          icon={<MessageSquare className="h-8 w-8 text-muted-foreground/50" />}
          title={filtered ? "No templates match." : "No SMS templates yet."}
          body={filtered ? undefined : "Save the texts you send often, then reuse them in campaigns."}
        />
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            canManage={canManage}
            onOpen={setDialog}
          />
        ))}
      </div>

      {dialog?.kind === "form" && (
        <SmsTemplateFormDialog
          key={`${dialog.mode}:${dialog.template?.id ?? "new"}`}
          mode={dialog.mode}
          template={dialog.template}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "test" && (
        <SmsTemplateTestDialog
          template={dialog.template}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
