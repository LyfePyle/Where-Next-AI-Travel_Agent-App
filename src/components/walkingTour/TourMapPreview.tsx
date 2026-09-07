'use client';

import { useId, useMemo, useState } from 'react';
import type { TourStop } from '@/hooks/useWalkingTour';
import {
  buildTourPreviewStaticUrl,
  previewBboxForStops,
  projectTourStopsToPreview,
} from '@/lib/tour-map-static-preview';

type TourMapPreviewProps = {
  stops: TourStop[];
  className?: string;
};

function Overlay({
  points,
  showGrid,
  gridId,
}: {
  points: { x: number; y: number; order: number }[];
  showGrid: boolean;
  gridId: string;
}) {
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <>
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        {showGrid ? (
          <>
            <defs>
              <pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.3" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#${gridId})`} />
          </>
        ) : null}
        {points.length >= 2 ? (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            strokeLinecap="round"
            opacity="0.85"
          />
        ) : null}
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
    </>
  );
}

/** Static Mapbox tile + overlay (no Mapbox GL instance per card). */
export default function TourMapPreview({ stops, className = '' }: TourMapPreviewProps) {
  const gridId = useId().replace(/:/g, '');
  const [tileFailed, setTileFailed] = useState(false);

  const bbox = useMemo(() => previewBboxForStops(stops), [stops]);
  const points = useMemo(() => projectTourStopsToPreview(stops, bbox), [stops, bbox]);
  const tileUrl = useMemo(
    () => (tileFailed ? null : buildTourPreviewStaticUrl(stops, process.env.NEXT_PUBLIC_MAPBOX_TOKEN)),
    [stops, tileFailed]
  );

  if (points.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${className}`}
      >
        <span className="text-xs text-slate-500">Map preview</span>
      </div>
    );
  }

  const showTile = Boolean(tileUrl);

  return (
    <div className={`relative overflow-hidden bg-[#e8eef4] ${className}`}>
      {showTile ? (
        // eslint-disable-next-line @next/next/no-img-element -- Mapbox static URL; overlay alignment needs object-fill
        <img
          src={tileUrl!}
          alt=""
          className="absolute inset-0 h-full w-full object-fill"
          draggable={false}
          onError={() => setTileFailed(true)}
        />
      ) : null}
      <Overlay points={points} showGrid={!showTile} gridId={gridId} />
      {showTile ? (
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-white/75 px-1 py-px text-[8px] leading-tight text-slate-600">
          © Mapbox © OSM
        </span>
      ) : null}
    </div>
  );
}
