'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HOME_TRIP_PROMPT_CHIPS, planTripHrefFromPrompt } from '@/lib/home-trip-hints';

export default function StartTripFromPrompt({
  variant,
}: {
  variant: 'empty' | 'compact';
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const isEmpty = variant === 'empty';

  function go(text: string) {
    router.push(planTripHrefFromPrompt(text));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(prompt);
  }

  const cardClass = isEmpty
    ? 'bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 sm:px-8 max-w-3xl mx-auto'
    : 'bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 sm:px-5 mb-8';

  return (
    <div className={cardClass}>
      {isEmpty ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">No planned trips yet</h2>
          <p className="text-sm text-slate-500 mb-5">
            Tap a suggestion or type an idea — we&apos;ll open the planner with it filled in.
          </p>
        </>
      ) : (
        <p className="text-sm font-semibold text-slate-800 mb-3">Start a new trip from an idea</p>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className={`flex flex-col sm:flex-row items-stretch gap-2 ${isEmpty ? 'sm:gap-3' : ''}`}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 3 weeks in Indonesia and Thailand — temples, food, not too rushed"
            className={`flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 ${
              isEmpty ? 'px-4 py-3 text-base' : 'px-3.5 py-2.5 text-sm'
            }`}
          />
          <button
            type="submit"
            className={`shrink-0 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors ${
              isEmpty ? 'px-5 py-3 text-sm' : 'px-4 py-2.5 text-sm'
            }`}
          >
            Plan my trip
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {HOME_TRIP_PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => go(chip)}
              className={`rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left touch-manipulation ${
                isEmpty
                  ? 'px-3.5 py-2 text-sm min-h-[44px]'
                  : 'px-3 py-1.5 text-xs min-h-[36px]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
