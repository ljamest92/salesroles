import React, { useState } from 'react'
import { getCompanyLogoUrl } from '../lib/utils'

interface CompanyLogoProps {
  domain?: string | null
  name: string
  /** Extra classes added to the <img> only (e.g. grayscale, transition) */
  imgClassName?: string
}

export function CompanyLogo({ domain, name, imgClassName = '' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)
  const url = getCompanyLogoUrl(domain)

  if (!url || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-emerald-400 font-black text-xl leading-none select-none">
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      className={`w-full h-full object-cover ${imgClassName}`.trim()}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}
