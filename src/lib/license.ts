export type LicenseStatus = 'none' | 'checking' | 'valid' | 'invalid' | 'unavailable';
export type LicenseState = { status: LicenseStatus; token: string | null; checkedAt: number | null };

export const productSlug = 'signal-school';
const tokenKey = `sb_license:${productSlug}`;
const cacheKey = `sb_license_verdict:${productSlug}`;

export function captureLicenseFromUrl() {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(tokenKey, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function loadLicenseState(): LicenseState {
  const token = localStorage.getItem(tokenKey);
  if (!token) return { status: 'none', token: null, checkedAt: null };
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}') as { valid?: boolean; checkedAt?: number };
    if (cached.valid && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return { status: 'valid', token, checkedAt: cached.checkedAt };
  } catch { /* Re-check a malformed cache. */ }
  return { status: 'checking', token, checkedAt: null };
}

export async function verifyLicense(token: string, request: typeof fetch = fetch): Promise<LicenseState> {
  try {
    const response = await request(`https://api.sociobot.in/api/v1/products/${productSlug}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) return { status: 'unavailable', token, checkedAt: Date.now() };
    const result = await response.json() as { valid?: boolean };
    const next: LicenseState = { status: result.valid ? 'valid' : 'invalid', token, checkedAt: Date.now() };
    localStorage.setItem(cacheKey, JSON.stringify({ valid: next.status === 'valid', checkedAt: next.checkedAt }));
    return next;
  } catch { return { status: 'unavailable', token, checkedAt: Date.now() }; }
}
