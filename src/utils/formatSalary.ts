/**
 * Formats a salary value for display.
 * - Already-formatted strings ("$135k - $155k", "$100k") pass through unchanged.
 * - Raw numbers (165202, 165) are converted to "$165k" or "$165k".
 * - null / undefined / empty returns "Not specified".
 */
export function formatSalary(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Not specified'

  const str = String(value).trim()
  if (!str || str === 'Salary Not Disclosed') return 'Salary Not Disclosed'

  // Already formatted — contains a dollar sign and a k/K marker, or a dash range
  if (/\$/.test(str) && (/k/i.test(str) || /-/.test(str))) return str

  // Try to parse as a plain number
  const num = parseFloat(str.replace(/[,$]/g, ''))
  if (isNaN(num)) return str // Return original if we can't parse

  // Convert to $Xk format
  if (num >= 1000) return `$${Math.round(num / 1000)}k`
  return `$${Math.round(num)}k`
}

export function getCurrency(salary: string | number, location?: string): string {
  const s = String(salary);
  if (s.includes('£')) return 'GBP';
  if (s.includes('€')) return 'EUR';
  if (s.includes('A$') || s.includes('AU$')) return 'AUD';
  if (s.includes('NZ$')) return 'NZD';
  if (s.includes('CA$') || s.includes('CAD')) return 'CAD';
  if (s.includes('S$') || s.includes('SGD')) return 'SGD';
  if (s.includes('¥')) return 'JPY';
  if (s.includes('₹')) return 'INR';
  if (s.includes('R$')) return 'BRL';
  if (s.includes('$')) return 'USD';

  const loc = (location || '').toLowerCase();
  if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london') || loc.includes('england') || loc.includes('scotland') || loc.includes('wales')) return 'GBP';
  if (loc.includes('australia') || loc.includes(' au') || loc.includes('sydney') || loc.includes('melbourne') || loc.includes('brisbane')) return 'AUD';
  if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver')) return 'CAD';
  if (loc.includes('europe') || loc.includes('germany') || loc.includes('france') || loc.includes('netherlands') || loc.includes('spain') || loc.includes('italy')) return 'EUR';
  if (loc.includes('new zealand') || loc.includes('auckland')) return 'NZD';
  if (loc.includes('singapore')) return 'SGD';

  return 'USD';
}

/**
 * Formats a base + OTE pair for display.
 */
export function formatOTE(base: number | string | null | undefined, ote: number | string | null | undefined): string {
  const formattedBase = formatSalary(base)
  const formattedOte = formatSalary(ote)

  if (formattedBase === 'Not specified' && formattedOte === 'Not specified') return 'Not specified'
  if (formattedBase === 'Not specified') return `${formattedOte} OTE`
  if (formattedOte === 'Not specified') return formattedBase
  return `${formattedBase} base / ${formattedOte} OTE`
}
