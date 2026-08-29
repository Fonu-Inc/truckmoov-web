import { TenantWalletManagement } from "@/features/settings/components/ui/TenantWalletManagement";
import { WalletTransactionHistory } from "@/features/settings/components/ui/WalletTransactionHistory";

export default function BillingWalletPage() {
  return (
    <div className="space-y-6">
      <TenantWalletManagement />
      <WalletTransactionHistory />
    </div>
  );
}
