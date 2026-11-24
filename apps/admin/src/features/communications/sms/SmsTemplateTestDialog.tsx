import type { SmsTemplate } from "@truckmoov/api/notification";
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
import { renderSms } from "./smsTemplateText";
import { useSmsTemplateActions } from "./useSmsTemplateActions";

type Props = {
  template: SmsTemplate;
  onClose: () => void;
};

export function SmsTemplateTestDialog({
  template, onClose,
}: Props) {
  const [
    to,
    setTo,
  ] = useState("");
  const [
    values,
    setValues,
  ] = useState<Record<string, string>>({});
  const { test } = useSmsTemplateActions();
  const complete = template.variables.every(name => values[name]?.trim());
  const validNumber = to.replace(
    /\D/g,
    "",
  ).length >= 8;

  return (
    <Dialog
      open
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`Send a test of ${template.name}`}</DialogTitle>
          <DialogDescription>It is sent as a real SMS from the platform sender.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor="sms-test-to"
              required
            >
              Phone number
            </Label>
            <Input
              id="sms-test-to"
              inputMode="tel"
              placeholder="2348012345678"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          {template.variables.map(name => (
            <div
              key={name}
              className="space-y-1"
            >
              <Label
                htmlFor={`sms-test-${name}`}
                required
              >
                {`Value for ${name}`}
              </Label>
              <Input
                id={`sms-test-${name}`}
                value={values[name] ?? ""}
                onChange={e => setValues(current => ({
                  ...current, [name]: e.target.value,
                }))}
              />
            </div>
          ))}
          <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
            {renderSms(
              template.content,
              values,
            )}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={!complete || !validNumber}
            loading={test.isPending}
            onClick={() => test.mutate(
              {
                id: template.id, input: {
                  to, values,
                },
              },
              { onSuccess: onClose },
            )}
          >
            Send test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
