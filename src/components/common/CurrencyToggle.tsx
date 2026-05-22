import React from 'react';
import { DollarSign, IndianRupee } from 'lucide-react';
import { useCurrencyStore, Currency } from '../../store/currencyStore';

const CurrencyToggle: React.FC = () => {
  const { currency, setCurrency } = useCurrencyStore();

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'INR' : 'USD');
  };

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-700 hover:text-purple-600"
      title={`Switch to ${currency === 'USD' ? 'INR' : 'USD'}`}
    >
      {currency === 'USD' ? (
        <>
          <DollarSign className="h-5 w-5" />
          <span className="font-medium">USD</span>
        </>
      ) : (
        <>
          <IndianRupee className="h-5 w-5" />
          <span className="font-medium">INR</span>
        </>
      )}
    </button>
  );
};

export default CurrencyToggle;
