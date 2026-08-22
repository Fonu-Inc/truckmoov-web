import {
  Inbox,
  Mail,
} from "lucide-react";
import { EmailInbox } from "@/components/email/EmailInbox";
import { EmailProviderSettings } from "@/components/email/EmailProviderSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";

export default function PlatformMessagingCenter() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email
          </CardTitle>
          <CardDescription>
            Centralized inbox and provider configuration for all outbound and inbound platform email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="inbox"
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger
                value="inbox"
                className="flex items-center gap-2"
              >
                <Inbox className="h-4 w-4" />
                Inbox
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Provider Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox">
              <EmailInbox />
            </TabsContent>
            <TabsContent value="settings">
              <EmailProviderSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
