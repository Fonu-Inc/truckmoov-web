import { Navigate } from "react-router-dom";

// Subscription invoices have moved into Organization Settings → Subscription tab.
export default function SubscriptionInvoices() {
  return <Navigate to="/settings?tab=subscription" replace />;
}



