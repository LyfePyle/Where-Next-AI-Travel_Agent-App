'use client';

import { useEffect, useState } from 'react';

type Props = {
  stopName: string;
  city: string;
  country?: string;
  categories?: string[];
};

export default function WalkingTourStopPhoto({
  stopName,
  city,
  country,
  categories,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);

    const params = new URLSearchParams({ stop: stopName, city });
    if (country) params.set('country', country);
    if (categories?.length) params.set('categories', categories.join(','));

    fetch(`/api/walking-tour/stop-photo?${params}`)
      .then((r) => r.json())
      .then((data: { imageUrl?: string }) => {
        if (!cancelled && data?.imageUrl) setImageUrl(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stopName, city, country, categories?.join(',')]);

  if (loading) {
    return (
      <div
        className="mb-4 h-44 md:h-52 w-full rounded-xl bg-gray-100 animate-pulse"
        aria-hidden
      />
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-100">
      <img
        src={imageUrl}
        alt={`${stopName}, ${city}`}
        className="h-44 md:h-52 w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
