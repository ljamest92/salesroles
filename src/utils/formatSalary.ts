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
