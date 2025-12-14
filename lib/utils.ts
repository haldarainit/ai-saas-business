import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertNumberToWords = (num: number, currency?: string): string => {
  const curr = currency || "INR";

  // Currency names mapping
  const currencyNames: { [key: string]: { major: string, minor: string } } = {
    'INR': { major: 'Rupees', minor: 'Paise' },
    'USD': { major: 'Dollars', minor: 'Cents' },
    'EUR': { major: 'Euros', minor: 'Cents' },
    'GBP': { major: 'Pounds', minor: 'Pence' },
    'JPY': { major: 'Yen', minor: 'Sen' },
    'CNY': { major: 'Yuan', minor: 'Fen' },
    'AUD': { major: 'Australian Dollars', minor: 'Cents' },
    'CAD': { major: 'Canadian Dollars', minor: 'Cents' },
    'CHF': { major: 'Swiss Francs', minor: 'Centimes' },
    'SGD': { major: 'Singapore Dollars', minor: 'Cents' },
    'AED': { major: 'Dirhams', minor: 'Fils' },
    'SAR': { major: 'Riyals', minor: 'Halalas' },
    'QAR': { major: 'Qatari Riyals', minor: 'Dirhams' },
    'KWD': { major: 'Kuwaiti Dinars', minor: 'Fils' },
    'BHD': { major: 'Bahraini Dinars', minor: 'Fils' },
    'OMR': { major: 'Omani Rials', minor: 'Baisa' },
    'MYR': { major: 'Malaysian Ringgit', minor: 'Sen' },
    'THB': { major: 'Thai Baht', minor: 'Satang' },
    'IDR': { major: 'Indonesian Rupiah', minor: 'Sen' },
    'PHP': { major: 'Philippine Pesos', minor: 'Centavos' },
    'VND': { major: 'Vietnamese Dong', minor: 'Hao' },
    'KRW': { major: 'South Korean Won', minor: 'Jeon' },
    'HKD': { major: 'Hong Kong Dollars', minor: 'Cents' },
    'NZD': { major: 'New Zealand Dollars', minor: 'Cents' },
    'ZAR': { major: 'South African Rand', minor: 'Cents' },
    'BRL': { major: 'Brazilian Reais', minor: 'Centavos' },
    'MXN': { major: 'Mexican Pesos', minor: 'Centavos' },
    'RUB': { major: 'Russian Rubles', minor: 'Kopecks' },
    'TRY': { major: 'Turkish Lira', minor: 'Kurus' },
  };

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  if (num === 0) {
    const names = currencyNames[curr] || { major: curr, minor: 'Cents' };
    return 'Zero ' + names.major + ' Only';
  }

  const absNum = Math.abs(num);
  const wholePart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - wholePart) * 100);

  const names = currencyNames[curr] || { major: curr, minor: 'Cents' };

  let result = numToWords(wholePart);

  if (!result) result = 'Zero';
  result += ' ' + names.major;

  if (decimalPart > 0) {
    result += ' and ' + numToWords(decimalPart) + ' ' + names.minor;
  }

  return result + ' Only';
};

