/**
 * Currency utility functions for multi-currency support
 */

export type Currency = 'USD' | 'INR';

// Default exchange rate: 1 USD = 83 INR (can be updated via API)
export const DEFAULT_EXCHANGE_RATE = 83;

/**
 * Convert price from USD to target currency
 */
export const convertPrice = (
  priceInUSD: number,
  targetCurrency: Currency,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number => {
  if (targetCurrency === 'INR') {
    return priceInUSD * exchangeRate;
  }
  return priceInUSD;
};

/**
 * Convert price from any currency to USD
 */
export const convertToUSD = (
  price: number,
  fromCurrency: Currency,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number => {
  if (fromCurrency === 'INR') {
    return price / exchangeRate;
  }
  return price;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (
  priceInUSD: number,
  currency: Currency,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): string => {
  const convertedPrice = convertPrice(priceInUSD, currency, exchangeRate);
  
  if (currency === 'INR') {
    return `₹${convertedPrice.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  
  return `$${priceInUSD.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return currency === 'INR' ? '₹' : '$';
};

/**
 * Fetch live exchange rate from API (optional)
 * You can integrate with APIs like exchangerate-api.com or fixer.io
 */
export const fetchExchangeRate = async (): Promise<number> => {
  try {
    // Example API call (replace with actual API)
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // return data.rates.INR;
    
    // For now, return default rate
    return DEFAULT_EXCHANGE_RATE;
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return DEFAULT_EXCHANGE_RATE;
  }
};
