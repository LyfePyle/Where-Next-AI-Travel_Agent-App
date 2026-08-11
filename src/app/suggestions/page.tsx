'use client';

import { useCallback, useEffect, Suspense, useRef, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStreamingSuggestions, type TripSuggestion } from '@/hooks/useStreamingSuggestions';
import { useToast, ToastContainer } from '@/hooks/useToast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { stopsFromSearchParams, tripDestinationSummary, type TripStop } from '@/types/trip';
import { distributeStops } from '@/lib/stop-parser';
import { serializeStopsForDb, titleFromCountries } from '@/lib/trip-stops';
import CompareSummaryBlock from '@/components/suggestions/CompareSummaryBlock';
import SuggestionsDrillDown from '@/components/suggestions/SuggestionsDrillDown';
import {
  buildDrillDownView,
  buildStopsFromSelection,
  suggestionPayloadForSelection,
} from '@/lib/suggestion-drilldown';

function getItineraryTeaser(suggestion: TripSuggestion): string[] {
  if (suggestion.itineraryTeaser?.length) {
    return suggestion.itineraryTeaser.filter(Boolean).slice(0, 3);
  }
  if (suggestion.stops?.length) {
    return suggestion.stops.slice(0, 3).map((stop, i) => `Stop ${i + 1}: ${stop}`);
  }
  return suggestion.highlights.slice(0, 2).map((h, i) => `Day ${i + 1}: ${h}`);
}

function resolveStopsForSave(
  suggestion: TripSuggestion,
  urlStops: TripStop[],
  startDate: string,
  endDate: string
): TripStop[] | undefined {
  const filledUrlStops = urlStops.filter((s) => s.destination.trim());
  if (filledUrlStops.length > 1) return filledUrlStops;
  if (suggestion.stops && suggestion.stops.length > 1) {
    return distributeStops(suggestion.stops, startDate || '', endDate || '');
  }
  if (filledUrlStops.length === 1) return filledUrlStops;
  return undefined;
}

function SuggestionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { suggestions, compareSummary, isLoading, isStreaming, dataSource, fetchSuggestions, error } =
    useStreamingSuggestions();
  const { toasts, addToast, removeToast } = useToast();

  const stops = stopsFromSearchParams(searchParams);

  // Track which prefs came from the URL vs silent defaults used only for the AI API call.
  const hasFrom = searchParams.has('from');
  const hasStartDate = searchParams.has('startDate') && !!searchParams.get('startDate');
  const hasEndDate = searchParams.has('endDate') && !!searchParams.get('endDate');
  const hasTripDuration = searchParams.has('tripDuration');
  const hasBudgetAmount = searchParams.has('budgetAmount');
  const hasAdults = searchParams.has('adults');
  const hasKids = searchParams.has('kids');

  const destination =
    stops.length > 0
      ? stops.map((s) => s.destination.trim()).filter(Boolean).join(' → ')
      : searchParams.get('destination') || '';

  const from = searchParams.get('from') || 'Vancouver';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tripDurationFromParams = parseInt(searchParams.get('tripDuration') || '0', 10);
  const tripDuration =
    tripDurationFromParams > 0
      ? tripDurationFromParams
      : startDate && endDate
        ? Math.max(
            1,
            Math.round(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        : 7;
  const budgetStyle = searchParams.get('budgetStyle') || 'comfortable';
  const budgetAmount = parseInt(searchParams.get('budgetAmount') || '2000', 10);
  const vibe = searchParams.get('vibe') || '';
  const vibesParam = searchParams.get('vibes');
  const vibesFromUrl = Array.isArray(vibesParam)
    ? vibesParam
    : vibesParam
      ? vibesParam.split(',').filter(Boolean)
      : [];
  const vibes = vibe && !vibesFromUrl.includes(vibe) ? [...vibesFromUrl, vibe] : vibesFromUrl;
  const additionalDetails = searchParams.get('additionalDetails') || '';
  const adults = parseInt(searchParams.get('adults') || '2', 10);
  const kids = parseInt(searchParams.get('kids') || '0', 10);
  const travelerCount = Math.max(adults + kids, 1);
  const effectiveEndDate = useMemo(
    () =>
      endDate ||
      (startDate && tripDuration
        ? (() => {
            const d = new Date(`${startDate}T12:00:00`);
            d.setDate(d.getDate() + tripDuration);
            return d.toISOString().split('T')[0];
          })()
        : ''),
    [endDate, startDate, tripDuration]
  );
  const tripTypeParam = searchParams.get('tripType');
  const tripType =
    tripTypeParam === 'multi-city' || tripTypeParam === 'multi-country'
      ? tripTypeParam
      : stops.length > 1
        ? 'multi-city'
        : 'single';
  const numberOfStops = searchParams.get('numberOfStops')
    ? parseInt(searchParams.get('numberOfStops')!, 10)
    : stops.length > 1
      ? stops.length
      : undefined;

  const buildFetchParams = useCallback(
    (options?: { skipCache?: boolean }) => ({
      from,
      destination: destination || null,
      stops: stops.length > 0 ? stops : undefined,
      startDate: startDate || null,
      endDate: endDate || null,
      tripDuration,
      budgetAmount,
      budgetDaily: searchParams.get('budgetDaily')
        ? parseInt(searchParams.get('budgetDaily')!, 10)
        : undefined,
      budgetFlights: searchParams.get('budgetFlights')
        ? parseInt(searchParams.get('budgetFlights')!, 10)
        : undefined,
      budgetHotels: searchParams.get('budgetHotels')
        ? parseInt(searchParams.get('budgetHotels')!, 10)
        : undefined,
      budgetStyle,
      vibes,
      additionalDetails: additionalDetails || null,
      adults,
      kids,
      tripType,
      numberOfStops:
        numberOfStops && numberOfStops >= 2 && numberOfStops <= 15 ? numberOfStops : undefined,
      maxFlightTime: searchParams.get('maxFlightTime')
        ? parseInt(searchParams.get('maxFlightTime')!, 10)
        : undefined,
      skipCache: options?.skipCache ?? false,
    }),
    [
      from,
      destination,
      stops,
      startDate,
      endDate,
      tripDuration,
      budgetAmount,
      budgetStyle,
      vibes,
      additionalDetails,
      adults,
      kids,
      tripType,
      numberOfStops,
      searchParams,
    ]
  );

  const prefsKey = searchParams.toString();
  const [refreshKey, setRefreshKey] = useState(0);
  const skipCacheOnFetch = useRef(false);
  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<Set<string>>(() => new Set());
  const [isSavingSelection, setIsSavingSelection] = useState(false);

  const drillDownView = useMemo(
    () => buildDrillDownView(stops, suggestions, compareSummary, destination),
    [stops, suggestions, compareSummary, destination]
  );

  const primarySuggestion = useMemo(() => {
    if (!suggestions.length) return null;
    const withStops = suggestions.filter((s) => s.stops && s.stops.length >= 2);
    if (withStops.length === 0) return suggestions[0];
    return withStops.reduce((best, s) =>
      (s.stops?.length ?? 0) > (best.stops?.length ?? 0) ? s : best
    );
  }, [suggestions]);

  const toggleCitySelection = useCallback((cityId: string) => {
    setSelectedCityIds((prev) => {
      const next = new Set(prev);
      if (next.has(cityId)) next.delete(cityId);
      else next.add(cityId);
      return next;
    });
  }, []);

  const handleSaveSelected = useCallback(async () => {
    if (!drillDownView || selectedCityIds.size === 0) {
      alert('Select at least one city to save as a trip.');
      return;
    }

    const effectiveEndDate =
      endDate ||
      (startDate && tripDuration
        ? (() => {
            const d = new Date(`${startDate}T12:00:00`);
            d.setDate(d.getDate() + tripDuration);
            return d.toISOString().split('T')[0];
          })()
        : '');

    if (!startDate || !effectiveEndDate) {
      alert(
        'Add trip start and end dates on Plan Trip before saving a multi-stop trip.'
      );
      return;
    }

    const builtStops = buildStopsFromSelection(
      drillDownView.countryGroups,
      selectedCityIds,
      primarySuggestion,
      startDate,
      effectiveEndDate
    );

    if (!builtStops || builtStops.length === 0) {
      alert('Could not build a valid trip from your selection. Try selecting different cities.');
      return;
    }

    const serialized = serializeStopsForDb(builtStops);
    if (!serialized || serialized.length === 0) {
      alert('Could not build a valid trip from your selection. Try selecting different cities.');
      return;
    }

    const countryTitle = titleFromCountries(serialized);
    const destination = tripDestinationSummary(serialized);
    const title = `${countryTitle} Trip`;
    const suggestionPayload = suggestionPayloadForSelection(primarySuggestion, serialized);

    setIsSavingSelection(true);
    try {
      const response = await fetch('/api/trips/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          title,
          budgetAmount,
          estimatedCost: primarySuggestion?.estimatedTotal ?? budgetAmount,
          reason: primarySuggestion?.whyItFits,
          fitScore: primarySuggestion?.fitScore,
          bestTime: primarySuggestion?.seasonality,
          source: 'suggestions',
          tripDuration,
          travelers: adults + kids,
          adults,
          kids,
          startDate,
          endDate: effectiveEndDate,
          vibe: vibe || vibes[0] || undefined,
          suggestion: suggestionPayload,
          stops: serialized,
        }),
      });

      if (response.ok) {
        window.location.href = '/saved';
        return;
      }

      if (response.status === 401) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/auth/login?next=${returnUrl}`;
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      if (response.status === 409) {
        alert(
          `ℹ️ ${errorData.error || 'A similar trip is already saved.'}\n\nCheck your Saved Trips page.`
        );
      } else if (response.status === 429) {
        alert(`🚫 ${errorData.error || 'Save limit reached. Please try again later.'}`);
      } else {
        alert(
          `❌ ${errorData.error || errorData.message || 'Failed to save trip. Please try again.'}`
        );
      }
    } catch (err: unknown) {
      console.error('Error saving selected trip:', err);
      alert('❌ Network error. Please check your connection and try again.');
    } finally {
      setIsSavingSelection(false);
    }
  }, [
    drillDownView,
    selectedCityIds,
    startDate,
    endDate,
    tripDuration,
    primarySuggestion,
    budgetAmount,
    adults,
    kids,
    vibe,
    vibes,
  ]);

  useEffect(() => {
    setActiveLane(null);
    setSelectedCityIds(new Set());
  }, [prefsKey, refreshKey]);

  useEffect(() => {
    fetchSuggestions(buildFetchParams({ skipCache: skipCacheOnFetch.current }));
    skipCacheOnFetch.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey, refreshKey]);

  useEffect(() => {
    if (!error) return;
    const retryAfter = error.retryAfter ?? 5;
    const message = error.status === 429
      ? `Too many requests. Try again in ${retryAfter}s.`
      : error.message;
    addToast(message, {
      variant: error.status === 429 ? 'warning' : 'error',
      durationMs: Math.min(retryAfter * 1000, 10000),
    });
  }, [error, addToast]);
  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRefresh = () => {
    skipCacheOnFetch.current = true;
    setRefreshKey((k) => k + 1);
  };

  const buildTripDetailsParams = useCallback(
    (suggestion: TripSuggestion) => {
      const params = new URLSearchParams({
        destination: suggestion.destination,
        startDate: startDate || '',
        endDate: endDate || '',
        adults: adults.toString(),
        kids: kids.toString(),
        budgetAmount: String(suggestion.estimatedTotal ?? budgetAmount),
      });
      if (from) params.set('from', from);
      if (vibe) params.set('vibe', vibe);
      if (suggestion.description) params.set('description', suggestion.description);
      if (suggestion.whyItFits) params.set('whyItFits', suggestion.whyItFits);
      if (suggestion.fitScore) params.set('fitScore', String(suggestion.fitScore));
      if (suggestion.crowdLevel) params.set('crowdLevel', suggestion.crowdLevel);
      if (suggestion.seasonality) params.set('seasonality', suggestion.seasonality);
      if (suggestion.weather?.temp != null) {
        params.set('weatherTemp', String(suggestion.weather.temp));
      }
      if (suggestion.weather?.icon) params.set('weatherIcon', suggestion.weather.icon);
      if (suggestion.highlights?.length) {
        params.set('highlights', suggestion.highlights.join(','));
      }
      if (suggestion.flightBand) {
        params.set('flightMin', String(suggestion.flightBand.min));
        params.set('flightMax', String(suggestion.flightBand.max));
      }
      if (suggestion.hotelBand) {
        params.set('hotelMin', String(suggestion.hotelBand.min));
        params.set('hotelMax', String(suggestion.hotelBand.max));
        if (suggestion.hotelBand.style) params.set('hotelStyle', suggestion.hotelBand.style);
        if (suggestion.hotelBand.area) params.set('hotelArea', suggestion.hotelBand.area);
      }
      const stopsRaw = searchParams.get('stops');
      if (stopsRaw) params.set('stops', stopsRaw);
      return params;
    },
    [from, startDate, endDate, adults, kids, budgetAmount, vibe, searchParams]
  );

  const formatMoney = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">
            {destination ? `Finding trips to ${destination}…` : 'Finding perfect destinations'}
          </h2>
          <p className="text-gray-600 text-sm">Our AI is analysing your preferences...</p>
          <div className="mt-6 space-y-2">
            {['Checking flight routes...', 'Comparing hotel options...', 'Calculating your budget fit...'].map((msg, i) => (
              <div
                key={msg}
                className="flex items-center gap-2 text-sm text-gray-500 justify-center"
                style={{ animationDelay: `${i * 0.4}s`, animation: 'fadeIn 0.5s ease-in forwards', opacity: 0 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                {msg}
              </div>
            ))}
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/plan-trip" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Trip Suggestions</h1>
                  <p className="text-sm text-gray-500">AI-curated destinations for your preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  ['ai', 'openai', 'cache'].includes(dataSource)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {['ai', 'openai'].includes(dataSource) && '🤖 AI Powered'}
                  {dataSource === 'cache' && '⚡ Cached'}
                  {['mock', 'fallback', 'error_fallback'].includes(dataSource) && '📋 Sample Data'}
                  {isStreaming && ' • streaming...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Preferences Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-black">Your Trip Preferences</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {destination && (
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Destination</span>
                <p className="font-medium text-black">{destination}</p>
              </div>
            )}
            {hasFrom && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">From</span>
                <p className="font-medium text-black">{from}</p>
              </div>
            )}
            {(hasTripDuration || (hasStartDate && hasEndDate)) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Duration</span>
                <p className="font-medium text-black">{tripDuration} days</p>
              </div>
            )}
            {hasBudgetAmount && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Budget (total)</span>
                <p className="font-medium text-black">${budgetAmount.toLocaleString()}</p>
                {travelerCount > 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    ≈ ${Math.round(budgetAmount / travelerCount).toLocaleString()} per person
                  </p>
                )}
              </div>
            )}
            {(hasAdults || hasKids) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-xs uppercase tracking-wide">Travelers</span>
                <p className="font-medium text-black">{adults + kids} people</p>
              </div>
            )}
          </div>

          {!hasFrom && !hasBudgetAmount && !hasAdults && !hasTripDuration && !(hasStartDate && hasEndDate) && (
            <p className="mt-3 text-xs text-gray-500">
              Only destination was provided — use{' '}
              <Link href="/plan-trip" className="text-purple-600 underline">
                Plan Trip
              </Link>{' '}
              to set origin, dates, budget, and travelers for more tailored suggestions.
            </p>
          )}
          
          {/* Additional Details */}
          {additionalDetails && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <span className="text-blue-800 text-xs uppercase tracking-wide font-medium">Additional Details</span>
              <p className="text-blue-900 text-sm mt-1">{additionalDetails}</p>
            </div>
          )}
          
          {/* Vibes */}
          {vibes.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-600 text-xs uppercase tracking-wide">Vibes</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {vibes.map((vibe) => (
                  <span key={vibe} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isStreaming && suggestions.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 mb-4 text-sm text-purple-600 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Finding more destinations for you...</span>
          </div>
        )}

        {compareSummary && (
          <CompareSummaryBlock
            summary={compareSummary}
            activeLane={activeLane}
            onLaneSelect={setActiveLane}
          />
        )}

        {drillDownView && suggestions.length > 0 && (
          <SuggestionsDrillDown
            mode={drillDownView.mode}
            countryGroups={drillDownView.countryGroups}
            primarySuggestion={primarySuggestion}
            compareSummary={compareSummary}
            activeLane={activeLane}
            selectedCityIds={selectedCityIds}
            onToggleCity={toggleCitySelection}
            onSaveSelected={handleSaveSelected}
            isSavingSelection={isSavingSelection}
            tripStart={startDate}
            tripEnd={effectiveEndDate}
            travelerCount={travelerCount}
          />
        )}

        {/* Trip itinerary options — unchanged save/detail cards */}
        {suggestions.length > 0 ? (
          <>
            {drillDownView && (
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🗺️</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black">Trip itinerary options</h2>
                  <p className="text-sm text-gray-500">
                    Full AI itineraries — save or explore details below
                  </p>
                </div>
              </div>
            )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="trip-card bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:border-purple-300 transition-all duration-300 transform hover:scale-[1.02]">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {suggestion.stops?.length ? (
                      <>
                        <h3 className="text-xl font-bold text-black leading-tight">{suggestion.destination}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                            {suggestion.stops.length} cities
                          </span>
                          <span className="ml-2 text-gray-600">{suggestion.stops.join(' → ')}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold text-black leading-tight">{suggestion.city}</h3>
                        <p className="text-sm text-gray-600">{suggestion.country}</p>
                      </>
                    )}
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{suggestion.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold mb-2 inline-block shadow-md">
                      {suggestion.fitScore}/100 Fit
                    </div>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                      {formatMoney(suggestion.estimatedTotal, suggestion.currency ?? 'USD')}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      est. total{travelerCount > 1 ? ` (${travelerCount} travellers)` : ''}
                    </div>
                    {travelerCount > 1 && (
                      <div className="text-xs text-gray-500 mt-1 font-medium">
                        {formatMoney(Math.round(suggestion.estimatedTotal / travelerCount), suggestion.currency ?? 'USD')} per person
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] ml-auto leading-tight">
                      AI estimate — verify prices before booking
                    </p>
                  </div>
                </div>

                {/* Weather & Crowds */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{suggestion.weather.icon}</span>
                      <span className="text-sm text-gray-700">{suggestion.weather.temp}°C</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCrowdLevelColor(suggestion.crowdLevel)}`}>
                      Crowd: {suggestion.crowdLevel}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{suggestion.seasonality}</div>
                </div>

                {/* Sample itinerary teaser */}
                {(() => {
                  const teaser = getItineraryTeaser(suggestion);
                  if (!teaser.length) return null;
                  return (
                    <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50/80 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                        Sample itinerary
                      </div>
                      <ul className="space-y-1.5">
                        {teaser.map((line, index) => (
                          <li
                            key={`${suggestion.id}-teaser-${index}`}
                            className="text-sm text-stone-700 flex items-start gap-2"
                          >
                            <span className="text-purple-500 shrink-0">▸</span>
                            <span className="line-clamp-1">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Price bands */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-600 text-xs mb-1">✈️ Airfare</div>
                    <div className="font-semibold text-sm">
                      {formatMoney(suggestion.flightBand.min, suggestion.currency ?? 'USD')}-
                      {formatMoney(suggestion.flightBand.max, suggestion.currency ?? 'USD')}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-600 text-xs mb-1">🏨 Hotel</div>
                    <div className="font-semibold text-sm">
                      {formatMoney(suggestion.hotelBand.min, suggestion.currency ?? 'USD')}-
                      {formatMoney(suggestion.hotelBand.max, suggestion.currency ?? 'USD')}/night
                    </div>
                    <div className="text-[11px] text-gray-500 line-clamp-1">{suggestion.hotelBand.style} • {suggestion.hotelBand.area}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-gray-600 text-xs mb-1">🚗 Transport</div>
                    <div className="font-semibold text-sm">Included</div>
                    <div className="text-[11px] text-gray-500 line-clamp-1">Local transit + transfers (est.)</div>
                  </div>
                </div>
              </div>

                {/* Highlights */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestion.highlights.slice(0, 4).map((highlight, index) => (
                    <span
                      key={`${suggestion.id}-highlight-${index}`}
                      className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium hover:from-purple-200 hover:to-blue-200 transition-all cursor-default shadow-sm"
                    >
                      ✨ {highlight}
                    </span>
                  ))}
                </div>

                <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                  <p className="text-sm text-blue-900 font-medium line-clamp-2">{suggestion.whyItFits}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={async (event) => {
                      const button = event.currentTarget;
                      const originalText = button.textContent ?? 'See Details';
                      button.disabled = true;
                      button.textContent = '⏳ Loading...';
                      button.classList.add('opacity-50', 'cursor-not-allowed');

                      const params = buildTripDetailsParams(suggestion);
                      const previewPath = `/trip-details/new?${params.toString()}`;

                      try {
                        const resolvedStops = resolveStopsForSave(
                          suggestion,
                          stops,
                          startDate || '',
                          endDate || ''
                        );
                        const response = await fetch('/api/trips', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            suggestion,
                            selections: [],
                            destination: suggestion.destination,
                            startDate: startDate || undefined,
                            endDate: endDate || undefined,
                            budgetAmount,
                            from,
                            vibe: vibe || undefined,
                            travelers: { adults, kids },
                            stops: resolvedStops,
                          }),
                        });

                        if (response.status === 401) {
                          window.location.href = previewPath;
                          return;
                        }

                        if (!response.ok) {
                          window.location.href = previewPath;
                          return;
                        }

                        const trip = await response.json();
                        const tripId = trip.id ?? trip.trip?.id ?? 'new';
                        window.location.href = `/trip-details/${tripId}?${params.toString()}`;
                      } catch (error: unknown) {
                        console.error('Error creating trip:', error);
                        if (
                          error instanceof TypeError &&
                          error.message === 'Failed to fetch'
                        ) {
                          window.location.href = previewPath;
                          return;
                        }
                        button.disabled = false;
                        button.textContent = originalText;
                        button.classList.remove('opacity-50', 'cursor-not-allowed');
                        alert('Could not open trip details. Please try again.');
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 text-center shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    👁️ See Details
                  </button>
                  <button
                    onClick={async (event) => {
                      const button = event.currentTarget;
                      const originalText = button.textContent;
                      button.disabled = true;
                      button.textContent = '💾 Saving...';
                      button.classList.add('opacity-50', 'cursor-not-allowed');
                      
                      try {
                        const resolvedStops = resolveStopsForSave(
                          suggestion,
                          stops,
                          startDate || '',
                          endDate || ''
                        );
                        const response = await fetch('/api/trips/saved', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            destination: suggestion.destination,
                            budgetAmount,
                            estimatedCost: suggestion.estimatedTotal,
                            reason: suggestion.whyItFits,
                            fitScore: suggestion.fitScore,
                            bestTime: suggestion.seasonality,
                            source: 'suggestions',
                            tripDuration,
                            travelers: adults + kids,
                            adults,
                            kids,
                            startDate: startDate || undefined,
                            endDate: endDate || undefined,
                            vibe: vibe || vibes[0] || undefined,
                            suggestion,
                            stops: resolvedStops,
                          }),
                        });

                        if (response.ok) {
                          const result = await response.json();
                          if (button) {
                            button.textContent = '✅ Saved!';
                            button.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                            button.classList.add('bg-green-600');
                          }
                          setTimeout(() => {
                            window.location.href = '/saved';
                          }, 1000);
                        } else if (response.status === 401) {
                          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                          window.location.href = `/auth/login?next=${returnUrl}`;
                        } else if (response.status === 429) {
                          const errorData = await response.json().catch(() => ({}));
                          alert(`🚫 ${errorData.error || 'Save limit reached. Please try again later.'}\n\nUpgrade to Pro to save unlimited trips!`);
                          if (button) {
                            button.disabled = false;
                            button.textContent = originalText || '💾 Save Trip';
                            button.classList.remove('opacity-50', 'cursor-not-allowed');
                          }
                        } else if (response.status === 409) {
                          const errorData = await response.json().catch(() => ({}));
                          alert(`ℹ️ ${errorData.error || 'This destination is already saved.'}\n\nCheck your Saved Trips page.`);
                          if (button) {
                            button.disabled = false;
                            button.textContent = originalText || '💾 Save Trip';
                            button.classList.remove('opacity-50', 'cursor-not-allowed');
                          }
                        } else {
                          const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
                          const errorMessage = errorData.error || errorData.message || 'Failed to save trip. Please try again.';
                          alert(`❌ Error saving trip: ${errorMessage}\n\nIf this persists, please check:\n1. You are logged in\n2. Your internet connection\n3. Try refreshing the page`);
                          if (button) {
                            button.disabled = false;
                            button.textContent = originalText || '💾 Save Trip';
                            button.classList.remove('opacity-50', 'cursor-not-allowed');
                          }
                        }
                      } catch (error: any) {
                        console.error('Error saving trip:', error);
                        const errorMessage = error?.message || 'Network error. Please check your connection and try again.';
                        alert(`❌ Error saving trip: ${errorMessage}`);
                        if (button) {
                          button.disabled = false;
                          button.textContent = originalText || '💾 Save Trip';
                          button.classList.remove('opacity-50', 'cursor-not-allowed');
                        }
                      }
                    }}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-all duration-200 text-center shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    💾 Save Trip
                  </button>
                </div>

                {/* Affiliate footer */}
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Prices via <span className="text-blue-600">Booking.com</span> • <span className="text-blue-600">Skyscanner</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {process.env.NEXT_PUBLIC_DEMO_MODE === "true" 
                ? "Sign in or use Preview to get AI-powered travel recommendations."
                : "We're working on finding the perfect destinations for you. This may take a moment."
              }
            </p>
            <Link
              href="/plan-trip"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Plan a New Trip
            </Link>
          </div>
        )}

        {/* Load More */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleRefresh}
            disabled={isLoading || isStreaming}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isStreaming ? '🔄 Generating...' : '🔄 Regenerate suggestions'}
          </button>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function SuggestionsPage() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <ErrorBoundary onReset={() => setResetKey((prev) => prev + 1)}>
        <SuggestionsContent key={resetKey} />
      </ErrorBoundary>
    </Suspense>
  );
}
