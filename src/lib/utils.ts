import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCompanyLogoUrl(domain: string | undefined | null): string | null {
  if (!domain) return null;
  return `https://logos.apistemic.com/${domain}`;
}
