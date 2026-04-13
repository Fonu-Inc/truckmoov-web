import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  LinkIcon,
  MessageSquare,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { axiosInstance, ServerSuccessResponse } from "@/shared/utils/axios-instance";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface WhatsAppSettings {
  phoneNumberId: string;
  businessAccountId: string;
}

type SignupFinishPayload = {
  type: "WA_EMBEDDED_SIGNUP";
  event: "FINISH" | "CANCEL" | "ERROR";
  data: {
    phone_number_id?: string;
    waba_id?: string;
    current_step?: string;
    error_message?: string;
  };
};

const FB_ORIGINS = ["https://www.facebook.com", "https://web.facebook.com"];

function isEmptyObject(value: unknown) {
  return Boolean(value && typeof value === "object" && Object.keys(value as object).length === 0);
}

export function WhatsAppBusinessSetupMain() {
  const { user } = useAuthStore();
  const accountEnabled = user?.accountStatus === "enabled";

  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const signupFinishDataRef = useRef<SignupFinishPayload | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<ServerSuccessResponse<Partial<WhatsAppSettings> | Record<string, never>>>(
        "/notify/whatsapp/settings",
      );
      const data = response.data?.data ?? {};
      if (isEmptyObject(data) || !data.phoneNumberId) {
        setWhatsAppSettings(null);
        return;
      }
      setWhatsAppSettings({
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: import.meta.env.VITE_PUBLIC_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: import.meta.env.VITE_PUBLIC_META_API_VERSION,
      });
    };

    if (!(window as any).FB) {
      const existingScript = document.getElementById("facebook-jssdk");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (!FB_ORIGINS.includes(event.origin)) return;
      try {
        const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (payload.event === "FINISH") {
          signupFinishDataRef.current = payload as SignupFinishPayload;
        } else if (payload.event === "CANCEL") {
          toast.message("Signup cancelled", {
            description: payload?.data?.current_step ? `Stopped at ${payload.data.current_step}.` : "Signup was cancelled.",
          });
        } else if (payload.event === "ERROR") {
          toast.error("Signup error", {
            description: payload?.data?.error_message ?? "Facebook returned an error during signup.",
          });
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const launchWhatsAppSignup = () => {
    if (!accountEnabled) {
      toast.error("Account not enabled", { description: "Enable the account before connecting WhatsApp." });
      return;
    }

    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost";
      if (window.location.protocol !== "https:" && !isLocalhost) {
        toast.error("Secure connection required", {
          description: "Meta Embedded Signup requires HTTPS. Use HTTPS or localhost to continue.",
        });
        return;
      }
    }

    const fb = (window as any).FB;
    if (!fb) {
      toast.error("Facebook SDK not ready", { description: "Please wait a moment and try again." });
      return;
    }

    setIsConnecting(true);
    try {
      fb.login(
        (resp: any) => {
          setIsConnecting(false);
          if (resp?.status === "connected" && resp?.authResponse?.code) {
            const code = resp.authResponse.code;
            const finishData = signupFinishDataRef.current;
            if (!finishData?.data?.phone_number_id || !finishData?.data?.waba_id) {
              toast.error("Missing signup data", { description: "Please complete the signup flow again." });
              return;
            }

            void (async () => {
              try {
                await axiosInstance.post<ServerSuccessResponse<WhatsAppSettings>>("/notify/whatsapp/settings", {
                  phoneNumberId: finishData.data.phone_number_id,
                  businessId: finishData.data.waba_id,
                  code,
                });
                signupFinishDataRef.current = null;
                await fetchSettings();
              } catch {
                toast.error("Failed to save WhatsApp settings");
              }
            })();
          } else {
            toast.error("WhatsApp login failed", { description: "Unable to retrieve auth code." });
          }
        },
        {
          config_id: import.meta.env.VITE_PUBLIC_WHATSAPP_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            version: import.meta.env.VITE_PUBLIC_WHATSAPP_CONFIG_VERSION,
            setup: {
              solutionID: null,
              business: {},
              phone: {},
              preVerifiedPhone: {},
              whatsAppBusinessAccount: {},
            },
          },
        },
      );
    } catch (error) {
      setIsConnecting(false);
      toast.error("WhatsApp login failed", { description: "Unable to open the Meta signup flow." });
    }
  };

  const handleDisconnect = async () => {
    if (!whatsAppSettings?.phoneNumberId) return;
    setIsDisconnecting(true);
    try {
      await axiosInstance.delete(`/notify/whatsapp/settings/${whatsAppSettings.phoneNumberId}`);
      setWhatsAppSettings(null);
      toast.success("Disconnected successfully");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
      setDisconnectOpen(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = Boolean(whatsAppSettings?.phoneNumberId);

  return (
    <div className="space-y-6">
      {!accountEnabled && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your account status is not enabled. Enable the account before connecting WhatsApp.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-xl", isConnected ? "bg-success/20" : "bg-muted")}
              >
                <MessageSquare className={cn("h-6 w-6", isConnected ? "text-success" : "text-muted-foreground")} />
              </div>
              <div>
                <CardTitle>WhatsApp Business Connection</CardTitle>
                <CardDescription>Connect your WhatsApp Business account to start messaging.</CardDescription>
              </div>
            </div>
            {isConnected ? (
              <Badge className="bg-success/20 text-success border-success/30 gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <AlertDescription className="text-sm">
                  Connect your WhatsApp Business account using Meta Embedded Signup.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-success/20 to-success/5 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-success" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Start the embedded signup flow to connect your WhatsApp Business number.
                </p>
                <Button
                  onClick={launchWhatsAppSignup}
                  disabled={isConnecting || !accountEnabled}
                  className="gap-2"
                >
                  {isConnecting ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Connect with WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Business ID</p>
                  <p className="text-sm font-medium">{whatsAppSettings?.businessAccountId || "N/A"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Phone Number ID</p>
                  <p className="text-sm font-medium">{whatsAppSettings?.phoneNumberId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted/20 p-4 text-center">
                  <p className="text-2xl font-semibold">00</p>
                  <p className="text-xs text-muted-foreground">Messages sent today</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-4 text-center">
                  <p className="text-2xl font-semibold">00</p>
                  <p className="text-xs text-muted-foreground">Messages received</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-4 text-center">
                  <p className="text-2xl font-semibold">00</p>
                  <p className="text-xs text-muted-foreground">Automated replies</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={fetchSettings} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="destructive" onClick={() => setDisconnectOpen(true)} className="gap-2">
                  <Unlink className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect WhatsApp?</DialogTitle>
            <DialogDescription>
              This will remove the WhatsApp connection for this tenant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDisconnecting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDisconnect} isLoading={isDisconnecting}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default WhatsAppBusinessSetupMain;
