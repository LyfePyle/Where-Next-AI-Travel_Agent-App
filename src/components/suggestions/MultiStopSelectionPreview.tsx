'use client';

import type { MultiStopSelectionPreview as PreviewData } from '@/lib/suggestion-drilldown';

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function crowdColor(level?: string) {
  if (level === 'Low') return 'bg-green-100 text-green-800';
  if (level === 'High') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export default function MultiStopSelectionPreview({
  preview,
  travelerCount,
}: {
  preview: PreviewData;
  travelerCount: number;
}) {
  return (
    <div className="mb-4 trip-card bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 to-blue-50/80">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 mb-1">
              Your multi-stop trip preview
            </p>
            <h3 className="text-xl font-bold text-black leading-tight">{preview.routeTitle}</h3>
            <p className="text-sm text-gray-600 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                {preview.stops.length} cities
              </span>
              <span className="ml-2">
                {preview.nightSplit.map((n) => `${n.city} ${n.nights}n`).join(' · ')}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            {preview.fitScore != null && preview.fitScore > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold mb-2 inline-block shadow-md">
                {preview.fitScore}/100 Fit
              </div>
            )}
            {preview.estimatedTotal > 0 && (
              <>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {formatMoney(preview.estimatedTotal, preview.currency)}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  est. total{travelerCount > 1 ? ` (${travelerCount} travellers)` : ''}
                </div>
                {travelerCount > 1 && (
                  <div className="text-xs text-gray-500 mt-1 font-medium">
                    {formatMoney(
                      Math.round(preview.estimatedTotal / travelerCount),
                      preview.currency
                    )}{' '}
                    per person
                  </div>
                )}
              </>
            )}
            <p className="text-[10px] text-gray-400 mt-1 max-w-[140px] ml-auto leading-tight">
              AI estimate — verify prices before booking
            </p>
          </div>
        </div>

        {(preview.weather?.icon || preview.crowdLevel || preview.seasonality) && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {preview.weather?.icon && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-lg">{preview.weather.icon}</span>
                {preview.weather.temp != null && <span>{preview.weather.temp}°C</span>}
              </div>
            )}
            {preview.crowdLevel && (
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${crowdColor(preview.crowdLevel)}`}
              >
                Crowd: {preview.crowdLevel}
              </div>
            )}
            {preview.seasonality && (
              <div className="text-xs text-gray-600">{preview.seasonality}</div>
            )}
          </div>
        )}

        {preview.sampleDays.length > 0 && (
          <div className="mt-3 rounded-lg border border-stone-200 bg-white/80 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
              Sample days across cities
            </div>
            <ul className="space-y-1.5">
              {preview.sampleDays.map((line, index) => (
                <li
                  key={`preview-day-${index}`}
                  className="text-sm text-stone-700 flex items-start gap-2"
                >
                  <span className="text-purple-500 shrink-0">▸</span>
                  <span className="line-clamp-2">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(preview.flightBand || preview.hotelBand) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-sm">
            {preview.flightBand && (
              <div className="bg-white/90 p-2 rounded-lg border border-gray-100">
                <div className="text-gray-600 text-xs mb-1">✈️ Airfare</div>
                <div className="font-semibold text-sm">
                  {formatMoney(preview.flightBand.min, preview.currency)}-
                  {formatMoney(preview.flightBand.max, preview.currency)}
                </div>
              </div>
            )}
            {preview.hotelBand && (
              <div className="bg-white/90 p-2 rounded-lg border border-gray-100">
                <div className="text-gray-600 text-xs mb-1">🏨 Hotel</div>
                <div className="font-semibold text-sm">
                  {formatMoney(preview.hotelBand.min, preview.currency)}-
                  {formatMoney(preview.hotelBand.max, preview.currency)}/night
                </div>
                {(preview.hotelBand.style || preview.hotelBand.area) && (
                  <div className="text-[11px] text-gray-500 line-clamp-1">
                    {[preview.hotelBand.style, preview.hotelBand.area].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
            )}
            <div className="bg-white/90 p-2 rounded-lg border border-gray-100 hidden sm:block">
              <div className="text-gray-600 text-xs mb-1">🚗 Transport</div>
              <div className="font-semibold text-sm">Included</div>
              <div className="text-[11px] text-gray-500 line-clamp-1">
                Local transit + transfers (est.)
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
        {preview.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {preview.highlights.slice(0, 4).map((highlight, index) => (
              <span
                key={`preview-highlight-${index}`}
                className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm"
              >
                ✨ {highlight}
              </span>
            ))}
          </div>
        )}
        {preview.whyItFits && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 shadow-sm">
            <p className="text-sm text-blue-900 font-medium line-clamp-3">{preview.whyItFits}</p>
          </div>
        )}
      </div>
    </div>
  );
}
