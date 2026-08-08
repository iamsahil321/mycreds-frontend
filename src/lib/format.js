export function formatInr(value, locale = 'en') {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
}

export function signedInr(value, locale) {
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatInr(value, locale)}`;
}
