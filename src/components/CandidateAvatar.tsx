import { useState } from 'react'

interface CandidateAvatarProps {
  avatarUrl?: string | null
  name?: string | null
  imgClassName?: string
  initialsClassName?: string
  cacheBust?: number
}

function resolveAvatarSrc(url: string): string {
  if (url.startsWith('http') || url.startsWith('/uploads/')) return url
  return `/uploads/avatars/${url}`
}

export function CandidateAvatar({
  avatarUrl,
  name,
  imgClassName = 'w-full h-full object-cover',
  initialsClassName = '',
  cacheBust,
}: CandidateAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initial = (name || '?')[0]?.toUpperCase()

  if (avatarUrl && !imgError) {
    const src = resolveAvatarSrc(avatarUrl) + (cacheBust ? `?t=${cacheBust}` : '')
    return (
      <img
        src={src}
        alt={name || 'Profile'}
        className={imgClassName}
        onError={() => setImgError(true)}
      />
    )
  }

  return <span className={initialsClassName}>{initial}</span>
}
