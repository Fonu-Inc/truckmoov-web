import type { PlatformMailCredentials } from "@truckmoov/api/auth";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { secureFor } from "./emailLogic";
import { useEmailActions } from "./useEmailActions";

type ServerDraft = {
  host: string; port: string; username: string; password: string;
};

type Props = {
  credentials: PlatformMailCredentials | null;
  canManage: boolean;
};

function draftOf(server: PlatformMailCredentials["imap"] | undefined, defaultPort: string): ServerDraft {
  return {
    host: server?.host ?? "", port: server ? String(server.port) : defaultPort, username: server?.username ?? "", password: "",
  };
}

function ServerFields({
  legend, idPrefix, value, hint, disabled, onChange,
}: {
  legend: string;
  idPrefix: string;
  value: ServerDraft;
  hint?: string;
  disabled: boolean;
  onChange: (next: ServerDraft) => void;
}) {
  const set = (key: keyof ServerDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({
    ...value, [key]: e.target.value,
  });
  return (
    <fieldset className="space-y-3 rounded-lg border border-border/60 p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <Label
            htmlFor={`${idPrefix}-host`}
            required
          >
            Host
          </Label>
          <Input
            id={`${idPrefix}-host`}
            disabled={disabled}
            placeholder="mail.example.com"
            value={value.host}
            onChange={set("host")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-port`}>Port</Label>
          <Input
            id={`${idPrefix}-port`}
            disabled={disabled}
            inputMode="numeric"
            value={value.port}
            onChange={set("port")}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor={`${idPrefix}-user`}
            required
          >
            Username
          </Label>
          <Input
            id={`${idPrefix}-user`}
            disabled={disabled}
            autoComplete="off"
            value={value.username}
            onChange={set("username")}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={`${idPrefix}-password`}
            required
          >
            Password
          </Label>
          <Input
            id={`${idPrefix}-password`}
            disabled={disabled}
            type="password"
            autoComplete="new-password"
            placeholder={hint ?? ""}
            value={value.password}
            onChange={set("password")}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function EmailSettingsForm({
  credentials, canManage,
}: Props) {
  const [
    email,
    setEmail,
  ] = useState(credentials?.emailAddress ?? "");
  const [
    name,
    setName,
  ] = useState(credentials?.displayName ?? "");
  const [
    imap,
    setImap,
  ] = useState(draftOf(
    credentials?.imap,
    "993",
  ));
  const [
    smtp,
    setSmtp,
  ] = useState(draftOf(
    credentials?.smtp,
    "465",
  ));
  const {
    saveCredentials, disconnect,
  } = useEmailActions();
  const imapPort = Number(imap.port);
  const smtpPort = Number(smtp.port);
  const complete = email.trim() && imap.host.trim() && imap.username.trim() && imap.password && smtp.host.trim() && smtp.username.trim() && smtp.password
    && Number.isInteger(imapPort) && Number.isInteger(smtpPort);

  const submit = () => saveCredentials.mutate(
    {
      emailAddress: email.trim(),
      displayName: name.trim() || undefined,
      imap: {
        host: imap.host.trim(), port: imapPort, username: imap.username.trim(), password: imap.password, secure: secureFor(imapPort),
      },
      smtp: {
        host: smtp.host.trim(), port: smtpPort, username: smtp.username.trim(), password: smtp.password, secure: secureFor(smtpPort),
      },
    },
    {
      onSuccess: () => {
        setImap(v => ({
          ...v, password: "",
        }));
        setSmtp(v => ({
          ...v, password: "",
        }));
      },
    },
  );

  return (
    <div className="space-y-4">
      {credentials?.lastError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {`The last sync failed: ${credentials.lastError}`}
        </p>
      )}
      {credentials && !credentials.lastError && (
        <p className="text-xs text-muted-foreground">
          {credentials.lastVerifiedAt ? `Last verified ${formatDateTime(credentials.lastVerifiedAt)}.` : "Not verified yet. It is checked on the next sync."}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor="mail-address"
            required
          >
            Email address
          </Label>
          <Input
            id="mail-address"
            disabled={!canManage}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mail-name">Display name</Label>
          <Input
            id="mail-name"
            disabled={!canManage}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
      </div>
      <ServerFields
        legend="Incoming (IMAP)"
        idPrefix="imap"
        value={imap}
        disabled={!canManage}
        hint={credentials?.imap.passwordPreview}
        onChange={setImap}
      />
      <ServerFields
        legend="Outgoing (SMTP)"
        idPrefix="smtp"
        value={smtp}
        disabled={!canManage}
        hint={credentials?.smtp.passwordPreview}
        onChange={setSmtp}
      />
      <p className="text-xs text-muted-foreground">Passwords are encrypted and never shown again. Enter them each time you save.</p>
      {canManage && (
        <div className="flex gap-2">
          <Button
            disabled={!complete}
            loading={saveCredentials.isPending}
            onClick={submit}
          >
            {credentials ? "Update mailbox" : "Connect mailbox"}
          </Button>
          {credentials && (
            <Button
              variant="outline"
              loading={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
