export type GeoLocation = {
  country_code: string;
  country_name: string;
};

export async function detectGeoLocation(): Promise<GeoLocation | null> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const data = (await res.json()) as { country_code?: string; country_name?: string };
    if (!data.country_code) return null;
    return {
      country_code: data.country_code,
      country_name: data.country_name ?? data.country_code,
    };
  } catch {
    return null;
  }
}
