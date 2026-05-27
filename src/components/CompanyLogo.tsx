import { useState } from 'react'
import { getLogoUrl } from '../lib/domain'

interface CompanyLogoProps {
  domain?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  imgClassName?: string
  uploadedLogoUrl?: string | null
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
}

export function CompanyLogo({ domain, name, size = 'md', className = '', imgClassName = '', uploadedLogoUrl }: CompanyLogoProps) {
  const [uploadedFailed, setUploadedFailed] = useState(false)
  const [domainFailed, setDomainFailed] = useState(false)

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const uploadedSrc = uploadedLogoUrl
    ? uploadedLogoUrl.startsWith('http') ? uploadedLogoUrl : `/uploads/logos/${uploadedLogoUrl}`
    : null

  const imgClass = `${sizeMap[size]} ${className} ${imgClassName} rounded-lg object-contain bg-white p-1`.trim()

  if (uploadedSrc && !uploadedFailed) {
    return (
      <img
        src={uploadedSrc}
        alt={`${name} logo`}
        onError={() => setUploadedFailed(true)}
        className={imgClass}
      />
    )
  }

  if (domain && !domainFailed) {
    return (
      <img
        src={getLogoUrl(domain)}
        alt={`${name} logo`}
        onError={() => setDomainFailed(true)}
        className={imgClass}
      />
    )
  }

  return (
    <div className={`${sizeMap[size]} ${className} rounded-lg bg-[#0f1629] border border-white/10 flex items-center justify-center font-semibold text-emerald-400`}>
      {initials}
    </div>
  )
}
