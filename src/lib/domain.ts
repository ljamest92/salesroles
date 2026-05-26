export function extractDomain(url: string): string {
  if (!url) return ''
  try {
    const cleaned = url.trim().toLowerCase()
    const withProtocol = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`
    const parsed = new URL(withProtocol)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

export function getLogoUrl(domain: string): string {
  if (!domain) return ''
  return `https://logos-api.apistemic.com/domain:${domain}`
}
