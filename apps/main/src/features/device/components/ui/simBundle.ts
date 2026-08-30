import type { SimBundleValue } from "./SimBundlePicker";

export function formatSimBundle(v: SimBundleValue): string {
  return `${v.amount}${v.unit} / ${v.cycle}`;
}
