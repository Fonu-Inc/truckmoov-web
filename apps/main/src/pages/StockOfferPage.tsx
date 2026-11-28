import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomerStock, optOutStock, payStockOffer, verifyStockOffer, type StockOffer } from "@truckmoov/api/auth/device-stock";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/shadcn/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/shadcn/alert-dialog";

const currency = (kobo: number) => new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(kobo/100);
const message = (error: unknown) => (error as {message?:string})?.message ?? "Please try again.";

export default function StockOfferPage() {
  const {requestId=""}=useParams();
  const storageKey=`tm-stock-offer-${requestId}`;
  const [token]=useState(()=>{
    const link=new URLSearchParams(location.hash.slice(1)).get("token");
    if(link) sessionStorage.setItem(storageKey,link);
    return link??sessionStorage.getItem(storageKey)??"";
  });
  const [confirm,setConfirm]=useState(false);
  const [selectedOffer,setSelectedOffer]=useState<StockOffer>();
  const qc=useQueryClient();
  const key=["customer-stock",requestId];
  const view=useQuery({queryKey:key,enabled:!!token,gcTime:0,queryFn:()=>getCustomerStock(requestId,token),refetchInterval:10_000,retry:false});
  const checkout=useMutation({mutationFn:(offer:StockOffer)=>payStockOffer(requestId,token,offer.id,offer.amountKobo!),
    onSuccess:data=>location.assign(data.authorizationUrl)});
  const verify=useMutation({mutationFn:()=>verifyStockOffer(requestId,token),onSuccess:r=>qc.setQueryData(key,r)});
  const optOut=useMutation({mutationFn:()=>optOutStock(requestId,token),onSuccess:r=>{qc.setQueryData(key,r);setConfirm(false);}});
  useEffect(()=>{
    if(!token) return;
    if(location.hash) history.replaceState(null,"",location.pathname+location.search);
    if(new URLSearchParams(location.search).has("reference")) verify.mutate();
    // Only verify on arrival from the payment provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[token]);
  const data=view.data;
  return <main className="mx-auto min-h-screen max-w-2xl space-y-5 px-5 py-10" aria-label="Device stock offer">
    <h1 className="text-2xl font-semibold">Device stock offer</h1>
    {!token&&<p role="alert">Open the full link in your TruckMoov stock email.</p>}
    {token&&view.isPending&&<p role="status">Loading stock offer…</p>}
    {view.isError&&<p role="alert">{message(view.error)}</p>}
    {data&&<>
      <section className="space-y-2 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">{data.manufacturer} {data.model}</h2>
        <p className="text-sm text-muted-foreground">{data.organisation} · {data.reference}</p>
        <p className="text-sm">Requested: {data.requested} · Still waitlisted: {data.waiting}</p>
        {data.ready>0&&<p role="status" className="text-sm font-medium">Payment confirmed for {data.ready} unit(s). Your devices are awaiting assignment.</p>}
        {data.optedOut&&<p role="status" className="text-sm">You opted out of the waitlist. Paid units are unaffected.</p>}
      </section>
      {data.offers.filter(o=>o.state!=="cancelled").map(o=><section key={o.id} className="space-y-3 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">{o.quantity} unit(s) · {o.state==="paid"?"Paid":"Available in this offer"}</h2>
        {o.amountKobo!=null&&o.amountKobo>0&&<p>Batch total: {currency(o.amountKobo)}</p>}
        {o.state==="held"&&o.amountKobo==null&&<p className="text-sm text-muted-foreground">This offer is not ready for payment yet.</p>}
        {o.state==="held"&&o.amountKobo!=null&&o.amountKobo>0&&!data.optedOut&&<Button onClick={()=>setSelectedOffer(o)}>Review offer and pay</Button>}
      </section>)}
      {!data.offers.length&&!data.optedOut&&<p className="text-sm text-muted-foreground">We’ll email you when your selected devices are available.</p>}
      <div className="flex flex-wrap gap-3">
        {data.offers.some(o=>o.state==="held")&&<Button variant="outline" disabled={verify.isPending} onClick={()=>verify.mutate()}>Check payment status</Button>}
        {!data.optedOut&&(data.waiting>0||data.offered>0)&&<Button variant="outline" onClick={()=>setConfirm(true)}>Opt out of waitlist</Button>}
      </div>
      {verify.isError&&<p role="alert" className="text-sm text-destructive">{message(verify.error)}</p>}
    </>}
    <AlertDialog open={confirm} onOpenChange={setConfirm}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Opt out of this waitlist?</AlertDialogTitle>
        <AlertDialogDescription>Your unpaid holds will be released. This does not cancel or change any paid units.</AlertDialogDescription>
      </AlertDialogHeader>
      {optOut.isError&&<p role="alert" className="text-sm text-destructive">{message(optOut.error)}</p>}
      <AlertDialogFooter><AlertDialogCancel>Keep my place</AlertDialogCancel>
        <AlertDialogAction disabled={optOut.isPending} onClick={e=>{e.preventDefault();optOut.mutate();}}>Opt out</AlertDialogAction>
      </AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!selectedOffer} onOpenChange={open=>{if(!open){setSelectedOffer(undefined);checkout.reset();}}}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Review this batch</AlertDialogTitle>
        <AlertDialogDescription>{selectedOffer&&`${selectedOffer.quantity} unit(s) for ${currency(selectedOffer.amountKobo??0)}. Other waitlisted units won’t be charged.`}</AlertDialogDescription>
      </AlertDialogHeader>
      {checkout.isError&&<p role="alert" className="text-sm text-destructive">{message(checkout.error)}</p>}
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction disabled={checkout.isPending} onClick={e=>{e.preventDefault();if(selectedOffer) checkout.mutate(selectedOffer);}}>Continue to payment</AlertDialogAction>
      </AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </main>;
}
