"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplicationStock, joinApplicationStock } from "@truckmoov/api/auth/device-stock";

export function OnboardingStockBreakdown({ applicationId, paid, zero, hideRows = false }: { applicationId: string; paid: boolean; zero: boolean; hideRows?: boolean }) {
  const qc=useQueryClient();
  const key=["application-device-stock",applicationId];
  const {data:rows,isError,isPending,refetch}=useQuery({queryKey:key,queryFn:()=>getApplicationStock(applicationId),retry:false});
  const join=useMutation({mutationFn:()=>joinApplicationStock(applicationId),onSuccess:()=>qc.invalidateQueries({queryKey:key})});
  if(zero&&isPending) return <p role="status">Checking device stock…</p>;
  if(zero&&isError) return <p role="alert">Could not check device stock. <button type="button" className="underline" onClick={()=>void refetch()}>Retry</button></p>;
  if(!rows?.length) return zero ? <p>No devices are available for payment yet.</p> : null;
  const joined=rows.some(r=>r.joinedAt);
  return <section className="space-y-3 rounded-lg border bg-card p-4 text-sm" aria-label="Device stock">
    {!hideRows && <h3 className="font-semibold">Device stock by model</h3>}
    {!hideRows && rows.map(r=><div key={r.id} className="space-y-1 border-b pb-3 last:border-0">
      <p className="font-medium">{r.manufacturer} {r.model}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
        <span>Requested: {r.requested}</span>
        <span>{paid?"Paid":"Available now"}: {paid?r.paid:r.availableNow}</span>
        <span>Waitlisted: {r.waiting}</span>
      </div>
      {r.waiting>0&&<p className="text-muted-foreground">Waitlisted units are not charged today.</p>}
      {joined&&r.offerUrl&&r.offered>0&&(paid||zero)&&<a href={r.offerUrl} className="font-medium underline">Review stock offers</a>}
    </div>)}
    {zero&&!paid&&!joined&&<div className="space-y-2">
      <p>No devices are available for payment. We’ll email you when your selected model is available.</p>
      <button type="button" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        disabled={join.isPending} onClick={()=>join.mutate()}>{join.isPending?"Joining…":"Join waitlist"}</button>
      {join.isError&&<p role="alert" className="text-destructive">Could not join the waitlist. Try again.</p>}
    </div>}
    {zero&&joined&&!paid&&<p>You're on the waitlist. We’ll email you when stock can be offered.</p>}
  </section>;
}
