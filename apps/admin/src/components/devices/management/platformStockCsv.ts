export const STOCK_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

export const STOCK_TEMPLATE_CSV = [
  "imei,manufacturer,model,name",
  "359990000000017,Teltonika,FMB920,STOCK-EXAMPLE-1",
  "359990000000025,Queclink,GV300,STOCK-EXAMPLE-2",
].join("\r\n");

/** Data rows in a stock CSV: non-blank lines after the header. */
export function countStockRows(text: string): number {
  const lines = text.replace(
    /^\uFEFF/,
    "",
  ).split(/\r?\n/).filter(line => line.trim() !== "");
  return Math.max(
    0,
    lines.length - 1,
  );
}
