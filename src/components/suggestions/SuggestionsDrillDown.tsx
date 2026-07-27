'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CountryStopGroup } from '@/lib/trip-stops';
import {
  citiesForGroups,
  laneFocusCountries,
  type DrillDownMode,
} from '@/lib/suggestion-drilldown';
import type { CompareSummary } from '@/lib/compare-summary';
import type { TripSuggestion } from '@/hooks/useStreamingSuggestions';
import SuggestionCityCard from '@/components/suggestions/SuggestionCityCard';

interface SuggestionsDrillDownProps {
  mode: DrillDownMode;
  countryGroups: CountryStopGroup[];
  primarySuggestion: TripSuggestion | null;
  compareSummary: CompareSummary | null;
  activeLane: string | null;
  selectedCityIds: Set<string>;
  onToggleCity: (cityId: string) => void;
}

export default function SuggestionsDrillDown({
  mode,
  countryGroups,
  primarySuggestion,
  compareSummary,
  activeLane,
  selectedCityIds,
  onToggleCity,
}: SuggestionsDrillDownProps) {
  const citiesByCountry = useMemo(
    () => citiesForGroups(countryGroups, primarySuggestion),
    [countryGroups, primarySuggestion]
  );

  const allCountryNames = countryGroups.map((g) => g.country);

  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    () => new Set(allCountryNames)
  );

  // Sync expansion when lane changes or groups load
  useEffect(() => {
    const focus = laneFocusCountries(activeLane, compareSummary);
    if (focus === null) {
      setExpandedCountries(new Set(allCountryNames));
    } else {
      const matched = allCountryNames.filter((name) =>
        focus.some(
          (f) =>
            name.toLowerCase().includes(f.toLowerCase()) ||
            f.toLowerCase().includes(name.toLowerCase())
        )
      );
      setExpandedCountries(new Set(matched.length > 0 ? matched : allCountryNames));
    }
  }, [activeLane, compareSummary, allCountryNames.join('|')]);

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  };

  const renderCityGrid = (country: string) => {
    const cities = citiesByCountry.get(country) ?? [];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 pb-1">
        {cities.map((city) => (
          <SuggestionCityCard
            key={city.id}
            city={city}
            selected={selectedCityIds.has(city.id)}
            onToggle={() => onToggleCity(city.id)}
          />
        ))}
      </div>
    );
  };

  if (mode === 'single-country') {
    const country = countryGroups[0]?.country ?? 'Places';
    const cities = citiesByCountry.get(country) ?? [];
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-sm">📍</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black">Pick your cities</h2>
            <p className="text-sm text-gray-500">
              Select one or more places for your trip — saving comes in a later step
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cities.map((city) => (
            <SuggestionCityCard
              key={city.id}
              city={city}
              selected={selectedCityIds.has(city.id)}
              onToggle={() => onToggleCity(city.id)}
            />
          ))}
        </div>
        {selectedCityIds.size > 0 && (
          <p className="mt-3 text-sm text-purple-700 font-medium">
            {selectedCityIds.size} {selectedCityIds.size === 1 ? 'city' : 'cities'} selected
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <span className="text-sm">🌎</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-black">Pick your countries & cities</h2>
          <p className="text-sm text-gray-500">
            Expand a country to browse its cities — tap to select (no save yet)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {countryGroups.map((group) => {
          const isExpanded = expandedCountries.has(group.country);
          const placeCount = group.stops.length;
          const selectedInCountry = group.stops.filter((s) =>
            selectedCityIds.has(s.id)
          ).length;

          return (
            <div
              key={group.country}
              className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCountry(group.country)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={isExpanded}
              >
                <div>
                  <h3 className="text-base font-bold text-black">{group.country}</h3>
                  <p className="text-sm text-gray-600">
                    {placeCount} {placeCount === 1 ? 'place' : 'places'}
                    {selectedInCountry > 0 && (
                      <span className="ml-2 text-purple-600 font-medium">
                        · {selectedInCountry} selected
                      </span>
                    )}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-white">
                  {renderCityGrid(group.country)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedCityIds.size > 0 && (
        <p className="mt-3 text-sm text-purple-700 font-medium">
          {selectedCityIds.size} {selectedCityIds.size === 1 ? 'city' : 'cities'} selected
          across {countryGroups.length}{' '}
          {countryGroups.length === 1 ? 'country' : 'countries'}
        </p>
      )}
    </section>
  );
}
