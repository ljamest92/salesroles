import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use the <CompanyLogo domain={...} name={...} /> component directly.
 * The component is the single source of truth for logo URLs and fallback rendering.
 */
export function getCompanyLogoUrl(domain: string | undefined | null): string | null {
  if (!domain) return null;
  return `https://logos.apistemic.com/${domain}`;
}
