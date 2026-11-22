import { useQuery } from "@tanstack/react-query";
import {
  PhoneCall, PhoneOff,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { CallLogTab } from "./CallLogTab";
import { DashboardTab } from "./DashboardTab";
import { NewCallDialog } from "./NewCallDialog";
import { PromptsTab } from "./PromptsTab";
import { RecordingsTab } from "./RecordingsTab";
import { voiceStatusOptions } from "./voiceQueries";

export function VoicePanel({ canManage }: { canManage: boolean }) {
  const status = useQuery(voiceStatusOptions());
  const [
    calling,
    setCalling,
  ] = useState(false);
  const connected = status.data?.configured === true;

  return (
    <div className="space-y-4">
      {status.data && !connected && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          <PhoneOff className="mt-0.5 h-4 w-4 shrink-0" />
          No voice carrier is connected yet, so calls cannot be placed or received. You can still write the phone menu; the call log fills in once a carrier is connected.
        </p>
      )}
      <Tabs
        defaultValue="calls"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="calls">Call log</TabsTrigger>
            <TabsTrigger value="prompts">IVR prompts</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          {canManage && (
            <Button
              disabled={!connected}
              onClick={() => setCalling(true)}
            >
              <PhoneCall className="h-4 w-4" />
              Place a call
            </Button>
          )}
        </div>
        <TabsContent value="calls"><CallLogTab canManage={canManage} /></TabsContent>
        <TabsContent value="prompts"><PromptsTab canManage={canManage} /></TabsContent>
        <TabsContent value="recordings"><RecordingsTab /></TabsContent>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
      </Tabs>
      {calling && <NewCallDialog onClose={() => setCalling(false)} />}
    </div>
  );
}
