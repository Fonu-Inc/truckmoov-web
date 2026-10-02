import { useQuery } from "@tanstack/react-query";
import type { IvrPrompt } from "@truckmoov/api/notification";
import { ListMusic, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { StateNotice } from "../components/StateNotice";
import { PromptFormDialog } from "./PromptFormDialog";
import { CATEGORY_LABEL, languageName } from "./voiceDisplay";
import { voicePromptsOptions } from "./voiceQueries";
import { useVoiceActions } from "./useVoiceActions";

function PromptCard({ prompt, canManage, onEdit }: { prompt: IvrPrompt; canManage: boolean; onEdit: (prompt: IvrPrompt) => void }) {
  const { savePrompt, deletePrompt } = useVoiceActions();
  const toggle = (active: boolean) => savePrompt.mutate({
    id: prompt.id,
    input: { name: prompt.name, category: prompt.category, key_press: prompt.key_press, translations: prompt.translations, is_active: active },
  });

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{prompt.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">{CATEGORY_LABEL[prompt.category]}</Badge>
              {prompt.key_press && <Badge variant="secondary" className="text-[10px]">{`Press ${prompt.key_press}`}</Badge>}
            </div>
          </div>
          {canManage && (
            <div className="flex shrink-0">
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${prompt.name}`} onClick={() => onEdit(prompt)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${prompt.name}`} loading={deletePrompt.isPending} onClick={() => deletePrompt.mutate(prompt.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{prompt.translations.en}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Object.keys(prompt.translations).map(languageName).join(", ")}</span>
          <label className="flex items-center gap-2">
            {prompt.is_active ? "Active" : "Inactive"}
            <Switch checked={prompt.is_active} disabled={!canManage || savePrompt.isPending} aria-label={`${prompt.name} active`} onCheckedChange={toggle} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptsTab({ canManage }: { canManage: boolean }) {
  const prompts = useQuery(voicePromptsOptions());
  const [editing, setEditing] = useState<IvrPrompt | "new" | null>(null);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" />New prompt</Button>
        </div>
      )}
      {prompts.isPending && <Skeleton className="h-40 w-full" />}
      {prompts.isError && !prompts.data && <StateNotice title="Could not load prompts." body="Check your connection and try again." actionLabel="Retry" onAction={() => void prompts.refetch()} />}
      {prompts.data?.length === 0 && (
        <StateNotice icon={<ListMusic className="h-8 w-8 text-muted-foreground/50" />} title="No prompts yet." body="Write the lines the phone menu speaks, in each language you support." />
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {prompts.data?.map(prompt => <PromptCard key={prompt.id} prompt={prompt} canManage={canManage} onEdit={setEditing} />)}
      </div>
      {editing !== null && <PromptFormDialog key={editing === "new" ? "new" : editing.id} prompt={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
