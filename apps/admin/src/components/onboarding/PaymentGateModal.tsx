import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcn/tabs";
import { CreditCard, Smartphone, Loader2, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Method = "card" | "momo";
type Stage = "select" | "processing" | "confirmed";

interface PaymentGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amountLabel: string;
  onConfirmed: () => void;
}

export function PaymentGateModal({
  open,
  onOpenChange,
  planName,
  amountLabel,
  onConfirmed,
}: PaymentGateModalProps) {
  const [method, setMethod] = useState<Method>("card");
  const [stage, setStage] = useState<Stage>("select");

  // Card
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // MoMo
  const [momoNumber, setMomoNumber] = useState("");

  useEffect(() => {
    if (open) {
      setStage("select");
      setMethod("card");
    }
  }, [open]);

  const cardValid =
    cardName.trim().length > 1 &&
    cardNumber.replace(/\s/g, "").length >= 12 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvc.length >= 3;

  const momoValid = /^(\+?234|0)[789]\d{9}$/.test(momoNumber.replace(/\s/g, ""));

  const canPay = method === "card" ? cardValid : momoValid;

  const handlePay = async () => {
    setStage("processing");
    await new Promise((r) => setTimeout(r, method === "momo" ? 1600 : 1200));
    setStage("confirmed");
  };

  const handleContinue = () => {
    onOpenChange(false);
    onConfirmed();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => stage !== "processing" && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        {stage === "confirmed" ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="rounded-full bg-success/10 p-3 mb-3">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle>Payment confirmed</DialogTitle>
              <DialogDescription>
                Your {planName} plan is now active. You can move on to the next step.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 w-full rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Plan</span>
                <span className="font-medium text-foreground">{planName}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Amount</span>
                <span className="font-medium text-foreground">{amountLabel}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Method</span>
                <span className="font-medium text-foreground capitalize">
                  {method === "momo" ? "MTN MoMo" : "Card"}
                </span>
              </div>
            </div>
            <Button onClick={handleContinue} className="mt-5 w-full">
              Continue to next step
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete payment</DialogTitle>
              <DialogDescription>
                {planName} — <span className="font-medium text-foreground">{amountLabel}</span>
              </DialogDescription>
            </DialogHeader>

            <Tabs value={method} onValueChange={(v) => setMethod(v as Method)} className="mt-2">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="card" disabled={stage === "processing"}>
                  <CreditCard className="h-4 w-4 mr-2" /> Card
                </TabsTrigger>
                <TabsTrigger value="momo" disabled={stage === "processing"}>
                  <Smartphone className="h-4 w-4 mr-2" /> MTN MoMo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardName">Cardholder name</Label>
                  <Input
                    id="cardName"
                    placeholder="Name on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    disabled={stage === "processing"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(.{4})/g, "$1 ")
                          .trim()
                      )
                    }
                    disabled={stage === "processing"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                      }}
                      disabled={stage === "processing"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      inputMode="numeric"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      disabled={stage === "processing"}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="momo" className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="momoNumber">MTN number</Label>
                  <Input
                    id="momoNumber"
                    inputMode="tel"
                    placeholder="0803 123 4567"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    disabled={stage === "processing"}
                  />
                  <p className={cn("flex items-start gap-1.5 text-[11px] text-muted-foreground")}>
                    <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    A USSD prompt will be sent to this number for confirmation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handlePay}
              disabled={!canPay || stage === "processing"}
              className="mt-4 w-full"
              size="lg"
            >
              {stage === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {method === "momo" ? "Awaiting USSD confirmation..." : "Processing payment..."}
                </>
              ) : (
                <>Pay {amountLabel}</>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}



