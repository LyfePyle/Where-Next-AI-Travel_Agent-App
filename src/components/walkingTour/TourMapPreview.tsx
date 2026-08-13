'use client';

import type { TourStop } from '@/hooks/useWalkingTour';

type TourMapPreviewProps = {
  stops: TourStop[];
  className?: string;
};

function projectStops(stops: TourStop[]) {
  const valid = stops.filter((s) => s.lat && s.lng);
  if (valid.length === 0) return [];

  const lats = valid.map((s) => s.lat);
  const lngs = valid.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;
  const pad = 0.12;

  return valid
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((stop, index) => {
      const x = pad + ((stop.lng - minLng) / lngSpan) * (1 - pad * 2);
      const y = pad + (1 - (stop.lat - minLat) / latSpan) * (1 - pad * 2);
      return { x: x * 100, y: y * 100, order: stop.order ?? index + 1 };
    });
}

/** Lightweight dot-map preview from stop coordinates (no Mapbox instance per card). */
export default function TourMapPreview({ stops, className = '' }: TourMapPreviewProps) {
  const points = projectStops(stops);

  if (points.length === 0) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className}`}
      >
        <span className="text-xs text-slate-500">Map preview</span>
      </div>
    );
  }

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`relative overflow-hidden bg-[#e8eef4] ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.3" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {points.length >= 2 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            strokeLinecap="round"
            opacity="0.85"
          />
        )}
      </svg>
      {points.map((p) => (
        <span
          key={`${p.order}-${p.x}-${p.y}`}
          className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white shadow-sm"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.order}
        </span>
      ))}
    </div>
  );
}
