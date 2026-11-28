import type { StockSelection } from "@truckmoov/api/auth/device-stock";
import { useQuery } from "@tanstack/react-query";
import { reviewOnboardingStock } from "@truckmoov/api/auth/device-stock";
import { useState } from "react";

export function useOnboardingStockReview(applicationId: string, enabled: boolean) {
  const [
    selections,
    setSelections,
  ] = useState<StockSelection[]>([]);
  const query = useQuery({
    queryKey: [
      "onboarding-stock-review",
      applicationId,
      selections,
    ],
    queryFn: () => reviewOnboardingStock(
      applicationId,
      selections,
    ),
    retry: false,
    enabled,
  });
  return {
    data: query.data, isError: query.isError, isPending: query.isPending, isFetching: query.isFetching, refetch: query.refetch, selections, setSelections,
  };
}
