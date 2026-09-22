export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode: string = 'INR',
  symbol: string = '₹'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0;
  
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return `${symbol}${formatted}`;
  } catch {
    return `${symbol}${num.toFixed(2)}`;
  }
}

export function formatCompactNumber(num: number): string {
  if (Math.abs(num) >= 10000000) {
    return (num / 10000000).toFixed(1) + ' Cr';
  }
  if (Math.abs(num) >= 100000) {
    return (num / 100000).toFixed(1) + ' L';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toFixed(0);
}
