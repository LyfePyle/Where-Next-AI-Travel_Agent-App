'use client';

import type { TourStop } from '@/hooks/useWalkingTour';
import TourMapPreview from '@/components/walkingTour/TourMapPreview';
import { MapPin } from 'lucide-react';

export type WalkingTourSampleCardProps = {
  title: string;
  location: string;
  summary: string;
  theme?: string;
  stops: TourStop[];
  loading?: boolean;
  onSelect: () => void;
};

export default function WalkingTourSampleCard({
  title,
  location,
  summary,
  theme,
  stops,
  loading = false,
  onSelect,
}: WalkingTourSampleCardProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-36 animate-pulse bg-gray-100" />
        <div className="space-y-2 p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!loading && stops.length === 0}
      className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <TourMapPreview stops={stops} className="h-36 w-full" />
      <div className="p-4">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {theme ? (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              {theme}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {location}
          </span>
        </div>
        <h3 className="mb-1 line-clamp-1 text-base font-bold text-gray-900 group-hover:text-indigo-700">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm text-gray-600">{summary}</p>
        <p className="mt-2 text-xs font-medium text-indigo-600">
          {stops.length} stops · View tour →
        </p>
      </div>
    </button>
  );
}
