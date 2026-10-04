import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export function getPreferredLocaleName(
  locales?: Array<{ id?: string; name: string; locale: string }>
): string {
  if (!locales || locales.length === 0) return '';
  const en = locales.find((l) => l.locale?.toLowerCase() === 'en');
  if (en && en.name) return en.name;
  const km = locales.find((l) => l.locale?.toLowerCase() === 'km');
  if (km && km.name) return km.name;
  return locales[0]?.name || '';
}

const IMAGE_CDN_BASE =
  process.env.NEXT_PUBLIC_IMAGE_CDN_BASE ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://dpf2qzuuuuuuura3cphb.cloudfront.net';

export function formatImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanBase = IMAGE_CDN_BASE.endsWith('/') ? IMAGE_CDN_BASE.slice(0, -1) : IMAGE_CDN_BASE;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `${cleanBase}/${cleanPath}`;
}


