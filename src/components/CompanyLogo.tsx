/**
 * CompanyLogo — canonical company logo component.
 *
 * SINGLE SOURCE OF TRUTH for all company logo rendering across the app.
 * Every job card, job page, Companies to Watch section, company profile page,
 * and any other logo-rendering surface must import and use this component.
 *
 * Logo source: https://logos.apistemic.com/{domain}
 * Fallback:    dark navy background (#0f1629) + first letter of company name
 *              in emerald green (#10B981), rendered when:
 *              - domain is null / empty, OR
 *              - the image fails to load (onError)
 *
 * Usage:
 *   <CompanyLogo domain="salesforce.com" name="Salesforce" />
 *
 * Sizing is controlled entirely by the parent wrapper — the component fills
 * 100% of its container (w-full h-full). Wrap it in a sized div:
 *   <div className="w-12 h-12 rounded-xl overflow-hidden">
 *     <CompanyLogo domain="salesforce.com" name="Salesforce" />
 *   </div>
 */
import React, { useState } from 'react'

const LOGO_BASE = 'https://logos.apistemic.com'

interface CompanyLogoProps {
  /** The company's primary domain, e.g. "salesforce.com". Pass null/undefined to go straight to the initial fallback. */
  domain?: string | null
  /** The company name — used for the alt attribute and the initial-letter fallback. */
  name: string
  /** Extra Tailwind classes added to the <img> element only (e.g. "grayscale"). */
  imgClassName?: string
}

export function CompanyLogo({ domain, name, imgClassName = '' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)

  const src = domain ? `${LOGO_BASE}/${domain}` : null

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
