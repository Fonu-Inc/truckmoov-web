import {
  useEffect, useState,
} from "react";

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

export type DetailField = {
  key: string;
  label: string;
  value: string;
  editable?: boolean;
  /** When set, edit mode renders a dropdown with an "Other" free-text fallback. */
  options?: string[];
};

export type DetailState = {
  title: string;
  editing: boolean;
  fields: DetailField[];
  onSave?: (values: Record<string, string>) => void;
};

const OTHER = "Other";

/**
 * View or edit one row from a fleet section. A field with `options` renders a
 * dropdown; picking "Other" (or arriving with a value outside the list) reveals
 * a free-text input, so custom values survive a round trip.
 */
export function DetailDialog({
  detail,
  onClose,
}: {
  detail: DetailState | null;
  onClose: () => void;
}) {
  const [
    values,
    setValues,
  ] = useState<Record<string, string>>({});
  const [
    others,
    setOthers,
  ] = useState<Record<string, string>>({});

  useEffect(
    () => {
      if (!detail)
        return;
      const next: Record<string, string> = {};
      const nextOthers: Record<string, string> = {};
      detail.fields.forEach((field) => {
        if (field.options && field.value && !field.options.includes(field.value)) {
          next[field.key] = OTHER;
          nextOthers[field.key] = field.value;
        }
        else {
          next[field.key] = field.value;
        }
      });
      setValues(next);
      setOthers(nextOthers);
    },
    [detail],
  );

  if (!detail)
    return null;

  function handleSave() {
    if (!detail?.onSave)
      return;
    const resolved: Record<string, string> = {};
    detail.fields.forEach((field) => {
      const raw = values[field.key] ?? "";
      resolved[field.key] = raw === OTHER ? (others[field.key] ?? "") : raw;
    });
    detail.onSave(resolved);
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{detail.title}</DialogTitle>
          <DialogDescription>
            {detail.editing
              ? "Update the details below and save your changes."
              : "Review the details you entered."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {detail.fields.map((field) => {
            const editable = detail.editing && field.editable;
            const current = values[field.key] ?? "";

            return (
              <div
                key={field.key}
                className="space-y-1.5"
              >
                <Label className="text-xs">{field.label}</Label>

                {!editable && (
                  <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground">
                    {field.value || "—"}
                  </p>
                )}

                {editable && field.options && (
                  <>
                    <Select
                      value={current}
                      onValueChange={next => setValues(previous => ({
                        ...previous,
                        [field.key]: next,
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options.includes(OTHER)
                          ? field.options
                          : [
                              ...field.options,
                              OTHER,
                            ]).map(option => (
                          <SelectItem
                            key={option}
                            value={option}
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {current === OTHER && (
                      <Input
                        value={others[field.key] ?? ""}
                        placeholder={`Specify ${field.label.toLowerCase()}`}
                        onChange={event => setOthers(previous => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }))}
                      />
                    )}
                  </>
                )}

                {editable && !field.options && (
                  <Input
                    value={current}
                    onChange={event => setValues(previous => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))}
                  />
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            {detail.editing ? "Cancel" : "Close"}
          </Button>
          {detail.editing && detail.onSave && (
            <Button onClick={handleSave}>Save Changes</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
