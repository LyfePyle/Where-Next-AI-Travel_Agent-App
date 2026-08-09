'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { parseDestinationParts } from '@/lib/parse-destination';
import { useWalkingTour } from '@/hooks/useWalkingTour';
import WalkingTourChatPanel from '@/components/walkingTour/WalkingTourChatPanel';
import { MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const TourMap = dynamic(() => import('@/components/TourMap'), { ssr: false });

function buildMapsUrl(lat: number, lng: number, label?: string) {
  const q = label ? `${encodeURIComponent(label)}` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function WalkingTourPageInner() {
  const {
    loading,
    error,
    title,
    stops,
    activeIndex,
    activeStop,
    hasStops,
    generate,
    goNext,
    goPrev,
    setActiveIndex,
    reset,
  } = useWalkingTour();

  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [preferences, setPreferences] = useState('');
  const [validateError, setValidateError] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'map' | 'stops'>('map');

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (dx > 50) goPrev();
      else if (dx < -50) goNext();
    },
    [goNext, goPrev]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateError(null);

    const trimmed = destination.trim();
    if (!trimmed) return;

    const parsed = parseDestinationParts(trimmed);
    if (!parsed.city || !parsed.country) {
      setValidateError('Enter city and country, e.g. "Paris, France".');
      return;
    }

    try {
      const res = await fetch('/api/places/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place: parsed.city, country: parsed.country }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setValidateError(data.error || 'Could not find that place — try being more specific.');
        return;
      }

      const validatedCity = data.validated.place;
      const validatedCountry = data.validated.country;
      setCity(validatedCity);
      setCountry(validatedCountry);
      await generate(validatedCity, validatedCountry, preferences.trim() || undefined, undefined, {
        requireAuth: false,
      });
    } catch {
      setValidateError('Could not validate place — try again.');
    }
  };

  const handleReset = () => {
    reset();
    setCity('');
    setCountry('');
    setValidateError(null);
  };

  const selectStopAndShowMap = (index: number) => {
    setActiveIndex(index);
    setMobilePanel('map');
  };

  if (hasStops && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <div className="sticky top-0 z-20 md:static flex md:hidden flex-col gap-2 pb-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 mb-2">
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-gray-900 truncate">{title ?? 'Walking tour'}</h1>
                    <p className="text-xs text-gray-500 truncate">
                      {[city, country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-gray-200/90 p-0.5">
                      <button
                        type="button"
                        onClick={() => setMobilePanel('map')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md ${
                          mobilePanel === 'map' ? 'bg-white shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobilePanel('stops')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md ${
                          mobilePanel === 'stops' ? 'bg-white shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        Stops
                      </button>
                    </div>
                    <button type="button" onClick={handleReset} className="text-xs font-medium text-indigo-600">
                      New
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{title ?? 'Walking tour'}</h1>
                  <p className="text-sm text-gray-500">{[city, country].filter(Boolean).join(', ')}</p>
                </div>
                <button type="button" onClick={handleReset} className="text-sm text-indigo-600 underline">
                  New tour
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                <aside className="hidden md:block md:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {stops.map((stop, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => setActiveIndex(i)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                            i === activeIndex ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {stop.order}
                          </span>
                          <span className="font-medium truncate">{stop.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>

                <div className="md:col-span-2 flex flex-col md:bg-white md:rounded-xl md:border md:border-gray-200 md:p-6">
                  <div className={`border-b border-gray-200 md:border-b-0 ${mobilePanel === 'stops' ? 'hidden md:block' : 'block'}`}>
                    <TourMap stops={stops} activeIndex={activeIndex} onSelectStop={setActiveIndex} />
                  </div>

                  <div className={mobilePanel === 'stops' ? 'md:hidden' : 'hidden'}>
                    <ul className="divide-y divide-gray-100 bg-white">
                      {stops.map((stop, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => selectStopAndShowMap(i)}
                            className={`w-full text-left px-3 py-3.5 flex items-center gap-3 ${
                              i === activeIndex ? 'bg-indigo-50 text-indigo-800' : ''
                            }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                              {stop.order}
                            </span>
                            <span className="font-medium text-sm">{stop.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`flex-1 px-3 py-3 md:px-0 md:py-4 bg-white ${mobilePanel === 'stops' ? 'hidden md:block' : 'block'}`}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                  >
                    {activeStop ? (
                      <>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">{activeStop.name}</h2>
                        <p className="text-gray-600 mb-4 text-sm md:text-base">{activeStop.description}</p>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                          <p className="text-xs font-medium text-amber-900 mb-1">Local tip</p>
                          <p className="text-sm text-amber-800">{activeStop.local_tip}</p>
                        </div>
                        <a
                          href={buildMapsUrl(activeStop.lat, activeStop.lng, activeStop.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
                        >
                          <MapPin className="w-4 h-4" />
                          Open in Google Maps
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </>
                    ) : null}

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-500">
                        {activeIndex + 1} / {stops.length}
                      </span>
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={activeIndex === stops.length - 1}
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {city && country && (
              <WalkingTourChatPanel
                city={city}
                country={country}
                tourTitle={title}
                tourStops={stops}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600">Building your walking tour…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Walking tour</h1>
        <p className="text-gray-600 text-sm mb-6">
          Enter a destination to generate a self-guided walking tour — no account needed. Ask the place
          guide about history, food, and tips.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Paris, France"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">City and country help us find the right place.</p>
          </div>
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-1">
              Preferences <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. Art, cafes, less crowded"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {(validateError || error) && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{validateError || error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            Generate tour
          </button>
        </form>
      </div>
    </div>
  );
}

export default function WalkingTourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <WalkingTourPageInner />
    </Suspense>
  );
}
