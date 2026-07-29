'use client';

import { useCallback } from 'react';
import { deriveNightsFromStop } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

const DEFAULT_NIGHTS = 3;
const MAX_STOPS = 6;

function uid() {
  return 'stop-' + Math.random().toString(36).slice(2, 9);
}

function fmtShort(d: string) {
  if (!d) return '—';
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

interface ChainedStopsEditorProps {
  stops: TripStop[];
  onChange: (stops: TripStop[]) => void;
  errors?: Record<string, string>;
}

export default function ChainedStopsEditor({
  stops,
  onChange,
  errors = {},
}: ChainedStopsEditorProps) {
  const handleDestinationChange = useCallback(
    (id: string, value: string) => {
      onChange(stops.map((s) => (s.id === id ? { ...s, destination: value } : s)));
    },
    [stops, onChange]
  );

  const handleNightsChange = useCallback(
    (id: string, raw: string) => {
      const parsed = parseInt(raw, 10);
      const nights = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
      onChange(stops.map((s) => (s.id === id ? { ...s, nights } : s)));
    },
    [stops, onChange]
  );

  const handleAdd = useCallback(() => {
    if (stops.length >= MAX_STOPS) return;
    onChange([
      ...stops,
      {
        id: uid(),
        destination: '',
        startDate: '',
        endDate: '',
        nights: DEFAULT_NIGHTS,
      },
    ]);
  }, [stops, onChange]);

  const handleRemove = useCallback(
    (id: string) => {
      if (stops.length <= 1) return;
      onChange(stops.filter((s) => s.id !== id));
    },
    [stops, onChange]
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const idx = stops.findIndex((s) => s.id === id);
      if (idx <= 0) return;
      const next = [...stops];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      onChange(next);
    },
    [stops, onChange]
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const idx = stops.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= stops.length - 1) return;
      const next = [...stops];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      onChange(next);
    },
    [stops, onChange]
  );

  return (
    <div className="space-y-4">
      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;
        const error = errors[stop.id];
        const nightsVal = deriveNightsFromStop(stop);

        return (
          <div
            key={stop.id}
            className={`rounded-2xl border bg-white shadow-sm p-4 ${
              error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {isFirst ? 'First stop' : `Stop ${index + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={() => handleMoveUp(stop.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                {!isLast && (
                  <button
                    type="button"
                    onClick={() => handleMoveDown(stop.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(stop.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Remove stop"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="e.g. Hanoi, Vietnam"
                value={stop.destination}
                onChange={(e) => handleDestinationChange(stop.id, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none ${
                  error ? 'border-rose-300' : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                }`}
              />
              {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nights</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={nightsVal}
                  onChange={(e) => handleNightsChange(stop.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Dates (computed)</label>
                <div className="px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600">
                  {stop.startDate && stop.endDate
                    ? `${fmtShort(stop.startDate)} – ${fmtShort(stop.endDate)}`
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {stops.length < MAX_STOPS && (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50"
        >
          + Add another destination ({stops.length}/{MAX_STOPS})
        </button>
      )}
    </div>
  );
}
