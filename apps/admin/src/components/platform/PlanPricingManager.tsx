import { formatRelative } from "@truckmoov/app-core/utils/time-utils";
import {
  DollarSign,
  RefreshCw,
  Save,
  TrendingUp,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";

type DraftRow = {
  id: string;
  name: string;
  tier: string | null;
  billing_cycle: string;
  price_ngn: number;
  yearly_price_ngn: number;
};

export function PlanPricingManager() {
  const plans: any[] = [];
  const isLoading = false;
  const updatePlan = { mutateAsync: async (..._args: any[]) => {} };
  const rate = 0;
  const updatedAt: string | null = null;
  const fxLoading = false;
  const updateFx = {
    mutateAsync: async (..._args: any[]) => {},
    isPending: false,
  };

  const [
    fxDraft,
    setFxDraft,
  ] = useState<string>(String(rate));
  const [
    drafts,
    setDrafts,
  ] = useState<Record<string, DraftRow>>({});

  useEffect(
    () => setFxDraft(String(rate)),
    [rate],
  );

  useEffect(
    () => {
      if (!plans)
        return;
      const map: Record<string, DraftRow> = {};
      for (const p of plans) {
        map[p.id] = {
          id: p.id,
          name: p.name,
          tier: p.tier,
          billing_cycle: p.billing_cycle,
          price_ngn: Number(p.price_ngn ?? 0),
          yearly_price_ngn: Number(p.yearly_price_ngn ?? 0),
        };
      }
      setDrafts(map);
    },
    [plans],
  );

  const dirtyIds = useMemo(
    () => {
      if (!plans)
        return new Set<string>();
      const s = new Set<string>();
      for (const p of plans) {
        const d = drafts[p.id];
        if (!d)
          continue;
        if (Number(d.price_ngn) !== Number(p.price_ngn ?? 0) || Number(d.yearly_price_ngn) !== Number(p.yearly_price_ngn ?? 0)) {
          s.add(p.id);
        }
      }
      return s;
    },
    [
      drafts,
      plans,
    ],
  );

  const handleSaveRow = async (id: string) => {
    const d = drafts[id];
    if (!d)
      return;
    await updatePlan.mutateAsync({
      id,
      updates: {
        price_ngn: Number(d.price_ngn),
        yearly_price_ngn: Number(d.yearly_price_ngn),
      },
    });
  };

  const handleSaveFx = async () => {
    const n = Number(fxDraft);
    if (!Number.isFinite(n) || n <= 0)
      return;
    await updateFx.mutateAsync(n);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            USD ↔ NGN Exchange Rate
          </CardTitle>
          <CardDescription>
            Sets the conversion used when plan prices are toggled to USD on the onboarding subscription page.
            Update this whenever the official rate changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>1 USD =</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={fxDraft}
                  onChange={e => setFxDraft(e.target.value)}
                  className="w-40"
                  disabled={fxLoading}
                />
                <span className="text-sm text-muted-foreground">NGN</span>
              </div>
            </div>
            <Button
              onClick={handleSaveFx}
              disabled={updateFx.isPending || Number(fxDraft) === rate || !Number(fxDraft)}
            >
              {updateFx.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Update Rate
            </Button>
            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                Last updated
                {" "}
                {formatRelative(updatedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Subscription Plan Pricing
          </CardTitle>
          <CardDescription>
            Edit the monthly and yearly NGN price for each plan. USD equivalents are previewed using the rate above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
          {!isLoading && plans && plans.length === 0 && (
            <p className="text-sm text-muted-foreground">No subscription plans configured.</p>
          )}
          {plans?.map((p) => {
            const d = drafts[p.id];
            if (!d)
              return null;
            const isDirty = dirtyIds.has(p.id);
            const usdMonthly = rate > 0 ? d.price_ngn / rate : 0;
            const usdYearly = rate > 0 ? d.yearly_price_ngn / rate : 0;
            return (
              <div
                key={p.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.tier && (
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
                        {p.tier}
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="capitalize"
                    >
                      {p.billing_cycle}
                    </Badge>
                    {!p.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSaveRow(p.id)}
                    disabled={!isDirty || updatePlan.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Monthly Price (NGN)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={d.price_ngn}
                      onChange={e =>
                        setDrafts(prev => ({
                          ...prev,
                          [p.id]: {
                            ...prev[p.id],
                            price_ngn: Number(e.target.value),
                          },
                        }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ $
                      {usdMonthly.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 },
                      )}
                      {" "}
                      USD
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Yearly Price (NGN)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={d.yearly_price_ngn}
                      onChange={e =>
                        setDrafts(prev => ({
                          ...prev,
                          [p.id]: {
                            ...prev[p.id],
                            yearly_price_ngn: Number(e.target.value),
                          },
                        }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      ≈ $
                      {usdYearly.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 },
                      )}
                      {" "}
                      USD
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
