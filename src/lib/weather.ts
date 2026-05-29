// src/lib/weather.ts
// Fetches real weather data from OpenWeatherMap API
// Free tier: 1,000 calls/day — https://openweathermap.org/api

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export type WeatherData = {
  temp: number;       // Celsius
  condition: string;  // e.g. "Partly Cloudy"
  icon: string;       // emoji e.g. "⛅"
  humidity: number;
  feelsLike: number;
  source: 'live' | 'fallback';
};

// Map OpenWeather icon codes to emojis
function iconCodeToEmoji(iconCode: string): string {
  const map: Record<string, string> = {
    '01d': '☀️',  '01n': '🌙',
    '02d': '⛅',  '02n': '⛅',
    '03d': '☁️',  '03n': '☁️',
    '04d': '☁️',  '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️',  '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[iconCode] ?? '🌡️';
}

// Capitalise first letter of each word
function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// In-memory cache: city → { data, expiresAt }
const weatherCache = new Map<string, { data: WeatherData; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function getWeatherForCity(city: string): Promise<WeatherData> {
  const key = city.toLowerCase().trim();

  // Return cached result if fresh
  const cached = weatherCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  OPENWEATHER_API_KEY not set — using fallback weather');
    return fallbackWeather(city);
  }

  try {
    const url = `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // Next.js cache 30 min

    if (!res.ok) {
      console.warn(`⚠️  OpenWeather returned ${res.status} for "${city}"`);
      return fallbackWeather(city);
    }

    const json = await res.json();
    const data: WeatherData = {
      temp: Math.round(json.main.temp),
      feelsLike: Math.round(json.main.feels_like),
      humidity: json.main.humidity,
      condition: titleCase(json.weather[0]?.description ?? 'Clear'),
      icon: iconCodeToEmoji(json.weather[0]?.icon ?? '01d'),
      source: 'live',
    };

    weatherCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    console.log(`✅ Weather for ${city}: ${data.temp}°C ${data.icon}`);
    return data;

  } catch (err) {
    console.error(`❌ OpenWeather fetch error for "${city}":`, err);
    return fallbackWeather(city);
  }
}

// Reasonable fallback so the app never breaks without an API key
function fallbackWeather(city: string): WeatherData {
  // Very rough latitude-based temperature estimate by city name keywords
  const lower = city.toLowerCase();
  let temp = 22;
  if (lower.includes('iceland') || lower.includes('norway') || lower.includes('finland')) temp = 5;
  else if (lower.includes('canada') || lower.includes('sweden') || lower.includes('denmark')) temp = 10;
  else if (lower.includes('uk') || lower.includes('ireland') || lower.includes('london')) temp = 14;
  else if (lower.includes('japan') || lower.includes('korea') || lower.includes('beijing')) temp = 18;
  else if (lower.includes('thailand') || lower.includes('bali') || lower.includes('singapore')) temp = 31;
  else if (lower.includes('dubai') || lower.includes('egypt') || lower.includes('morocco')) temp = 34;
  else if (lower.includes('paris') || lower.includes('rome') || lower.includes('barcelona')) temp = 20;

  return {
    temp,
    feelsLike: temp - 2,
    humidity: 60,
    condition: 'Partly Cloudy',
    icon: '⛅',
    source: 'fallback',
  };
}
