'use client';

import { useEffect, useState } from 'react';
import AffiliateLink from '@/components/AffiliateLink';
import { bookableDestinationFromStop } from '@/lib/bookable-place';
import {
  buildBookOffers,
  cachedStopHook,
  displayPlaceName,
  type BookOfferCard,
} from '@/lib/book-offers';
import {
  getStopPreviewForDestination,
  type StopPreview,
  type TripPreview,
} from '@/lib/trip-preview';
import type { TripStop } from '@/types/trip';

function nightsBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const a = start.slice(0, 10);
  const b = end.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return 0;
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.max(0, Math.round(ms / 86_400_000));
}

function knownNights(stop: TripStop): number {
  if (typeof stop.nights === 'number' && stop.nights > 0) return Math.round(stop.nights);
  return nightsBetween(stop.startDate, stop.endDate);
}

function previewForStop(
  stop: TripStop,
  stopPreviews: StopPreview[],
  overview: TripPreview,
  stopCount: number
): TripPreview | undefined {
  const matched =
    getStopPreviewForDestination(stopPreviews, stop.destination) ??
    getStopPreviewForDestination(stopPreviews, displayPlaceName(stop)) ??
    (stop.city ? getStopPreviewForDestination(stopPreviews, stop.city) : undefined);
  if (matched) return matched;
  if (stopCount === 1 && overview.description) return overview;
  return undefined;
}

function useDestinationPhoto(city: string, country?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    const q = new URLSearchParams({ stop: city, city });
    if (country) q.set('country', country);
    fetch(`/api/walking-tour/stop-photo?${q}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { imageUrl?: string; source?: string } | null) => {
        if (cancelled || !data?.imageUrl || data.source === 'fallback') return;
        setUrl(data.imageUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [city, country]);

  return url;
}

function StopHero({
  place,
  city,
  country,
  hook,
  nights,
}: {
  place: string;
  city: string;
  country?: string;
  hook: string | null;
  nights: number;
}) {
  const photo = useDestinationPhoto(city, country);
  return (
    <div className="book-hero">
      <div className="book-hero-media">
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <div className="book-hero-placeholder" aria-hidden>
            <span>📍</span>
          </div>
        )}
        <div className="book-hero-copy">
          <div className="book-hero-place">{place}</div>
          {hook && <div className="book-hero-hook">{hook}</div>}
          {nights > 0 && (
            <div className="book-hero-nights">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  card,
  linkDestination,
  startDate,
  endDate,
  adults,
  origin,
  tripId,
}: {
  card: BookOfferCard;
  linkDestination: string;
  startDate?: string;
  endDate?: string;
  adults: number;
  origin?: string;
  tripId: string;
}) {
  return (
    <article className="book-card">
      <div className="book-card-row">
        <div className="book-card-title">
          <span aria-hidden>{card.emoji}</span> {card.title}
        </div>
        {card.estimate && (
          <div className="book-est">
            <div className="book-est-label">est.</div>
            <div className="book-est-amount">{card.estimate.amount}</div>
            <div className="book-est-unit">{card.estimate.unit}</div>
          </div>
        )}
      </div>
      <div className="book-actions">
        {card.partners.map((partner, index) => (
          <AffiliateLink
            key={`${card.type}-${partner.partner ?? partner.label}`}
            type={card.type}
            partner={partner.partner}
            destination={linkDestination}
            startDate={startDate}
            endDate={endDate}
            adults={adults}
            origin={origin}
            tripId={tripId}
            className={index === 0 ? 'book-btn book-btn-primary' : 'book-btn'}
          >
            {partner.label}
          </AffiliateLink>
        ))}
      </div>
    </article>
  );
}

export default function BookTab({
  tripId,
  adults,
  origin,
  stops,
  overview,
  stopPreviews,
}: {
  tripId: string;
  adults: number;
  origin?: string;
  stops: TripStop[];
  overview: TripPreview;
  stopPreviews: StopPreview[];
}) {
  return (
    <div className="book-tab">
      <style>{`
        .book-tab { color: #1C1917; }
        .book-hero {
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
          border: 1px solid #EAE3D5;
          background: #1C1917;
        }
        .book-hero-media { position: relative; height: 168px; }
        .book-hero-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .book-hero-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #44403C 0%, #1C1917 58%, #78350F 140%);
          font-size: 28px;
        }
        .book-hero-copy {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px 16px;
          background: linear-gradient(to top, rgba(28,25,23,0.9) 0%, rgba(28,25,23,0.12) 58%);
        }
        .book-hero-place { color: #fff; font-size: 18px; font-weight: 700; line-height: 1.25; }
        .book-hero-hook { color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.45; }
        .book-hero-nights {
          color: rgba(255,255,255,0.75);
          font-family: monospace;
          font-size: 11px;
          letter-spacing: 0.04em;
          margin-top: 6px;
        }
        .book-cards { display: flex; flex-direction: column; gap: 10px; }
        .book-card {
          background: #fff;
          border: 1px solid #EAE3D5;
          border-radius: 12px;
          padding: 14px;
        }
        .book-card-row { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; }
        .book-card-title { font-size: 15px; font-weight: 600; line-height: 1.35; min-width: 0; }
        .book-est { text-align: right; flex-shrink: 0; }
        .book-est-label {
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #B45309;
        }
        .book-est-amount { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .book-est-unit { font-size: 11px; color: #78716C; }
        .book-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .book-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 8px 14px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #1C1917;
          background: #fff;
          color: #1C1917;
        }
        .book-btn-primary { background: #1C1917; color: #fff; }
        .book-disclosure {
          font-size: 12px;
          color: #78716C;
          line-height: 1.55;
          margin-top: 1.25rem;
        }
        @media (max-width: 420px) {
          .book-card { padding: 12px; }
          .book-card-row { flex-direction: column; gap: 8px; }
          .book-est { text-align: left; }
          .book-hero-place { font-size: 17px; }
        }
      `}</style>
      {stops.map((stop, index) => {
        const place = displayPlaceName(stop);
        const linkDestination = bookableDestinationFromStop(stop);
        const city = stop.city?.trim() || place.split(',')[0]?.trim() || place;
        const country =
          stop.country?.trim() || place.split(',').slice(1).join(',').trim() || undefined;
        const preview = previewForStop(stop, stopPreviews, overview, stops.length);
        const hook = cachedStopHook(preview);
        const nights = knownNights(stop);
        const cards = buildBookOffers({
          place,
          linkDestination,
          preview,
          origin,
        });

        return (
          <section key={stop.id} style={{ marginBottom: '1.75rem' }}>
            {stops.length > 1 && (
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#78716C',
                  marginBottom: 8,
                }}
              >
                Stop {index + 1}
              </div>
            )}
            <StopHero place={place} city={city} country={country} hook={hook} nights={nights} />
            <div className="book-cards">
              {cards.map((card) => (
                <OfferCard
                  key={`${stop.id}-${card.type}`}
                  card={card}
                  linkDestination={linkDestination}
                  startDate={stop.startDate}
                  endDate={stop.endDate}
                  adults={adults}
                  origin={origin}
                  tripId={tripId}
                />
              ))}
            </div>
          </section>
        );
      })}
      <p className="book-disclosure">
        Where Next may earn a commission if you book through these partner links, at no extra cost
        to you. Payment happens on the partner site.
      </p>
    </div>
  );
}
