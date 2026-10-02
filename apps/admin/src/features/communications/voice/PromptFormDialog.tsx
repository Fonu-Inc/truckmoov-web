import type { IvrPrompt, IvrPromptCategory, VoiceLanguage } from "@truckmoov/api/notification";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Textarea } from "@/components/shadcn/textarea";
import { CATEGORY_LABEL, LANGUAGES } from "./voiceDisplay";
import { useVoiceActions } from "./useVoiceActions";

type Props = {
  prompt: IvrPrompt | null;
  onClose: () => void;
};

export function PromptFormDialog({ prompt, onClose }: Props) {
  const [name, setName] = useState(prompt?.name ?? "");
  const [category, setCategory] = useState<IvrPromptCategory>(prompt?.category ?? "greeting");
  const [keyPress, setKeyPress] = useState(prompt?.key_press ?? "");
  const [translations, setTranslations] = useState<Partial<Record<VoiceLanguage, string>>>(prompt?.translations ?? {});
  const { savePrompt } = useVoiceActions(onClose);
  const ready = name.trim() && translations.en?.trim();

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{prompt ? "Edit prompt" : "New prompt"}</DialogTitle>
          <DialogDescription>One spoken line of the phone menu. English is required; add the others you support.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="prompt-name">Name</Label>
              <Input id="prompt-name" maxLength={80} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-key">Key to press</Label>
              <Input id="prompt-key" maxLength={1} placeholder="1" value={keyPress} onChange={e => setKeyPress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={next => setCategory(next as IvrPromptCategory)}>
              <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as IvrPromptCategory[]).map(key => <SelectItem key={key} value={key}>{CATEGORY_LABEL[key]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Tabs defaultValue="en">
            <TabsList className="flex h-auto flex-wrap">
              {LANGUAGES.map(language => <TabsTrigger key={language.code} value={language.code}>{language.name}</TabsTrigger>)}
            </TabsList>
            {LANGUAGES.map(language => (
              <TabsContent key={language.code} value={language.code}>
                <Textarea
                  aria-label={`${language.name} text`}
                  rows={4}
                  maxLength={500}
                  value={translations[language.code] ?? ""}
                  onChange={e => setTranslations(current => ({ ...current, [language.code]: e.target.value }))}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!ready}
            loading={savePrompt.isPending}
            onClick={() => savePrompt.mutate({ id: prompt?.id, input: { name, category, key_press: keyPress, translations, is_active: prompt?.is_active ?? true } })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
