import { Navigate } from "react-router";

// Subscription invoices have moved into Organization Settings → Subscription tab.
export default function SubscriptionInvoices() {
  return (
    <Navigate
      to="/settings/subscription/invoices"
      replace
    />
  );
}
