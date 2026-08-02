'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { currencyForCountry, parseDestinationParts } from '@/lib/parse-destination';

function CurrencyPageInner() {
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') ?? '';
  const tripId = searchParams.get('tripId');
  const { city, country } = parseDestinationParts(destination);
  const localCurrency = currencyForCountry(country);

  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function convert() {
      setError(null);
      try {
        const res = await fetch('/api/utils/currency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'USD', to: localCurrency, amount }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) {
          setError(json.error || 'Conversion failed');
          setResult(null);
          return;
        }
        setResult(json.data.to.amount);
        setRate(json.data.rate);
        setIsMock(!!json.data.isMock);
      } catch {
        if (!cancelled) setError('Network error');
      }
    }

    convert();
    return () => {
      cancelled = true;
    };
  }, [amount, localCurrency]);

  const backHref = tripId ? `/my-trip/${tripId}` : '/saved';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href={backHref} className="text-sm text-indigo-600 hover:underline">
          ← Back to trip
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Currency</h1>
        <p className="text-gray-600 mb-6">
          {city || 'Your trip'}
          {country ? ` · ${country}` : ''} — local currency {localCurrency}
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">USD amount</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result != null && rate != null && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {localCurrency}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                1 USD = {rate.toFixed(4)} {localCurrency}
                {isMock ? ' (approximate rates)' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CurrencyUtilityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CurrencyPageInner />
    </Suspense>
  );
}
