'use client';

import { useCallback } from 'react';
import { TripStop } from '@/types/trip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return 'stop-' + Math.random().toString(36).slice(2, 9);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function makeEmptyStop(offsetDays = 0): TripStop {
  return {
    id: uid(),
    destination: '',
    startDate: inDays(offsetDays),
    endDate: inDays(offsetDays + 3),
  };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const IconRemove = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconArrowDown = () => (
  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const IconHome = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// StopCard
// ---------------------------------------------------------------------------

function StopCard({
  stop,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  error,
}: {
  stop: TripStop;
  index: number;
  total: number;
  onChange: (id: string, field: keyof TripStop, value: string) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  error?: string;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const label = isFirst ? 'Origin' : `Stop ${index}`;
  const placeholder = isFirst ? 'e.g. New York, US' : 'e.g. Paris, France';

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-[22px] top-full w-px h-4 bg-slate-200 z-10" />
      )}

      <div className={`rounded-2xl border transition-all ${
        error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'
      } shadow-sm`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isFirst ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {isFirst ? <IconHome /> : index}
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => onMoveUp(stop.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Move up"
                >
                  <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {!isLast && (
                <button
                  type="button"
                  onClick={() => onMoveDown(stop.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Move down"
                >
                  <IconArrowDown />
                </button>
              )}
              {total > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(stop.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove stop"
                >
                  <IconRemove />
                </button>
              )}
            </div>
          </div>

          <div className="mb-3">
            <input
              type="text"
              placeholder={placeholder}
              value={stop.destination}
              onChange={(e) => onChange(stop.id, 'destination', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all ${
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
              }`}
            />
            {error && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                {isFirst ? 'Departure' : 'Arrive'}
              </label>
              <input
                type="date"
                value={stop.startDate}
                min={today()}
                onChange={(e) => onChange(stop.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                {isLast ? 'Return' : 'Leave'}
              </label>
              <input
                type="date"
                value={stop.endDate}
                min={stop.startDate || today()}
                onChange={(e) => onChange(stop.id, 'endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StopsBuilder — exported component
// ---------------------------------------------------------------------------

interface StopsBuilderProps {
  stops: TripStop[];
  onChange: (stops: TripStop[]) => void;
  errors?: Record<string, string>;
  maxStops?: number;
}

export default function StopsBuilder({
  stops,
  onChange,
  errors = {},
  maxStops = 6,
}: StopsBuilderProps) {
  const handleFieldChange = useCallback(
    (id: string, field: keyof TripStop, value: string) => {
      onChange(stops.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    },
    [stops, onChange]
  );

  const handleAdd = useCallback(() => {
    if (stops.length >= maxStops) return;
    const last = stops[stops.length - 1];
    const newStart = last?.endDate ?? inDays(7);
    const newEnd = (() => {
      const d = new Date(newStart);
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })();
    onChange([
      ...stops,
      { id: uid(), destination: '', startDate: newStart, endDate: newEnd },
    ]);
  }, [stops, onChange, maxStops]);

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
      {stops.map((stop, index) => (
        <StopCard
          key={stop.id}
          stop={stop}
          index={index}
          total={stops.length}
          onChange={handleFieldChange}
          onRemove={handleRemove}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          error={errors[stop.id]}
        />
      ))}

      {stops.length < maxStops && (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all group"
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all">
            <IconPlus />
          </span>
          Add another destination
          {stops.length >= 2 && (
            <span className="text-xs text-slate-400 font-normal">
              ({stops.length}/{maxStops})
            </span>
          )}
        </button>
      )}

      {stops.length >= maxStops && (
        <p className="text-xs text-slate-400 text-center">
          Maximum {maxStops} destinations reached.
        </p>
      )}
    </div>
  );
}
