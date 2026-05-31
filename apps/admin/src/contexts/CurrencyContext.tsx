import React, { createContext, useContext, useState, ReactNode } from "react";
import { Currency, CURRENCIES, DEFAULT_CURRENCY, formatCurrency, convertCurrency } from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  format: (amount: number, originalCurrency?: Currency) => string;
  convert: (amount: number, from: Currency) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  const format = (amount: number, originalCurrency: Currency = "NGN"): string => {
    const convertedAmount = convertCurrency(amount, originalCurrency, currency);
    return formatCurrency(convertedAmount, currency);
  };

  const convert = (amount: number, from: Currency): number => {
    return convertCurrency(amount, from, currency);
  };

  const symbol = CURRENCIES[currency].symbol;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, convert, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}



