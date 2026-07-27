'use client';

import type { DrillDownCity } from '@/lib/suggestion-drilldown';

interface SuggestionCityCardProps {
  city: DrillDownCity;
  selected: boolean;
  onToggle: () => void;
}

export default function SuggestionCityCard({
  city,
  selected,
  onToggle,
}: SuggestionCityCardProps) {
  const displayName = city.city || city.destination.split(',')[0].trim();
  const country = city.country;
  const preview = city.preview;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-200 scale-[1.01]'
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-black">{displayName}</h3>
              {selected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs font-medium">
                  ✓ Selected
                </span>
              )}
            </div>
            {country && <p className="text-sm text-gray-600 mt-0.5">{country}</p>}
            {(preview?.description || preview?.whyItFits) && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {preview.description || preview.whyItFits}
              </p>
            )}
          </div>
          {preview?.fitScore != null && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0">
              {preview.fitScore}/100
            </div>
          )}
        </div>

        {preview?.highlights && preview.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {preview.highlights.slice(0, 3).map((h) => (
              <span
                key={h}
                className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                ✨ {h}
              </span>
            ))}
          </div>
        )}

        {preview?.hotelBand && (
          <div className="mt-3 bg-gray-50 p-2 rounded-lg text-xs">
            <span className="text-gray-600">🏨 </span>
            <span className="font-semibold text-gray-800">
              ${preview.hotelBand.min}–${preview.hotelBand.max}/night
            </span>
            {preview.hotelBand.area && (
              <span className="text-gray-500 ml-1">• {preview.hotelBand.area}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
