import { useQuery } from "@tanstack/react-query";
import { Inbox, PenSquare, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { cn } from "@/lib/utils";
import { StateNotice } from "../components/StateNotice";
import { EmailComposeDialog } from "./EmailComposeDialog";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { EmailThreadList } from "./EmailThreadList";
import { EmailThreadView } from "./EmailThreadView";
import { credentialsOptions } from "./emailQueries";

export function EmailPanel({ canManage }: { canManage: boolean }) {
  const credentials = useQuery(credentialsOptions());
  const [threadId, setThreadId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [tab, setTab] = useState("inbox");

  if (credentials.isLoading)
    return <Skeleton className="h-64 w-full" aria-label="Loading mailbox" />;
  if (credentials.isError) {
    return <StateNotice title="Could not load the mailbox." body="Check your connection and try again." actionLabel="Retry" onAction={() => void credentials.refetch()} />;
  }
  const connected = credentials.data ?? null;
  const active = connected ? tab : "settings";

  return (
    <Tabs value={active} onValueChange={setTab} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="inbox" disabled={!connected}><Inbox className="mr-2 h-4 w-4" />Inbox</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="mr-2 h-4 w-4" />Mailbox settings</TabsTrigger>
        </TabsList>
        {connected && canManage && active === "inbox" && (
          <Button onClick={() => setComposing(true)}><PenSquare className="h-4 w-4" />New email</Button>
        )}
      </div>
      {!connected && (
        <p className="text-sm text-muted-foreground">No mailbox is connected yet. Connect the platform&apos;s mailbox to read and send email here.</p>
      )}
      <TabsContent value="inbox">
        <div className="grid h-[calc(100vh-15rem)] min-h-96 gap-4 lg:grid-cols-3">
          <Card className={cn("flex min-h-0 flex-col overflow-hidden border-border/50 bg-card/50", threadId && "hidden lg:flex")}>
            <EmailThreadList activeId={threadId} ownAddress={connected?.emailAddress ?? null} onSelect={setThreadId} />
          </Card>
          <Card className={cn("flex min-h-0 flex-col overflow-hidden border-border/50 bg-card/50 lg:col-span-2", !threadId && "hidden lg:flex")}>
            {threadId
              ? <EmailThreadView key={threadId} threadId={threadId} ownAddress={connected?.emailAddress ?? null} canManage={canManage} onBack={() => setThreadId(null)} />
              : <StateNotice title="Select a thread to read it." />}
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <Card className="border-border/50 bg-card/50 p-4">
          <EmailSettingsForm key={connected?.updatedAt ?? "new"} credentials={connected} canManage={canManage} />
        </Card>
      </TabsContent>
      {composing && <EmailComposeDialog onClose={() => setComposing(false)} />}
    </Tabs>
  );
}
