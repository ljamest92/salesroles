/**
 * CompanyLogo — canonical company logo component.
 *
 * SINGLE SOURCE OF TRUTH for all company logo rendering across the app.
 * Every job card, job page, Companies to Watch section, company profile page,
 * and any other logo-rendering surface must import and use this component.
 *
 * Logo API: https://logos-api.apistemic.com/domain:{domain}
 * e.g.      https://logos-api.apistemic.com/domain:stripe.com
 *
 * Do NOT change the API URL format without confirming with the API provider first.
 *
 * The `domain` prop accepts any of:
 *   - "salesforce.com"            → https://logos-api.apistemic.com/domain:salesforce.com
 *   - "https://salesforce.com"    → stripped to salesforce.com, then same as above
 *   - "/uploads/logos/file.png"   → no network request, shows initial-letter avatar
 *   - null / undefined / ""       → initial-letter avatar
 *
 * If cleanDomain() returns null, the avatar is shown immediately with no network request.
 * If the image fails to load, onError falls back to the avatar.
 *
 * Sizing is controlled by the parent wrapper — the component fills 100% of
 * its container (w-full h-full). Example:
 *
 *   <div className="w-12 h-12 rounded-xl overflow-hidden">
 *     <CompanyLogo domain="salesforce.com" name="Salesforce" />
 *   </div>
 */
import React, { useState } from 'react'

const LOGO_API = 'https://logos-api.apistemic.com'

interface CompanyLogoProps {
  domain?: string | null
  name: string
  imgClassName?: string
}

/**
 * Strips a domain value to a bare hostname (e.g. "stripe.com").
 * Returns null for uploaded file paths, blank values, or anything
 * that doesn't look like a real domain — so no network request is made.
 */
function cleanDomain(value?: string | null): string | null {
  if (!value) return null
  if (value.startsWith('/uploads/')) return null
  const stripped = value
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim()
  if (!stripped || !stripped.includes('.')) return null
  return stripped
}

export function CompanyLogo({ domain, name, imgClassName = '' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)

  const clean = cleanDomain(domain)
  const src = clean ? `${LOGO_API}/domain:${clean}` : null

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
