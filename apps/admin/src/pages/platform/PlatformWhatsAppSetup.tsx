import type { ServerErrorResponse } from "@truckmoov/api/lib/types";
import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@truckmoov/app-core/utils/time-utils";
import {
  getSystemWhatsAppAccountQueryOptions,
  getSystemWhatsAppTemplatesQueryOptions,
  useConnectSystemWhatsAppAccount,
  useDisconnectSystemWhatsAppAccount,
} from "@truckmoov/api/notification";
import {
  CheckCircle2,
  Info,
  Link2Off,
  Phone,
  ShieldCheck,
} from "lucide-react";
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
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/shadcn/card";
import { DataTable } from "@/components/shadcn/data-table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/shadcn/tabs";
import {
  EmbeddedSignupCancelled,
  useMetaEmbeddedSignup,
} from "@/features/communications/useMetaEmbeddedSignup";
import { DetailSkeleton } from "@/components/ui/skeletons";

/**
 * Meta's template review states. Anything unrecognised falls through to the
 * neutral outline badge rather than being mapped to a guess.
 */
const TEMPLATE_STATUS_TONE: Record<string, string> = {
  APPROVED: "bg-success/10 text-success border-success/30",
  PENDING: "bg-warning/10 text-warning border-warning/30",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/30",
  PAUSED: "bg-muted text-muted-foreground",
  DISABLED: "bg-muted text-muted-foreground",
};

function ConnectionDetail({
  label, value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function PlatformWhatsAppSetup() {
  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);
  const signup = useMetaEmbeddedSignup();
  const connectAccount = useConnectSystemWhatsAppAccount();
  const disconnectAccount = useDisconnectSystemWhatsAppAccount();

  const accountQuery = useQuery(getSystemWhatsAppAccountQueryOptions());
  const account = accountQuery.data?.data;
  const isConnected = Boolean(account?.phone_number_id);
  // A 404 only means nothing is linked yet.
  const loadFailed = accountQuery.isError && (accountQuery.error as unknown as ServerErrorResponse).statusCode !== 404;

  const templatesQuery = useQuery({
    ...getSystemWhatsAppTemplatesQueryOptions(),
    enabled: isConnected,
  });
  const templates = templatesQuery.data?.data.data ?? [];

  const handleConnect = async () => {
    try {
      const result = await signup.launch();
      await connectAccount.mutateAsync({
        data: {
          code: result.code,
          phone_number_id: result.phoneNumberId,
          business_account_id: result.businessAccountId,
        },
      });
      toast.success("WhatsApp number connected.");
    }
    catch (error) {
      if (error instanceof EmbeddedSignupCancelled)
        return;
      toast.error((error as { message?: string }).message || "Couldn't connect the WhatsApp number.");
    }
  };

  const handleDisconnect = () => {
    if (!account?.phone_number_id)
      return;
    disconnectAccount.mutate(
      { phoneNumberId: account.phone_number_id },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.success("WhatsApp number disconnected.");
        },
        onError: error => toast.error(error.message),
      },
    );
  };

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
            {!accountQuery.isLoading && !loadFailed && !isConnected
              && (
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
                      loading={signup.launching || connectAccount.isPending}
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
            {isConnected
              && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-success/10 text-success border-success/30">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Connected
                      </Badge>
                      {account?.webhook_subscribed_at && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Webhook active
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <ConnectionDetail
                        label="Display number"
                        value={account?.display_phone_number}
                      />
                      <ConnectionDetail
                        label="Verified name"
                        value={account?.verified_name}
                      />
                      <ConnectionDetail
                        label="Business name"
                        value={account?.business_name}
                      />
                      <ConnectionDetail
                        label="Phone number ID"
                        value={account?.phone_number_id}
                      />
                      <ConnectionDetail
                        label="Business account ID"
                        value={account?.business_account_id}
                      />
                      <ConnectionDetail
                        label="Connected"
                        value={account?.connected_at ? formatDateTime(account.connected_at) : undefined}
                      />
                    </div>

                    <div className="flex justify-end border-t border-border/50 pt-4">
                      <Button
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmOpen(true)}
                      >
                        <Link2Off className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Message Templates
            </CardTitle>
            <CardDescription>
              Templates approved by Meta. A template is required to open a
              conversation outside the 24-hour session window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "name",
                  accessorKey: "name",
                  header: "Template",
                  cell: ({ row }) => (
                    <span className="font-medium">{row.original.name || "—"}</span>
                  ),
                },
                {
                  id: "category",
                  accessorKey: "category",
                  header: "Category",
                  cell: ({ row }) => (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {row.original.category || "—"}
                    </Badge>
                  ),
                },
                {
                  id: "language",
                  accessorKey: "language",
                  header: "Language",
                  cell: ({ row }) => row.original.language || "—",
                },
                {
                  id: "status",
                  accessorKey: "status",
                  header: "Status",
                  cell: ({ row }) => {
                    const status = row.original.status || "";
                    return (
                      <Badge
                        variant="outline"
                        className={TEMPLATE_STATUS_TONE[status] ?? "text-xs"}
                      >
                        {status || "—"}
                      </Badge>
                    );
                  },
                },
              ]}
              data={templates}
              isLoading={templatesQuery.isLoading}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this WhatsApp number?</AlertDialogTitle>
            <AlertDialogDescription>
              Drivers will stop receiving WhatsApp messages from
              {" "}
              {account?.display_phone_number || "this number"}
              , and replies will no longer reach the Messaging Center.
              Reconnecting requires Meta&apos;s embedded signup again.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
