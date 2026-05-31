export type Currency = 'NGN' | 'USD';

export const CURRENCIES: Record<Currency, { symbol: string; name: string; code: Currency }> = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', code: 'NGN' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
};

export const DEFAULT_CURRENCY: Currency = 'NGN';

// Exchange rate (1 USD = X NGN) - In production, this would come from an API
const EXCHANGE_RATES: Record<string, number> = {
  'USD_NGN': 1550,
  'NGN_USD': 1 / 1550,
};

export function formatCurrency(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  const { symbol } = CURRENCIES[currency];
  return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  
  const rateKey = `${from}_${to}`;
  const rate = EXCHANGE_RATES[rateKey] || 1;
  return amount * rate;
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}



