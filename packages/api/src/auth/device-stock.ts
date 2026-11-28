import { axiosInstance } from "../lib/axios-instance";
import { onboardingInstance } from "../lib/onboarding-instance";
import type { OnboardingOrder } from "./types";

export type StockModel = { id: string; manufacturer: string; model: string };
export type StockBuckets = { available: number; held: number; paid: number };
export type StockStatus = "Waiting for stock" | "Stock offered" | "Payment pending" | "Paid, ready to assign" | "Partially fulfilled" | "Fulfilled" | "Opted out";
export const STOCK_WAITLIST_STATUSES: StockStatus[] = [
  "Waiting for stock", "Stock offered", "Payment pending", "Paid, ready to assign", "Partially fulfilled", "Fulfilled", "Opted out",
];
export type StockWaitlistRow = {
  id: string; reference: string; organisation: string; manufacturer: string; model: string;
  requested: number; offered: number; paid: number; assigned: number; ready: number; waiting: number;
  joinedAt: string | null; emailStatus: "Pending" | "Sent" | "Failed" | null; optedOut: boolean; status: StockStatus;
};
export type StockOffer = {
  id: string; quantity: number; state: "held" | "paid" | "cancelled"; initialCheckout: boolean;
  amountKobo: number | null; createdAt: string; paidAt: string | null;
  emailStatus?: StockWaitlistRow["emailStatus"]; emailError?: string | null;
};
export type StockWaitlistDetail = StockWaitlistRow & {
  offers: StockOffer[]; paidUnits: { id: string; imei: string; offerId: string }[]; offerUrl: string;
};
export type ApplicationStockRow = StockWaitlistRow & { availableNow: number; offerUrl: string | null };

export type StockSelection = { requestId: string; modelId: string; quantity: number };
export type OnboardingStockReview = {
  fingerprint: string;
  order: OnboardingOrder;
  lines: (Omit<StockModel,"id"> & {
    modelId: string; requestId: string; requested: number; originalNow: number; waiting: number;
    alternativeKind: "models" | "manufacturers" | null;
    options: { modelId: string; manufacturer: string; model: string; available: number }[];
    replacements: { modelId: string; manufacturer: string; model: string; quantity: number }[];
  })[];
};

type Res<T> = { status: boolean; message: string; data: T };
const admin = "/auth/system/device-stock";
const publicStock = "/auth/device-stock";
const appStock = (id: string) => `/auth/onboarding/applications/${encodeURIComponent(id)}/device-stock`;
const encoded = encodeURIComponent;
const stockAuth = (token: string) => ({headers: {"X-Application-Token": token}});
const customerPath = (id: string) => `${publicStock}/offers/${encoded(id)}`;

export async function supportedStockModels() {
  return (await onboardingInstance.get<Res<StockModel[]>>(`${publicStock}/models`)).data.data;
}
export async function deviceStockSummary() {
  return (await axiosInstance.get<Res<{ totals: StockBuckets; models: (StockModel & StockBuckets)[] }>>(admin)).data.data;
}
export async function deviceInventoryModels() {
  return (await axiosInstance.get<Res<{ manufacturer: string; model: string; total: number; available: number }[]>>(`${admin}/models`)).data.data;
}
export async function getStockWaitlist() {
  return (await axiosInstance.get<Res<{ requests: StockWaitlistRow[]; counts: {
    customersWaiting: number; unitsStillNeeded: number; offersAwaitingPayment: number; paidReadyToAssign: number;
  } }>>(`${admin}/waitlist`)).data.data;
}
export async function stockWaitlistDetail(id: string) {
  return (await axiosInstance.get<Res<StockWaitlistDetail>>(`${admin}/waitlist/${encoded(id)}`)).data.data;
}
export async function assignPaidStock(id: string, deviceIds: string[]) {
  return (await axiosInstance.post<Res<StockWaitlistDetail>>(`${admin}/waitlist/${encoded(id)}/assign`, {deviceIds})).data.data;
}
export async function resendStockEmail(id: string, emailId: string) {
  await axiosInstance.post(`${admin}/waitlist/${encoded(id)}/resend`, {emailId});
}
export async function getApplicationStock(id: string) {
  return (await onboardingInstance.get<Res<ApplicationStockRow[]>>(appStock(id))).data.data;
}
export async function reviewOnboardingStock(id: string, selections: StockSelection[]) {
  const result = (await onboardingInstance.post<Res<OnboardingStockReview | null>>(`${appStock(id)}/review`, { selections })).data.data;
  if (result === null) return null;
  const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  if (!result || !/^[a-f0-9]{64}$/.test(result.fingerprint) || !count(result.order?.deviceCount)
    || !Number.isFinite(result.order.totalNgn) || !Array.isArray(result.lines) || !result.lines.length
    || !result.lines.every(line => count(line.requested) && count(line.originalNow) && count(line.waiting)
      && Array.isArray(line.options) && line.options.every(option => count(option.available))
      && Array.isArray(line.replacements) && line.replacements.every(item => count(item.quantity))
      && line.requested === line.originalNow + line.waiting + line.replacements.reduce((n, item) => n + item.quantity, 0))
    || result.order.deviceCount !== result.lines.reduce((n, line) => n + line.requested - line.waiting, 0)) {
    throw new Error("Inventory response could not be checked");
  }
  return result;
}
export async function joinApplicationStock(id: string) {
  return (await onboardingInstance.post<Res<ApplicationStockRow[]>>(`${appStock(id)}/join`)).data.data;
}
export async function getCustomerStock(id: string, token: string) {
  return (await onboardingInstance.get<Res<StockWaitlistRow & { offers: StockOffer[] }>>(customerPath(id), stockAuth(token))).data.data;
}
export async function payStockOffer(id: string, token: string, offerId: string, amountKobo: number) {
  return (await onboardingInstance.post<Res<{authorizationUrl: string}>>(`${customerPath(id)}/${encoded(offerId)}/checkout`,{amountKobo}, stockAuth(token))).data.data;
}
export async function verifyStockOffer(id: string, token: string) {
  return (await onboardingInstance.post<Res<Awaited<ReturnType<typeof getCustomerStock>>>>(`${customerPath(id)}/verify`,{}, stockAuth(token))).data.data;
}
export async function optOutStock(id: string, token: string) {
  return (await onboardingInstance.post<Res<Awaited<ReturnType<typeof getCustomerStock>>>>(`${customerPath(id)}/opt-out`,{}, stockAuth(token))).data.data;
}
