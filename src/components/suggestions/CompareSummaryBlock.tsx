'use client';

import type { CompareSummary } from '@/lib/compare-summary';

interface CompareSummaryBlockProps {
  summary: CompareSummary;
}

export default function CompareSummaryBlock({ summary }: CompareSummaryBlockProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-black">Narrow it down</h2>
          <p className="text-sm text-gray-500">Three ways to use your trip — pick a lane, then explore the cards below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.options.map((option) => (
          <div
            key={option.label}
            className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 flex flex-col h-full hover:border-purple-200 transition-colors"
          >
            <h3 className="text-base font-bold text-black mb-1">{option.label}</h3>
            {option.forWho && (
              <p className="text-xs text-gray-600 mb-3">{option.forWho}</p>
            )}

            <div className="mb-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Pros</p>
              <ul className="space-y-1">
                {option.pros.map((pro) => (
                  <li key={pro} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-600 flex-shrink-0">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Cons</p>
              <ul className="space-y-1">
                {option.cons.map((con) => (
                  <li key={con} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-amber-600 flex-shrink-0">−</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>

            {option.tradeoff && (
              <p className="text-xs text-purple-800 bg-purple-50 rounded-lg p-2 mb-3 border border-purple-100">
                <span className="font-semibold">Tradeoff: </span>
                {option.tradeoff}
              </p>
            )}

            <p className="text-sm text-gray-800 mt-auto pt-2 border-t border-gray-100">
              <span className="font-medium text-gray-900">Best if: </span>
              {option.bestIf}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900 font-medium">{summary.recommendation}</p>
      </div>
    </section>
  );
}
