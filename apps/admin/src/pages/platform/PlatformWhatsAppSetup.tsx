import { useQuery } from "@tanstack/react-query";
import {
  getSystemWhatsAppAccountQueryOptions,
  useConnectSystemWhatsAppAccount,
  useDisconnectSystemWhatsAppAccount,
} from "@truckmoov/api/notification";
import { Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  Alert, AlertDescription,
} from "@/components/shadcn/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Label } from "@/components/shadcn/label";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import { signupStepLabel } from "@/features/communications/components/whatsapp/accountHealth";
import { ConnectionCard } from "@/features/communications/components/whatsapp/ConnectionCard";
import { ConnectionSteps } from "@/features/communications/components/whatsapp/ConnectionSteps";
import { TemplatesPanel } from "@/features/communications/components/whatsapp/TemplatesPanel";
import {
  EmbeddedSignupCancelled,
  useMetaEmbeddedSignup,
} from "@/features/communications/useMetaEmbeddedSignup";
import { DetailSkeleton } from "@/components/ui/skeletons";

export default function PlatformWhatsAppSetup() {
  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);
  const [
    deregister,
    setDeregister,
  ] = useState(false);
  const signup = useMetaEmbeddedSignup();
  const connectAccount = useConnectSystemWhatsAppAccount();
  const disconnectAccount = useDisconnectSystemWhatsAppAccount();

  const accountQuery = useQuery(getSystemWhatsAppAccountQueryOptions());
  const account = accountQuery.data?.data;
  const isConnected = Boolean(account?.phone_number_id);
  const loadFailed = accountQuery.isError;

  const handleConnect = async () => {
    try {
      const result = await signup.launch();
      const connected = await connectAccount.mutateAsync({
        data: {
          code: result.code,
          phone_number_id: result.phoneNumberId,
          business_account_id: result.businessAccountId,
          coexistence: result.coexistence || undefined,
        },
      });
      const failed = connected.data.steps?.filter(step => step.status === "failed") ?? [];
      if (failed.length > 0)
        toast.warning("WhatsApp number connected, but a step needs attention. See the setup checklist.");
      else
        toast.success("WhatsApp number connected.");
    }
    catch (error) {
      if (error instanceof EmbeddedSignupCancelled) {
        if (error.step)
          toast.info(`Signup stopped while ${signupStepLabel(error.step)}.`);
        return;
      }
      toast.error((error as { message?: string }).message || "Couldn't connect the WhatsApp number.");
    }
  };

  const handleDisconnect = () => {
    if (!account?.phone_number_id)
      return;
    disconnectAccount.mutate(
      { phoneNumberId: account.phone_number_id, deregister },
      {
        onSuccess: (response) => {
          setConfirmOpen(false);
          setDeregister(false);
          toast.success("WhatsApp number disconnected.");
          response.data.warnings?.forEach(warning => toast.warning(warning));
        },
        onError: error => toast.error(error.message),
      },
    );
  };

  const linking = connectAccount.isPending;
  const showEmpty = !accountQuery.isLoading && !loadFailed && !isConnected && !linking;

  return (
    <Tabs
      defaultValue="connection"
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="connection">Connection</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      <TabsContent
        value="connection"
        className="space-y-4"
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The connected WhatsApp Business number is what drivers receive job
            instructions and messages on. Replies land in the Messaging Center.
          </AlertDescription>
        </Alert>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WhatsAppIcon className="h-5 w-5 text-primary" />
              WhatsApp Business Account
            </CardTitle>
            <CardDescription>
              The Meta-registered number this platform sends from.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {accountQuery.isLoading && <DetailSkeleton items={6} />}
            {loadFailed && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-base font-semibold text-foreground">Couldn&apos;t load the WhatsApp account</p>
                <p className="text-sm text-muted-foreground">{accountQuery.error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => void accountQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            )}
            {linking && !isConnected && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Linking the number. This takes a few seconds.
                </p>
                <ConnectionSteps pending />
              </div>
            )}
            {showEmpty && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <WhatsAppIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    No WhatsApp number connected
                  </p>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    Connect the platform&apos;s WhatsApp Business number with
                    Meta&apos;s embedded signup. You&apos;ll sign in to
                    Facebook, choose or create a WhatsApp Business account
                    and verify the number. The access token is stored
                    encrypted at platform level.
                  </p>
                </div>
                <Button
                  onClick={() => void handleConnect()}
                  loading={signup.launching}
                  disabled={!signup.configured}
                >
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  Connect WhatsApp Business
                </Button>
                {!signup.configured && (
                  <p className="text-xs text-muted-foreground">
                    Signup isn&apos;t configured: set VITE_META_APP_ID and VITE_META_CONFIG_ID for this app.
                  </p>
                )}
              </div>
            )}
            {isConnected && account && (
              <ConnectionCard
                account={account}
                connecting={signup.launching || linking}
                onReconnect={() => void handleConnect()}
                onDisconnect={() => setConfirmOpen(true)}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <TemplatesPanel connected={isConnected} />
      </TabsContent>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this WhatsApp number?</AlertDialogTitle>
            <AlertDialogDescription>
              Sending stops for the whole platform: drivers will no longer
              receive WhatsApp messages from
              {" "}
              {account?.display_phone_number || "this number"}
              , and replies will no longer reach the Messaging Center, until a
              number is connected again. Conversation history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-2">
            <Checkbox
              id="deregister-number"
              checked={deregister}
              onCheckedChange={checked => setDeregister(checked === true)}
            />
            <Label
              htmlFor="deregister-number"
              className="text-sm font-normal leading-snug"
            >
              Also release the number from WhatsApp Cloud API, so it can be used on the WhatsApp Business app again.
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={disconnectAccount.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleDisconnect();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
