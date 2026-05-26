/**
 * CompanyLogo — canonical company logo component.
 *
 * SINGLE SOURCE OF TRUTH for all company logo rendering across the app.
 * Every job card, job page, Companies to Watch section, company profile page,
 * and any other logo-rendering surface must import and use this component.
 *
 * The `domain` prop is smart — it auto-detects which of three cases applies:
 *
 *   1. Direct URL  → starts with "/uploads/" or "http"
 *                    Rendered as-is. Used when a company has uploaded a logo file.
 *
 *   2. Domain      → contains "." but no leading slash or protocol
 *                    e.g. "salesforce.com" → https://logos-api.apistemic.com/domain:salesforce.com
 *
 *   3. Fallback    → null / undefined / empty / failed image load
 *                    Dark navy background (#0f1629) with the first letter of
 *                    the company name in emerald green (#10B981).
 *
 * Sizing is controlled by the parent wrapper — the component fills 100% of
 * its container (w-full h-full). Example:
 *
 *   <div className="w-12 h-12 rounded-xl overflow-hidden">
 *     <CompanyLogo domain="salesforce.com" name="Salesforce" />
 *   </div>
 *
 * To update the logo API, change LOGO_BASE below. Nothing else in the app
 * needs to be touched.
 */
import React, { useState } from 'react'

const LOGO_BASE = 'https://logos-api.apistemic.com'

interface CompanyLogoProps {
  /**
   * Accepts three formats (auto-detected):
   *   "/uploads/logos/file.png" or "https://…"  → used as direct image src
   *   "salesforce.com"                           → logos-api.apistemic.com/domain:salesforce.com
   *   null / undefined                           → initial-letter fallback
   */
  domain?: string | null
  /** Used for the alt attribute and the initial-letter fallback character. */
  name: string
  /** Extra Tailwind classes applied to the <img> only (e.g. "grayscale"). */
  imgClassName?: string
}

/**
 * Resolve whatever value `domain` holds into a concrete image src URL,
 * or null if nothing usable was supplied.
 */
function resolveLogoSrc(domain?: string | null): string | null {
  if (!domain) return null
  const d = domain.trim()
  if (!d) return null

  // Case 1: direct URL — uploaded file path or full external URL
  if (d.startsWith('/uploads/') || d.startsWith('http://') || d.startsWith('https://')) {
    return d
  }

  // Case 2: bare domain — pass to Apistemic
  if (d.includes('.')) {
    return `${LOGO_BASE}/domain:${d}`
  }

  // Unrecognised format — fall through to initial-letter fallback
  return null
}

export function CompanyLogo({ domain, name, imgClassName = '' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)

  const src = resolveLogoSrc(domain)

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f1629] text-[#10B981] font-black text-xl leading-none select-none">
        {(name || '?').charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={`w-full h-full object-contain ${imgClassName}`.trim()}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}
