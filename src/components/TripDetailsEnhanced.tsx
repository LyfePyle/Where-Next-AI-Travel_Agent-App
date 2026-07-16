'use client';

/**
 * Trip preview — no Duffel/Stripe/cart. Save → Trip Hub → Book via affiliates.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface TripDetailsEnhancedProps {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; kids: number };
  budgetAmount?: number;
  vibe?: string;
  description?: string;
  highlights?: string[];
  whyItFits?: string;
  fitScore?: number;
  crowdLevel?: 'Low' | 'Medium' | 'High';
  seasonality?: string;
  flightBand?: { min: number; max: number };
  hotelBand?: { min: number; max: number; style?: string; area?: string };
  weatherTemp?: number;
  weatherIcon?: string;
}

function fmt(d: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(
      'en-GB',
      opts ?? { day: 'numeric', month: 'long', year: 'numeric' }
    );
  } catch {
    return d;
  }
}

function nights(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
  );
}

function crowdColor(level?: string) {
  if (level === 'Low') return { bg: '#DCFCE7', text: '#15803D' };
  if (level === 'High') return { bg: '#FEE2E2', text: '#DC2626' };
  return { bg: '#FFFBEB', text: '#D97706' };
}

/** Real Supabase trip IDs are UUIDs — not AI suggestion ids like ai_123_0 */
function isValidHubTripId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function TripDetailsEnhanced({
  tripId,
  destination,
  startDate,
  endDate,
  travelers,
  budgetAmount,
  vibe,
  description,
  highlights,
  whyItFits,
  fitScore,
  crowdLevel,
  seasonality,
  flightBand,
  hotelBand,
  weatherTemp,
  weatherIcon,
}: TripDetailsEnhancedProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tripNights = nights(startDate, endDate);
  const totalTravelers = (travelers.adults ?? 1) + (travelers.kids ?? 0);
  const crowd = crowdColor(crowdLevel);

  const estTotal =
    budgetAmount ??
    (flightBand && hotelBand
      ? Math.round(
          ((flightBand.min + flightBand.max) / 2 +
            ((hotelBand.min + hotelBand.max) / 2) * tripNights) *
            totalTravelers
        )
      : 0);

  const hubTripId = isValidHubTripId(tripId) ? tripId : null;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/trips/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          destination,
          estimatedCost: estTotal,
          reason: whyItFits,
          fitScore,
          source: 'trip-details',
          adults: travelers.adults,
          kids: travelers.kids,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          vibe: vibe || undefined,
          title: `${destination.split(',')[0]?.trim() || destination} Trip`,
          // Persist the AI preview content so the saved trip renders fully on reopen.
          description: description || undefined,
          highlights: highlights && highlights.length ? highlights : undefined,
          whyItFits: whyItFits || undefined,
          crowdLevel: crowdLevel || undefined,
          seasonality: seasonality || undefined,
          weatherTemp: weatherTemp ?? undefined,
          weatherIcon: weatherIcon || undefined,
          flightBand: flightBand || undefined,
          hotelBand: hotelBand || undefined,
        }),
      });

      if (res.status === 401) {
        const returnPath =
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : `/trip-details/${tripId}`;
        router.push(`/auth/login?redirectTo=${encodeURIComponent(returnPath)}`);
        return;
      }
      if (res.status === 409) {
        setSaved(true);
        setTimeout(() => router.push('/saved'), 800);
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Save failed');
      }

      const data = await res.json();
      setSaved(true);

      const realId = data?.trip?.id as string | undefined;
      setTimeout(() => {
        if (realId && isValidHubTripId(realId)) {
          router.push(`/my-trip/${realId}`);
        } else {
          router.push('/saved');
        }
      }, 800);
    } catch (err: unknown) {
      alert(`Could not save trip: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: '#F8F7F4',
        minHeight: '100vh',
        color: '#1C1917',
      }}
    >
      <div
        style={{
          background: '#1C1917',
          color: '#fff',
          padding: '2.5rem 1.5rem 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse at 75% 40%, rgba(217,119,6,0.18) 0%, transparent 55%)',
          }}
        />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            href="/suggestions"
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              marginBottom: 16,
              letterSpacing: '0.04em',
            }}
          >
            ← Back to suggestions
          </Link>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {fitScore != null && fitScore > 0 && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: 'linear-gradient(90deg,#6366F1,#8B5CF6)',
                  color: '#fff',
                }}
              >
                {fitScore}/100 Fit
              </span>
            )}
            {vibe && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 12px',
                  borderRadius: 100,
                  background: 'rgba(217,119,6,0.2)',
                  color: '#FCD34D',
                }}
              >
                {vibe}
              </span>
            )}
            {crowdLevel && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 10px',
                  borderRadius: 100,
                  background: crowd.bg,
                  color: crowd.text,
                }}
              >
                Crowd: {crowdLevel}
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem,5vw,2.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            {destination}
          </h1>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.04em',
              marginBottom: 20,
            }}
          >
            {startDate ? fmt(startDate, { day: 'numeric', month: 'short' }) : '—'} —{' '}
            {endDate
              ? fmt(endDate, { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
            {seasonality && ` · ${seasonality}`}
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              {
                label: 'Duration',
                val: tripNights > 0 ? `${tripNights} nights` : 'Flexible',
              },
              {
                label: 'Travellers',
                val: `${totalTravelers} (${travelers.adults} adult${travelers.adults !== 1 ? 's' : ''}${travelers.kids ? `, ${travelers.kids} child${travelers.kids !== 1 ? 'ren' : ''}` : ''})`,
              },
              ...(estTotal > 0
                ? [{ label: 'Est. budget', val: `$${estTotal.toLocaleString()}` }]
                : []),
              ...(weatherTemp != null
                ? [{ label: 'Weather', val: `${weatherIcon ?? '🌤'} ${weatherTemp}°C` }]
                : []),
            ].map(({ label, val }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {description && (
            <Card>
              <SectionLabel>About this trip</SectionLabel>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#44403C' }}>{description}</p>
            </Card>
          )}

          {whyItFits && (
            <div
              style={{
                background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                border: '1px solid #C7D2FE',
                borderRadius: 12,
                padding: '1.25rem',
              }}
            >
              <SectionLabel>Why this works for you</SectionLabel>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: '#3730A3',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{whyItFits}&rdquo;
              </p>
            </div>
          )}

          {highlights && highlights.length > 0 && (
            <Card>
              <SectionLabel>Highlights</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'linear-gradient(135deg,#EDE9FE,#DBEAFE)',
                      color: '#5B21B6',
                      padding: '6px 14px',
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    ✨ {h}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {(flightBand || hotelBand) && (
            <Card>
              <SectionLabel>Estimated costs</SectionLabel>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                  gap: 10,
                }}
              >
                {flightBand && (
                  <CostBox
                    icon="✈️"
                    label="Flights (per person)"
                    val={`$${flightBand.min.toLocaleString()} – $${flightBand.max.toLocaleString()}`}
                  />
                )}
                {hotelBand && (
                  <CostBox
                    icon="🏨"
                    label={`Hotel${hotelBand.style ? ` · ${hotelBand.style}` : ''}`}
                    val={`$${hotelBand.min.toLocaleString()} – $${hotelBand.max.toLocaleString()}/night`}
                    sub={hotelBand.area}
                  />
                )}
                <CostBox
                  icon="🚗"
                  label="Local transport"
                  val="Included (est.)"
                  sub="Transit + transfers"
                />
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: '#9CA3AF',
                  marginTop: 10,
                  fontFamily: 'monospace',
                }}
              >
                Estimates only — final prices shown on partner booking sites.
              </p>
            </Card>
          )}

          <div
            style={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 14,
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <SectionLabel>Ready to go?</SectionLabel>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: saved ? '#15803D' : saving ? '#6B7280' : '#1C1917',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: saving || saved ? 'not-allowed' : 'pointer',
                marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              {saved ? '✅ Saved! Opening My trips…' : saving ? 'Saving…' : '💾 Save to My trips'}
            </button>

            {hubTripId && (
              <Link
                href={`/my-trip/${hubTripId}`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 20px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  textAlign: 'center',
                  marginBottom: 10,
                  boxSizing: 'border-box',
                }}
              >
                🗺 Open trip hub
              </Link>
            )}

            {hubTripId && (
              <Link
                href={`/my-trip/${hubTripId}?tab=book`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 20px',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                🔗 Book flights, hotels & activities →
              </Link>
            )}

            {!hubTripId && (
              <p
                style={{
                  fontSize: 12,
                  color: '#78716C',
                  textAlign: 'center',
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Save this trip first — then open your trip hub from My trips.
              </p>
            )}

            <p
              style={{
                fontSize: 11,
                color: '#9CA3AF',
                textAlign: 'center',
                marginTop: 10,
                fontFamily: 'monospace',
              }}
            >
              Book on partner sites (Booking.com, Skyscanner, Viator). We may earn a small
              commission at no extra cost to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#9CA3AF',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function CostBox({
  icon,
  label,
  val,
  sub,
}: {
  icon: string;
  label: string;
  val: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '12px',
      }}
    >
      <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          fontSize: 11,
          color: '#6B7280',
          marginBottom: 4,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
