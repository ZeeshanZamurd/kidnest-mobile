export type GeoLocation = {
  country_code: string;
  country_name: string;
};

const GEO_TIMEOUT_MS = 2500;

/**
 * Best-effort country lookup. Never blocks signup/login for long —
 * office networks often stall outbound geo APIs.
 */
export async function detectGeoLocation(): Promise<GeoLocation | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country_code?: string; country_name?: string };
    if (!data.country_code) return null;
    return {
      country_code: data.country_code,
      country_name: data.country_name ?? data.country_code,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
