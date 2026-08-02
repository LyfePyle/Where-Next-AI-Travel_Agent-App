'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseDestinationParts } from '@/lib/parse-destination';

interface WeatherData {
  location: { city: string; country: string };
  current: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    temperature: number;
    description: string;
    precipitation: number;
  }>;
  units: { temperature: string };
}

function WeatherPageInner() {
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') ?? '';
  const tripId = searchParams.get('tripId');
  const { city, country } = parseDestinationParts(destination);

  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) {
      setError('No destination provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ city });
        if (country) qs.set('country', country);
        let res = await fetch(`/api/utils/weather?${qs}`);
        let json = await res.json();

        if (!json.ok && res.status >= 500) {
          res = await fetch('/api/utils/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, country: country || undefined }),
          });
          json = await res.json();
        }

        if (cancelled) return;
        if (!json.ok) {
          setError(json.error || 'Could not load weather');
          setData(null);
        } else {
          setData(json.data);
        }
      } catch {
        if (!cancelled) setError('Network error loading weather');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [city, country]);

  const backHref = tripId ? `/my-trip/${tripId}` : '/saved';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href={backHref} className="text-sm text-indigo-600 hover:underline">
          ← Back to trip
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Weather</h1>
        <p className="text-gray-600 mb-6">
          {city}
          {country ? `, ${country}` : ''}
        </p>

        {loading && <p className="text-gray-500">Loading forecast…</p>}
        {error && (
          <p className="text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Now</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">
                {Math.round(data.current.temperature)}
                {data.units.temperature}
              </div>
              <div className="capitalize text-gray-700 mt-1">{data.current.description}</div>
              <div className="text-sm text-gray-500 mt-3">
                Humidity {data.current.humidity}% · Wind {data.current.windSpeed} m/s
              </div>
            </div>

            {data.forecast.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3">Next few days</h2>
                <ul className="space-y-2">
                  {data.forecast.map((f) => (
                    <li
                      key={f.date}
                      className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                    >
                      <span className="text-gray-600">
                        {new Date(f.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="capitalize text-gray-800">{f.description}</span>
                      <span className="font-medium">
                        {Math.round(f.temperature)}
                        {data.units.temperature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeatherUtilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <WeatherPageInner />
    </Suspense>
  );
}
