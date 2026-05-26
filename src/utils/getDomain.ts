export const getDomain = (website: string | undefined | null, _companyName?: string): string => {
  if (!website) return '';
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    const hostname = new URL(url).hostname.replace('www.', '');
    // Never use a job board's own domain as the company logo domain
    if (hostname === 'arbeitnow.com' || hostname === 'linkedin.com' || hostname === 'indeed.com') return '';
    return hostname;
  } catch {}
  return '';
};
