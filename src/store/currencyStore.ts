import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'INR';

interface CurrencyState {
  currency: Currency;
  exchangeRate: number; // USD to INR rate
  setCurrency: (currency: Currency) => void;
  updateExchangeRate: (rate: number) => void;
  convertPrice: (priceInUSD: number, targetCurrency?: Currency) => number;
  formatPrice: (priceInUSD: number, targetCurrency?: Currency) => string;
}

// Default exchange rate: 1 USD = 83 INR (approximate)
const DEFAULT_EXCHANGE_RATE = 83;

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      exchangeRate: DEFAULT_EXCHANGE_RATE,

      setCurrency: (currency: Currency) => {
        set({ currency });
      },

      updateExchangeRate: (rate: number) => {
        set({ exchangeRate: rate });
      },

      convertPrice: (priceInUSD: number, targetCurrency?: Currency) => {
        const { currency, exchangeRate } = get();
        const currencyToUse = targetCurrency || currency;
        
        if (currencyToUse === 'INR') {
          return priceInUSD * exchangeRate;
        }
        return priceInUSD;
      },

      formatPrice: (priceInUSD: number, targetCurrency?: Currency) => {
        const { currency, exchangeRate } = get();
        const currencyToUse = targetCurrency || currency;
        const convertedPrice = get().convertPrice(priceInUSD, currencyToUse);
        
        if (currencyToUse === 'INR') {
          return `₹${convertedPrice.toFixed(2)}`;
        }
        return `$${priceInUSD.toFixed(2)}`;
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);
