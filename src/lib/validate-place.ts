/**
 * Server-side place validation via OpenWeather geocoding (same source as city-search).
 */

export interface ValidatedPlace {
  place: string;
  country: string;
  countryCode?: string;
}

export async function validatePlace(
  place: string,
  country: string
): Promise<{ ok: true; validated: ValidatedPlace } | { ok: false; error: string }> {
  const city = place.trim();
  const countryName = country.trim();
  if (!city || !countryName) {
    return { ok: false, error: 'Place and country are required.' };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return { ok: true, validated: { place: city, country: countryName } };
  }

  const query = `${city},${countryName}`;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: true, validated: { place: city, country: countryName } };
    }

    const data = (await res.json()) as Array<{
      name: string;
      country: string;
      state?: string;
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      return {
        ok: false,
        error: `Could not find "${city}, ${countryName}" — please check the spelling or be more specific.`,
      };
    }

    const cityLower = city.toLowerCase();
    const countryLower = countryName.toLowerCase();
    const match =
      data.find(
        (d) =>
          d.name.toLowerCase() === cityLower ||
          d.name.toLowerCase().includes(cityLower) ||
          cityLower.includes(d.name.toLowerCase())
      ) ?? data[0];

    return {
      ok: true,
      validated: {
        place: match.name,
        country: match.country.length === 2 ? countryName : match.country || countryName,
        countryCode: match.country,
      },
    };
  } catch {
    return { ok: true, validated: { place: city, country: countryName } };
  }
}
