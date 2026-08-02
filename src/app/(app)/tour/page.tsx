'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { parseDestinationParts } from '@/lib/parse-destination';
import { useWalkingTour } from '@/hooks/useWalkingTour';
import { MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const TourMap = dynamic(() => import('@/components/TourMap'), { ssr: false });

function buildMapsUrl(lat: number, lng: number, label?: string) {
  const q = label ? `${encodeURIComponent(label)}` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function TourPageInner() {
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
    loadSavedTour,
  } = useWalkingTour();

  const searchParams = useSearchParams();
  const destFromUrl = searchParams.get('destination') ?? '';
  const parsedDest = destFromUrl ? parseDestinationParts(destFromUrl) : { city: '', country: '' };
  const [city, setCity] = useState(searchParams.get('city') ?? parsedDest.city);
  const [country, setCountry] = useState(searchParams.get('country') ?? parsedDest.country);
  const [preferences, setPreferences] = useState('');
  const tripId = searchParams.get('trip_id') ?? undefined;

  const loadId = searchParams.get('load');
  useEffect(() => {
    if (loadId) loadSavedTour(loadId);
  }, [loadId, loadSavedTour]);

  /** Mobile: map vs full stop list */
  const [mobilePanel, setMobilePanel] = useState<'map' | 'stops'>('map');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !country.trim()) return;
    generate(city.trim(), country.trim(), preferences.trim() || undefined, tripId);
  };

  const locationSubtitle = [searchParams.get('city'), searchParams.get('country')]
    .filter(Boolean)
    .join(', ');

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      const threshold = 50;
      if (dx > threshold) goPrev();
      else if (dx < -threshold) goNext();
    },
    [goNext, goPrev]
  );

  const selectStopAndShowMap = (index: number) => {
    setActiveIndex(index);
    setMobilePanel('map');
  };

  const stopListDesktop = (
    <ul className="divide-y divide-gray-100">
      {stops.map((stop, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
              i === activeIndex ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {stop.order}
            </span>
            <span className="font-medium truncate">{stop.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const stopListMobile = (
    <ul className="divide-y divide-gray-100 bg-white md:hidden min-h-64">
      {stops.map((stop, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => selectStopAndShowMap(i)}
            className={`w-full text-left px-3 py-3.5 flex items-center gap-3 transition-colors active:bg-gray-50 ${
              i === activeIndex ? 'bg-indigo-50 text-indigo-800' : 'text-gray-800'
            }`}
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
              {stop.order}
            </span>
            <span className="font-medium text-sm leading-snug">{stop.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const detailContent = activeStop ? (
    <>
      <h2 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2">{activeStop.name}</h2>
      <p className="text-gray-600 mb-3 md:mb-4 leading-relaxed text-sm md:text-base">{activeStop.description}</p>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 md:p-3 mb-3 md:mb-4">
        <p className="text-xs md:text-sm font-medium text-amber-900 mb-0.5 md:mb-1">Local tip</p>
        <p className="text-xs md:text-sm text-amber-800">{activeStop.local_tip}</p>
      </div>
      <a
        href={buildMapsUrl(activeStop.lat, activeStop.lng, activeStop.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        Open in Google Maps
        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
      </a>
    </>
  ) : (
    <p className="text-gray-500 text-sm">No stop selected.</p>
  );

  const navRow = (
    <div className="pt-3 md:pt-6 border-t border-gray-100 md:mt-8">
      {/* Mobile: two full-width-style tap targets */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Previous stop"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === stops.length - 1}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 active:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Next stop"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 tabular-nums">
          Stop {activeIndex + 1} of {stops.length}
        </p>
      </div>
      {/* Desktop: original inline nav */}
      <div className="hidden md:flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeIndex === 0}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <span className="text-sm text-gray-500 tabular-nums">
          {activeIndex + 1} / {stops.length}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex === stops.length - 1}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:pointer-events-none"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (hasStops && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] md:p-6">
        <div className="max-w-5xl mx-auto">
          {/* —— Mobile: compact bar + Map | Stops toggle —— */}
          <div className="sticky top-0 z-20 md:static flex md:hidden flex-col gap-2 px-3 pt-2 pb-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {title ?? 'Walking tour'}
                </h1>
                {locationSubtitle ? (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{locationSubtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex rounded-lg bg-gray-200/90 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMobilePanel('map')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      mobilePanel === 'map'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobilePanel('stops')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      mobilePanel === 'stops'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600'
                    }`}
                  >
                    Stops
                  </button>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                >
                  New tour
                </button>
              </div>
            </div>
          </div>

          {/* —— Desktop: title row —— */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">{title ?? 'Walking tour'}</h1>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              New tour
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
            <aside className="hidden md:block md:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {stopListDesktop}
            </aside>

            <div className="md:col-span-2 flex flex-col md:bg-white md:rounded-xl md:border md:border-gray-200 md:shadow-sm md:p-6">
              {/* Single map: hidden on mobile when Stops tab; always visible on md+ */}
              <div
                className={`tour-map-shell border-b border-gray-200 md:border-b-0 ${
                  mobilePanel === 'stops' ? 'hidden md:block' : 'block'
                }`}
              >
                <TourMap stops={stops} activeIndex={activeIndex} onSelectStop={setActiveIndex} />
              </div>

              {/* Mobile: full stop list (Stops tab) */}
              <div className={mobilePanel === 'stops' ? 'md:hidden' : 'hidden'}>
                {stopListMobile}
                <p className="px-3 py-2 text-[11px] text-gray-400 text-center border-t border-gray-100 bg-white">
                  Tap a stop to open it on the map
                </p>
              </div>

              {/* Detail + nav: mobile only when Map tab; desktop always */}
              <div
                className={`flex-1 px-3 py-3 md:px-0 md:py-0 bg-white md:bg-transparent touch-pan-y ${
                  mobilePanel === 'stops' ? 'hidden md:block' : 'block'
                }`}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {detailContent}
                {navRow}
                <p className="text-[11px] text-gray-400 mt-3 text-center md:hidden">
                  Swipe left or right on the details to change stops
                </p>
              </div>
            </div>
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
      <div className="max-w-md mx-auto">
        {tripId && (
          <Link
            href={`/my-trip/${tripId}`}
            className="text-sm text-indigo-600 hover:underline mb-3 inline-block"
          >
            ← Back to trip
          </Link>
        )}
        <h1 className="text-xl font-bold text-gray-900 mb-2">Walking tour</h1>
        <p className="text-gray-600 text-sm mb-6">
          {city && country
            ? `Generate a walking tour for ${city}, ${country}`
            : 'Enter a city and country to generate a 6–8 stop walking tour with local tips.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Paris"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. France"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
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
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            Generate tour
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <TourPageInner />
    </Suspense>
  );
}
