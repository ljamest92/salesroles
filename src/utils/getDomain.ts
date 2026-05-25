export const getDomain = (website: string | undefined | null, companyName: string): string => {
  if (website) {
    try {
      const url = website.startsWith('http') ? website : `https://${website}`;
      return new URL(url).hostname.replace('www.', '');
    } catch {}
  }
  return companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
};
