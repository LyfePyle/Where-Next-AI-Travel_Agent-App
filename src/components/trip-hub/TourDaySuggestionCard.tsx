'use client';

import { useState } from 'react';
import type { ItineraryBlock } from '@/types/itinerary';

export type TourDaySuggestionPayload = {
  title: string;
  summary?: string;
  theme?: string;
  stopCount: number;
  extraStopNames: string[];
  blocks: ItineraryBlock[];
};

interface TourDaySuggestionCardProps {
  title: string;
  summary?: string;
  theme?: string;
  stopCount: number;
  extraStopNames: string[];
  loading?: boolean;
  swapping?: boolean;
  error?: string | null;
  confirmOpen?: boolean;
  alternatives?: TourDaySuggestionPayload[] | null;
  hasExistingBlocks: boolean;
  onUse: () => void;
  onConfirmUse: () => void;
  onCancelConfirm: () => void;
  onDismiss: () => void;
  onSeeOthers: () => void;
  onPickAlternative: (option: TourDaySuggestionPayload) => void;
}

export default function TourDaySuggestionCard({
  title,
  summary,
  theme,
  stopCount,
  extraStopNames,
  loading,
  swapping,
  error,
  confirmOpen,
  alternatives,
  hasExistingBlocks,
  onUse,
  onConfirmUse,
  onCancelConfirm,
  onDismiss,
  onSeeOthers,
  onPickAlternative,
}: TourDaySuggestionCardProps) {
  const [pickedTitle, setPickedTitle] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="mt-2 mb-1 rounded-lg border border-[#EAE3D5] bg-[#FAFAF9] p-3">
        <p className="text-xs font-medium text-[#78716C]">Looking for a walking tour…</p>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-1 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
      <p className="mb-1 text-xs font-medium text-indigo-900">Walking tour idea</p>
      <p className="text-sm font-medium text-indigo-950">{title}</p>
      {(theme || stopCount > 0) && (
        <p className="mt-0.5 text-xs text-indigo-800">
          {[theme, stopCount ? `${Math.min(stopCount, 6)}-stop walk` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {summary && <p className="mt-1 text-sm text-indigo-800">{summary}</p>}
      {extraStopNames.length > 0 && (
        <p className="mt-1 text-xs text-indigo-700">
          Optional extras: {extraStopNames.join(', ')}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}

      {confirmOpen ? (
        <div className="mt-2">
          <p className="mb-2 text-sm text-indigo-950">
            {hasExistingBlocks
              ? 'Replace this day’s current plan with this walking tour? Existing blocks will be overwritten. Travel notes stay.'
              : 'Use this walking tour as this day’s plan?'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirmUse}
              className="min-h-[44px] rounded-lg bg-indigo-700 px-3 text-[13px] font-medium text-white touch-manipulation"
            >
              Replace this day
            </button>
            <button
              type="button"
              onClick={onCancelConfirm}
              className="min-h-[44px] rounded-lg border border-indigo-200 bg-white px-3 text-[13px] font-medium text-indigo-900 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onUse}
            className="min-h-[44px] rounded-lg bg-indigo-700 px-3 text-[13px] font-medium text-white touch-manipulation"
          >
            Use this day
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] rounded-lg border border-indigo-200 bg-white px-3 text-[13px] font-medium text-indigo-900 touch-manipulation"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onSeeOthers}
            disabled={swapping}
            className="min-h-[44px] rounded-lg border border-indigo-200 bg-white px-3 text-[13px] font-medium text-indigo-900 touch-manipulation disabled:opacity-50"
          >
            {swapping ? 'Loading tours…' : 'See other tours'}
          </button>
        </div>
      )}

      {alternatives && alternatives.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-indigo-900">Pick a different tour — still needs Accept</p>
          {alternatives.map((opt) => (
            <button
              key={opt.title}
              type="button"
              onClick={() => {
                setPickedTitle(opt.title);
                onPickAlternative(opt);
              }}
              className={`block w-full rounded-md border px-2 py-2 text-left text-sm touch-manipulation ${
                pickedTitle === opt.title
                  ? 'border-indigo-400 bg-white'
                  : 'border-indigo-100 bg-white/70'
              }`}
            >
              <span className="font-medium text-indigo-950">{opt.title}</span>
              {opt.summary && (
                <span className="mt-0.5 block text-xs text-indigo-800">{opt.summary}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
