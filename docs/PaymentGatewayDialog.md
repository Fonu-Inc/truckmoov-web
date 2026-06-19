# PaymentGatewayDialog

A reusable payment dialog that handles gateway selection (Paystack card or MTN MoMo USSD), loading state, and post-payment outcomes. It lives in `@truckmoov/reusables` and has no dependency on `@truckmoov/api` — you bring the API call.

## How it works

1. The user picks a gateway — **Card (Paystack)** or **Mobile Money (MoMo)**
2. If MoMo is selected, a phone number field appears
3. On submit the dialog calls your `onPay` callback with `{ gateway, phone? }`
4. **Paystack:** your callback should return `{ authorizationUrl }` — the dialog redirects the user to Paystack's hosted checkout page
5. **MoMo:** your callback should return `{ ussdString }` — the dialog shows the USSD code for the user to dial; your backend webhook handles confirmation

## Props

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Called when the dialog should open or close |
| `context` | `PaymentContext` | Determines the dialog title/description (see below) |
| `onPay` | `(params: PaymentInitiateParams) => Promise<PaymentIntentResult>` | Your async function that calls the payment intent endpoint |

## PaymentContext

A discriminated union. Add a new member here to support a new payment use case — the dialog title and description will update accordingly, and the gateway UI stays the same.

```ts
type PaymentContext =
  | { type: "subscription"; planName: string; billingCycle: "monthly" | "yearly" }
  | { type: "invoice"; invoiceRef: string }
```

To add a new type, extend the union in `PaymentGatewayDialog.tsx` and add a branch in the `contextText()` function.

## onPay callback

```ts
type PaymentInitiateParams = {
  gateway: "paystack" | "momo"
  phone?: string  // only present when gateway is "momo"
}

type PaymentIntentResult = {
  authorizationUrl?: string  // returned by Paystack
  ussdString?: string        // returned by MoMo
}
```

The dialog manages its own loading/error state around this callback — you don't need to handle that in the parent. If the promise rejects, an inline error message is shown.

## Usage

### Subscription payment (apps/main)

```tsx
import { PaymentGatewayDialog } from "@truckmoov/reusables/components/app/PaymentGatewayDialog"
import { useCreatePaymentIntent } from "@truckmoov/api/auth"

function MyPage() {
  const [open, setOpen] = useState(false)
  const paymentMutation = useCreatePaymentIntent()

  return (
    <>
      <Button onClick={() => setOpen(true)}>Pay & Activate</Button>

      <PaymentGatewayDialog
        open={open}
        onOpenChange={setOpen}
        context={{ type: "subscription", planName: "Professional", billingCycle: "monthly" }}
        onPay={({ gateway, phone }) =>
          paymentMutation
            .mutateAsync({ data: { planCode: "PRO", billingCycle: "monthly", gateway, phone } })
            .then((res) => res.data)
        }
      />
    </>
  )
}
```

### Invoice payment (future example)

```tsx
<PaymentGatewayDialog
  open={open}
  onOpenChange={setOpen}
  context={{ type: "invoice", invoiceRef: "INV-00123" }}
  onPay={({ gateway, phone }) =>
    payInvoice({ invoiceId, gateway, phone }).then((res) => res.data)
  }
/>
```

## Adding a new payment use case

1. Add a new member to the `PaymentContext` union in `PaymentGatewayDialog.tsx`
2. Add a matching `if` branch in the `contextText()` function for the title and description
3. Create an `onPay` callback in your page that calls the relevant API endpoint and returns `{ authorizationUrl? , ussdString? }`

The gateway selection UI, phone input, loading state, USSD display, and Paystack redirect are all handled by the dialog — you only need to provide the API call.
