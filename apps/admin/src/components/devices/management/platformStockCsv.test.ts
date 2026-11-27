import {
  describe, expect, it,
} from "vitest";
import {
  countStockRows, STOCK_TEMPLATE_CSV,
} from "./platformStockCsv";

describe(
  "countStockRows",
  () => {
    it(
      "counts data rows and tolerates BOM, CRLF and blank lines",
      () => {
        expect(countStockRows("﻿imei,manufacturer,model\r\n1,a,b\r\n\r\n2,c,d\r\n")).toBe(2);
      },
    );
    it(
      "is zero for empty or header-only input",
      () => {
        expect(countStockRows("")).toBe(0);
        expect(countStockRows("imei,manufacturer,model\n")).toBe(0);
      },
    );
    it(
      "counts the template's two example rows",
      () => {
        expect(countStockRows(STOCK_TEMPLATE_CSV)).toBe(2);
      },
    );
  },
);
