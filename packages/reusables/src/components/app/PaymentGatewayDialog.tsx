import { CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

// ─── Payment context ──────────────────────────────────────────────────────────
// Add a new variant here to support a new payment use case.

export type PaymentContext =
  | { type: "subscription"; planName: string; billingCycle: "monthly" | "yearly" }
  | { type: "invoice"; invoiceRef: string }

// ─── Callback types ───────────────────────────────────────────────────────────

export type PaymentInitiateParams = {
  gateway: "paystack" | "momo"
  phone?: string
}

export type PaymentIntentResult = {
  authorizationUrl?: string
  ussdString?: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaymentGatewayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: PaymentContext
  /** Called when the user submits. Return the result from the payment intent endpoint. */
  onPay: (params: PaymentInitiateParams) => Promise<PaymentIntentResult>
}

// ─── Internal ─────────────────────────────────────────────────────────────────

type FormValues = {
  gateway: "paystack" | "momo"
  phone: string
}

const GATEWAYS = [
  {
    value: "paystack" as const,
    label: "Card payment",
    description: "Pay securely with your debit or credit card via Paystack",
    icon: CreditCard,
  },
  {
    value: "momo" as const,
    label: "Mobile Money (MoMo)",
    description: "Pay with MTN MoMo via USSD push",
    icon: Smartphone,
  },
]

function contextText(ctx: PaymentContext): { title: string; description: string } {
  if (ctx.type === "subscription") {
    return {
      title: `Pay for ${ctx.planName}`,
      description: `Choose how you'd like to pay for your ${ctx.billingCycle} subscription.`,
    }
  }
  return {
    title: `Pay invoice ${ctx.invoiceRef}`,
    description: "Choose how you'd like to settle this invoice.",
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentGatewayDialog({
  open,
  onOpenChange,
  context,
  onPay,
}: PaymentGatewayDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ussdResult, setUssdResult] = useState<string | null>(null)

  const form = useForm<FormValues>({
    defaultValues: { gateway: "paystack", phone: "" },
  })

  const gateway = form.watch("gateway")
  const { title, description } = contextText(context)

  const handleClose = (v: boolean) => {
    if (isPending) return
    onOpenChange(v)
    if (!v) {
      form.reset()
      setError(null)
      setUssdResult(null)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setIsPending(true)
    try {
      const result = await onPay({
        gateway: values.gateway,
        phone: values.gateway === "momo" ? values.phone : undefined,
      })
      if (values.gateway === "paystack" && result.authorizationUrl) {
        window.location.href = result.authorizationUrl
      } else if (values.gateway === "momo" && result.ussdString) {
        setUssdResult(result.ussdString)
      }
    } catch {
      setError("Failed to initiate payment. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {ussdResult ? (
          <div className="mt-2 space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-5 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-sm font-semibold text-foreground">
                Dial this USSD code to complete payment
              </p>
              <div className="rounded-lg border border-border bg-muted px-5 py-3">
                <p className="font-mono text-lg font-bold tracking-widest text-foreground">
                  {ussdResult}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Once you complete the USSD prompt on your phone, your payment will be confirmed
                automatically.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GATEWAYS.map((option) => {
                  const Icon = option.icon
                  const isSelected = gateway === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("gateway", option.value)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </button>
                  )
                })}
              </div>

              {gateway === "momo" && (
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{
                    validate: (val) =>
                      !val || val.trim().length < 7
                        ? "Enter a valid phone number"
                        : true,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MTN phone number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+234 800 000 0000"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {gateway === "paystack" ? "Pay with card" : "Get USSD code"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
