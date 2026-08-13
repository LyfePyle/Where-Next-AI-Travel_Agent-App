'use client';

import { useState, useRef, useCallback, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  useWalkingTour,
  TOUR_STOP_CATEGORIES,
  type TourStopCategory,
} from '@/hooks/useWalkingTour';
import WalkingTourChatPanel from '@/components/walkingTour/WalkingTourChatPanel';
import WalkingTourSampleCard from '@/components/walkingTour/WalkingTourSampleCard';
import { CURATED_WALKING_CITIES, type CuratedWalkingCity } from '@/data/curated-walking-cities';
import {
  getCachedTourSample,
  setCachedTourSample,
} from '@/lib/walking-tour-sample-cache';
import type { TourStop } from '@/hooks/useWalkingTour';
import { MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const TourMap = dynamic(() => import('@/components/TourMap'), { ssr: false });

function buildMapsUrl(lat: number, lng: number, label?: string) {
  const q = label ? `${encodeURIComponent(label)}` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

const CATEGORY_LABELS: Record<TourStopCategory, string> = {
  food: 'Food',
  scenic: 'Scenic',
  historic: 'Historic',
  'kid-friendly': 'Kid-friendly',
};

function categoryChipClass(category: TourStopCategory, active: boolean) {
  const base = active ? 'ring-2 ring-indigo-500 ring-offset-1 ' : '';
  switch (category) {
    case 'food':
      return `${base}bg-orange-100 text-orange-800`;
    case 'scenic':
      return `${base}bg-emerald-100 text-emerald-800`;
    case 'historic':
      return `${base}bg-amber-100 text-amber-900`;
    case 'kid-friendly':
      return `${base}bg-sky-100 text-sky-800`;
    default:
      return `${base}bg-gray-100 text-gray-700`;
  }
}

type CuratedCardState = CuratedWalkingCity & {
  title?: string;
  stops?: TourStop[];
  loading: boolean;
  error?: string;
};

type SearchTourOption = {
  title: string;
  summary: string;
  theme: string;
  stops: TourStop[];
};

async function fetchTourSample(
  city: string,
  country: string,
  preferences: string
): Promise<{ title: string; stops: TourStop[] }> {
  const cached = getCachedTourSample(city, country, preferences);
  if (cached) return { title: cached.title, stops: cached.stops };

  const res = await fetch('/api/tour/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, country, preferences }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error ?? `Failed to load ${city} sample`);
  }
  const title = typeof json?.data?.title === 'string' ? json.data.title : `${city} walking tour`;
  const stops = Array.isArray(json?.data?.stops) ? json.data.stops : [];
  if (!stops.length) throw new Error(`No stops returned for ${city}`);

  setCachedTourSample(city, country, { title, stops }, preferences);
  return { title, stops };
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
    generateOptions,
    loadTour,
    setActiveIndex,
    reset,
  } = useWalkingTour();

  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [preferences, setPreferences] = useState('');
  const [validateError, setValidateError] = useState<string | null>(null);
  const [placeCandidates, setPlaceCandidates] = useState<
    Array<{ place: string; country: string }>
  >([]);
  const [categoryFilter, setCategoryFilter] = useState<TourStopCategory | null>(null);
  const [curatedCards, setCuratedCards] = useState<CuratedCardState[]>(() =>
    CURATED_WALKING_CITIES.map((city) => ({ ...city, loading: true }))
  );
  const [searchOptions, setSearchOptions] = useState<SearchTourOption[]>([]);
  const [browsePhase, setBrowsePhase] = useState<'landing' | 'picking'>('landing');

  const visibleStops = useMemo(() => {
    if (!categoryFilter) return stops;
    return stops.filter((stop) => stop.categories?.includes(categoryFilter));
  }, [stops, categoryFilter]);

  const visibleActiveIndex = useMemo(() => {
    const current = stops[activeIndex];
    if (!current || visibleStops.length === 0) return 0;
    const idx = visibleStops.findIndex(
      (stop) => stop.order === current.order && stop.name === current.name
    );
    return idx >= 0 ? idx : 0;
  }, [visibleStops, stops, activeIndex]);

  useEffect(() => {
    if (!categoryFilter || visibleStops.length === 0) return;
    const current = stops[activeIndex];
    if (!current) return;
    const inVisible = visibleStops.some(
      (stop) => stop.order === current.order && stop.name === current.name
    );
    if (!inVisible) {
      const first = visibleStops[0];
      const idx = stops.findIndex(
        (stop) => stop.order === first.order && stop.name === first.name
      );
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [categoryFilter, visibleStops, stops, activeIndex, setActiveIndex]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurated() {
      await Promise.all(
        CURATED_WALKING_CITIES.map(async (entry) => {
          try {
            const sample = await fetchTourSample(entry.city, entry.country, entry.preferences);
            if (cancelled) return;
            setCuratedCards((prev) =>
              prev.map((card) =>
                card.id === entry.id
                  ? { ...card, loading: false, title: sample.title, stops: sample.stops }
                  : card
              )
            );
          } catch (err) {
            if (cancelled) return;
            setCuratedCards((prev) =>
              prev.map((card) =>
                card.id === entry.id
                  ? {
                      ...card,
                      loading: false,
                      error: err instanceof Error ? err.message : 'Failed to load',
                    }
                  : card
              )
            );
          }
        })
      );
    }

    void loadCurated();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectVisibleStop = useCallback(
    (visibleIdx: number) => {
      const stop = visibleStops[visibleIdx];
      if (!stop) return;
      const originalIndex = stops.findIndex(
        (s) => s.order === stop.order && s.name === stop.name
      );
      if (originalIndex >= 0) setActiveIndex(originalIndex);
    },
    [visibleStops, stops, setActiveIndex]
  );

  const goNextVisible = useCallback(() => {
    if (visibleStops.length <= 1) return;
    selectVisibleStop(Math.min(visibleActiveIndex + 1, visibleStops.length - 1));
  }, [visibleStops.length, visibleActiveIndex, selectVisibleStop]);

  const goPrevVisible = useCallback(() => {
    if (visibleStops.length <= 1) return;
    selectVisibleStop(Math.max(visibleActiveIndex - 1, 0));
  }, [visibleActiveIndex, selectVisibleStop]);

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (dx > 50) goPrevVisible();
      else if (dx < -50) goNextVisible();
    },
    [goNextVisible, goPrevVisible]
  );

  const openTour = useCallback(
    (payload: {
      tourTitle: string;
      tourStops: TourStop[];
      tourCity: string;
      tourCountry: string;
    }) => {
      setCity(payload.tourCity);
      setCountry(payload.tourCountry);
      setPlaceCandidates([]);
      setValidateError(null);
      setSearchOptions([]);
      setBrowsePhase('landing');
      loadTour({ title: payload.tourTitle, stops: payload.tourStops });
    },
    [loadTour]
  );

  const handlePickCurated = useCallback(
    (card: CuratedCardState) => {
      if (!card.stops?.length || !card.title) return;
      openTour({
        tourTitle: card.title,
        tourStops: card.stops,
        tourCity: card.city,
        tourCountry: card.country,
      });
    },
    [openTour]
  );

  const handlePickSearchOption = useCallback(
    (option: SearchTourOption) => {
      openTour({
        tourTitle: option.title,
        tourStops: option.stops,
        tourCity: city,
        tourCountry: country,
      });
    },
    [openTour, city, country]
  );

  const generateTourForPlace = useCallback(
    async (validatedCity: string, validatedCountry: string) => {
      setCity(validatedCity);
      setCountry(validatedCountry);
      setPlaceCandidates([]);
      setSearchOptions([]);
      setBrowsePhase('picking');

      const result = await generateOptions(
        validatedCity,
        validatedCountry,
        preferences.trim() || undefined
      );
      if (result.ok) {
        setSearchOptions(result.options);
      }
    },
    [generateOptions, preferences]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateError(null);
    setPlaceCandidates([]);

    const trimmed = destination.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/places/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trimmed }),
      });
      const data = await res.json();
      if (res.status === 409 && data.ambiguous && Array.isArray(data.candidates)) {
        setPlaceCandidates(data.candidates);
        setValidateError(
          data.error || 'Multiple places match — pick one or add a country to be specific.'
        );
        return;
      }
      if (!res.ok || !data.ok) {
        setValidateError(data.error || 'Could not find that place — try being more specific.');
        return;
      }

      await generateTourForPlace(data.validated.place, data.validated.country);
    } catch {
      setValidateError('Could not validate place — try again.');
    }
  };

  const handlePickCandidate = async (place: string, country: string) => {
    setValidateError(null);
    setPlaceCandidates([]);
    setDestination(`${place}, ${country}`);
    await generateTourForPlace(place, country);
  };

  const handleReset = () => {
    reset();
    setCity('');
    setCountry('');
    setValidateError(null);
    setCategoryFilter(null);
    setPlaceCandidates([]);
    setSearchOptions([]);
    setBrowsePhase('landing');
  };

  if (hasStops && !loading) {
    const detailStop = activeStop;

    return (
      <div className="min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                    {title ?? 'Walking tour'}
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {[city, country].filter(Boolean).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs md:text-sm font-medium text-indigo-600 shrink-0"
                >
                  New tour
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-3">
                <div className="h-52 sm:h-64 md:h-72">
                  <TourMap
                    stops={visibleStops}
                    activeIndex={visibleActiveIndex}
                    onSelectStop={selectVisibleStop}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    categoryFilter === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {TOUR_STOP_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setCategoryFilter((prev) => (prev === category ? null : category))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${categoryChipClass(
                      category,
                      categoryFilter === category
                    )}`}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>

              {visibleStops.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
                  No stops match this filter — try another category or show all stops.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                  <aside className="md:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden mb-3 md:mb-0">
                    <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Stops ({visibleStops.length})
                    </div>
                    <ul className="divide-y divide-gray-100 max-h-48 md:max-h-none overflow-y-auto">
                      {visibleStops.map((stop, i) => (
                        <li key={`${stop.order}-${stop.name}`}>
                          <button
                            type="button"
                            onClick={() => selectVisibleStop(i)}
                            className={`w-full text-left px-3 md:px-4 py-3 flex items-center gap-3 ${
                              i === visibleActiveIndex
                                ? 'bg-indigo-50 text-indigo-800'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium shrink-0">
                              {stop.order}
                            </span>
                            <span className="font-medium truncate text-sm">{stop.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </aside>

                  <div
                    className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-4 md:p-6"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                  >
                    {detailStop ? (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <h2 className="text-lg font-bold text-gray-900">{detailStop.name}</h2>
                          {detailStop.categories && detailStop.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {detailStop.categories.map((category) => (
                                <span
                                  key={`${detailStop.order}-${category}`}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${categoryChipClass(
                                    category as TourStopCategory,
                                    false
                                  )}`}
                                >
                                  {CATEGORY_LABELS[category as TourStopCategory] ?? category}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 text-sm md:text-base">{detailStop.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                          {detailStop.known_for && (
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                                Known for
                              </p>
                              <p className="text-sm text-gray-800">{detailStop.known_for}</p>
                            </div>
                          )}
                          {detailStop.best_time && (
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                                Best time
                              </p>
                              <p className="text-sm text-gray-800">{detailStop.best_time}</p>
                            </div>
                          )}
                          {detailStop.time_to_spend && (
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                                Time to spend
                              </p>
                              <p className="text-sm text-gray-800">{detailStop.time_to_spend}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                          <p className="text-xs font-medium text-amber-900 mb-1">Local tip</p>
                          <p className="text-sm text-amber-800">{detailStop.local_tip}</p>
                        </div>
                        <a
                          href={buildMapsUrl(detailStop.lat, detailStop.lng, detailStop.name)}
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
                        onClick={goPrevVisible}
                        disabled={visibleActiveIndex === 0}
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-500">
                        {visibleActiveIndex + 1} / {visibleStops.length}
                      </span>
                      <button
                        type="button"
                        onClick={goNextVisible}
                        disabled={visibleActiveIndex === visibleStops.length - 1}
                        className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
        <p className="mt-4 text-gray-600">
          {browsePhase === 'picking'
            ? 'Finding tour options for your destination…'
            : 'Building your walking tour…'}
        </p>
      </div>
    );
  }

  if (browsePhase === 'picking' && searchOptions.length > 0) {
    const locationLabel = [city, country].filter(Boolean).join(', ');
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => {
              setSearchOptions([]);
              setBrowsePhase('landing');
            }}
            className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to browse
          </button>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Pick a walking tour</h1>
          <p className="mb-6 text-sm text-gray-600">
            Sample routes for {locationLabel} — choose one to open the full map and stop guide.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchOptions.map((option) => (
              <WalkingTourSampleCard
                key={`${option.title}-${option.theme}`}
                title={option.title}
                location={locationLabel}
                summary={option.summary || option.theme}
                theme={option.theme}
                stops={option.stops}
                onSelect={() => handlePickSearchOption(option)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Walking tour</h1>
        <p className="mb-6 text-sm text-gray-600">
          Browse sample routes in top tour cities, or search any destination for AI-generated options
          to pick from — no account needed.
        </p>

        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Popular tour cities</h2>
              <p className="text-xs text-gray-500">
                Curated samples — cached for a few hours after first load.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {curatedCards.map((card) => (
              <WalkingTourSampleCard
                key={card.id}
                title={card.title ?? `${card.label} walking tour`}
                location={`${card.city}, ${card.country}`}
                summary={card.error ?? card.blurb}
                theme={card.tier === 'budget' ? 'Budget-friendly' : 'Top tours'}
                stops={card.stops ?? []}
                loading={card.loading}
                onSelect={() => handlePickCurated(card)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Search any destination</h2>
          <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setPlaceCandidates([]);
                setValidateError(null);
              }}
              placeholder="e.g. Berlin or Paris, France"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              City name is enough for well-known places — add a country when needed.
            </p>
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
          {placeCandidates.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                Did you mean
              </p>
              <div className="flex flex-col gap-2">
                {placeCandidates.map((candidate) => (
                  <button
                    key={`${candidate.place}-${candidate.country}`}
                    type="button"
                    onClick={() => handlePickCandidate(candidate.place, candidate.country)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-sm font-medium text-gray-900"
                  >
                    {candidate.place}, {candidate.country}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
          >
            Find tour options
          </button>
        </form>
        </section>
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
