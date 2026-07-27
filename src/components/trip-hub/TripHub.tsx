'use client';

/**
 * Travel command center for one saved trip — /my-trip/[id]
 */

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAffiliateLinks, type AffiliateLink as AffiliateLinkData } from '@/lib/affiliates';
import AffiliateLink from '@/components/AffiliateLink';
import {
  getStopPreviewForDestination,
  parseStoredSuggestions,
  type StopPreview,
} from '@/lib/trip-preview';
import { normalizeTripStopsFromRow } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

export type { TripStop };

export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  adults: number;
  kids?: number;
  budget_amount?: number;
  vibe?: string;
  stops?: TripStop[];
  /** Persisted AI preview blob from trips.suggestions */
  suggestions?: unknown;
  status: string;
  created_at: string;
  user_id?: string;
}

export interface Booking {
  id: string;
  trip_id: string;
  status: string;
  confirmed_at?: string;
  total_amount?: number;
  total_amount_cents?: number;
  currency?: string;
  stripe_session_id?: string;
  traveler_name?: string;
  traveler_email?: string;
}

type TabId = 'overview' | 'book' | 'documents' | 'itinerary';

interface TripHubProps {
  trip: Trip;
  booking?: Booking | null;
}

function fmt(d: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', opts ?? {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return d;
  }
}

function fmtShort(d: string) {
  return fmt(d, { day: 'numeric', month: 'short' });
}

function nights(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
  );
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function bookingAmountCents(booking: Booking): number | null {
  if (typeof booking.total_amount_cents === 'number') return booking.total_amount_cents;
  if (typeof booking.total_amount === 'number') return booking.total_amount;
  return null;
}

function AffiliateCard({
  link,
  tripId,
  stop,
  adults,
}: {
  link: AffiliateLinkData;
  tripId: string;
  stop: TripStop;
  adults: number;
}) {
  return (
    <AffiliateLink
      type={link.type}
      destination={stop.destination}
      startDate={stop.startDate}
      endDate={stop.endDate}
      adults={adults}
      tripId={tripId}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        border: '1px solid #EAE3D5',
        borderRadius: 10,
        padding: '14px 16px',
        textDecoration: 'none',
        color: '#1C1917',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{link.emoji}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{link.label}</span>
      <span style={{ fontSize: 11, color: '#78716C', fontFamily: 'monospace' }}>{link.partner}</span>
      <span style={{ color: '#78716C', fontSize: 15 }}>→</span>
    </AffiliateLink>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderBottom: '1px solid #F5F0E8',
        cursor: 'pointer',
        fontSize: 13,
        color: done ? '#78716C' : '#44403C',
        textDecoration: done ? 'line-through' : 'none',
      }}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => setDone((v) => !v)}
        style={{ width: 15, height: 15, accentColor: '#D97706', cursor: 'pointer' }}
      />
      {label}
    </label>
  );
}

function DocSlot({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#fff',
        border: '1px dashed #D6CFC4',
        borderRadius: 8,
        padding: '12px 14px',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: '#44403C' }}>{label}</span>
      <button
        type="button"
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid #D6CFC4',
          background: '#F5F0E8',
          color: '#78716C',
          cursor: 'pointer',
        }}
        onClick={() =>
          alert('Document upload coming soon — connect Supabase Storage to enable this.')
        }
      >
        + Add
      </button>
    </div>
  );
}

function UtilBtn({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '14px 8px',
        borderRadius: 8,
        background: '#fff',
        border: '1px solid #EAE3D5',
        textDecoration: 'none',
        color: '#44403C',
        fontSize: 11,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      {label}
    </Link>
  );
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: '🗺 Overview' },
  { id: 'book', label: '🔗 Book' },
  { id: 'documents', label: '📄 Documents' },
  { id: 'itinerary', label: '📅 Itinerary' },
];

function TripHubContent({ trip, booking }: TripHubProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'overview'
  );

  const stops: TripStop[] = normalizeTripStopsFromRow({
    destination: trip.destination,
    title: trip.title,
    start_date: trip.start_date,
    end_date: trip.end_date,
    stops: trip.stops,
  });

  const { overview: tripOverview, stopPreviews } = parseStoredSuggestions(trip.suggestions);

  const primaryDestination = stops[0]?.destination || trip.destination;
  const totalNights = nights(trip.start_date, trip.end_date);
  const totalTravelers = (trip.adults ?? 1) + (trip.kids ?? 0);
  const isConfirmed = booking?.status === 'confirmed';
  const paidCents = booking ? bookingAmountCents(booking) : null;
  const countdownDays = trip.start_date ? daysUntil(trip.start_date) : null;
  const countdownColor =
    countdownDays === null
      ? '#78716C'
      : countdownDays === 0
        ? '#15803D'
        : countdownDays <= 7
          ? '#D97706'
          : '#0369A1';

  return (
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: '#F5F0E8',
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
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link
            href="/saved"
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              marginBottom: 16,
            }}
          >
            ← My trips
          </Link>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: 100,
                background: isConfirmed ? '#DCFCE7' : 'rgba(255,255,255,0.1)',
                color: isConfirmed ? '#15803D' : 'rgba(255,255,255,0.6)',
              }}
            >
              {isConfirmed ? 'Confirmed' : 'Saved'}
            </span>
            {trip.vibe && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  padding: '3px 10px',
                  borderRadius: 100,
                  background: 'rgba(217,119,6,0.2)',
                  color: '#FCD34D',
                }}
              >
                {trip.vibe}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 400, marginBottom: 6 }}>
            {trip.title || trip.destination}
          </h1>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 20,
            }}
          >
            {trip.start_date ? fmtShort(trip.start_date) : '—'} —{' '}
            {trip.end_date
              ? fmt(trip.end_date, { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              {
                label: 'Duration',
                val: totalNights > 0 ? `${totalNights} nights` : 'Dates TBC',
              },
              {
                label: 'Travellers',
                val: `${totalTravelers} (${trip.adults ?? 1} adult${(trip.adults ?? 1) !== 1 ? 's' : ''}${trip.kids ? `, ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''})`,
              },
              ...(trip.budget_amount
                ? [
                    {
                      label: 'Budget',
                      val: `$${Number(trip.budget_amount).toLocaleString()}`,
                    },
                  ]
                : []),
              ...(stops.length > 1
                ? [{ label: 'Stops', val: `${stops.length} destinations` }]
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

      {countdownDays !== null && countdownDays >= 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 24px',
            background: '#fff',
            borderBottom: '1px solid #EAE3D5',
            borderLeft: `4px solid ${countdownColor}`,
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1C1917',
              minWidth: 48,
            }}
          >
            {countdownDays === 0 ? '🌍' : countdownDays}
          </span>
          <span style={{ fontSize: 14, color: '#44403C' }}>
            {countdownDays === 0
              ? 'Your trip starts today! 🎉'
              : countdownDays === 1
                ? 'Tomorrow — time to pack 🧳'
                : `${countdownDays} days until ${primaryDestination}`}
          </span>
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #EAE3D5' }}>
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            gap: 8,
            padding: '10px 12px',
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isTabActive ? 'page' : undefined}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 10,
                  background: isTabActive ? '#1C1917' : 'transparent',
                  cursor: 'pointer',
                  color: isTabActive ? '#fff' : '#78716C',
                  fontWeight: isTabActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isTabActive) e.currentTarget.style.background = '#F5F1E8';
                }}
                onMouseLeave={(e) => {
                  if (!isTabActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'overview' && (
          <>
            {isConfirmed && booking && (
              <div
                style={{
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  borderRadius: 12,
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  gap: 12,
                  marginBottom: '1.75rem',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#15803D', marginBottom: 3 }}>
                    Booking confirmed
                  </div>
                  {paidCents != null && (
                    <div style={{ fontSize: 13, color: '#166534' }}>
                      {(paidCents / 100).toFixed(2)} {booking.currency ?? 'USD'} paid
                      {booking.traveler_name && ` · ${booking.traveler_name}`}
                    </div>
                  )}
                  {booking.id && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#15803D',
                        marginTop: 5,
                      }}
                    >
                      Ref: {booking.id.slice(0, 8).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))',
                gap: 10,
                marginBottom: '1.75rem',
              }}
            >
              {[
                { val: totalNights > 0 ? totalNights : '—', label: 'Nights' },
                { val: totalTravelers, label: 'Travellers' },
                { val: stops.length, label: stops.length === 1 ? 'Destination' : 'Stops' },
                ...(trip.budget_amount && totalNights > 0
                  ? [
                      {
                        val: `$${Math.round(Number(trip.budget_amount) / totalNights).toLocaleString()}`,
                        label: 'Per night',
                      },
                    ]
                  : []),
              ].map(({ val, label }) => (
                <div
                  key={label}
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #EAE3D5',
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#78716C',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontFamily: 'monospace',
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>{stops.length > 1 ? 'Your stops' : 'Destination'}</SectionTitle>
              {stops.length > 1 && tripOverview.description && (
                <p
                  style={{
                    fontSize: 14,
                    color: '#57534E',
                    lineHeight: 1.5,
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: '#FAFAF9',
                    borderRadius: 8,
                    border: '1px solid #EAE3D5',
                  }}
                >
                  {tripOverview.description}
                </p>
              )}
              {stops.map((stop, i) => {
                const stopPreview: StopPreview | undefined = getStopPreviewForDestination(
                  stopPreviews,
                  stop.destination,
                  i
                );
                return (
                <div
                  key={stop.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #EAE3D5',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    marginBottom: 8,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: '#1C1917',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>
                      {stop.destination}
                    </div>
                    {(stop.startDate && stop.endDate) || (trip.start_date && trip.end_date) ? (
                      <div style={{ fontSize: 12, color: '#78716C' }}>
                        {stop.startDate && stop.endDate
                          ? `${fmtShort(stop.startDate)} – ${fmt(stop.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : `${fmtShort(trip.start_date)} – ${fmt(trip.end_date, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </div>
                    ) : null}
                    {stopPreview?.description && (
                      <p style={{ fontSize: 13, color: '#57534E', marginTop: 8, lineHeight: 1.45 }}>
                        {stopPreview.description}
                      </p>
                    )}
                    {stopPreview?.highlights && stopPreview.highlights.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {stopPreview.highlights.slice(0, 4).map((h, hi) => (
                          <span
                            key={`${stop.id}-hl-${hi}`}
                            style={{
                              fontSize: 11,
                              background: '#F5F0E8',
                              color: '#57534E',
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    {stopPreview?.hotelBand && (
                      <div style={{ fontSize: 11, color: '#78716C', marginTop: 6 }}>
                        Hotels ${stopPreview.hotelBand.min.toLocaleString()}–$
                        {stopPreview.hotelBand.max.toLocaleString()}/night
                        {stopPreview.hotelBand.area ? ` · ${stopPreview.hotelBand.area}` : ''}
                      </div>
                    )}
                  </div>
                  {stop.startDate && stop.endDate && (
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#78716C',
                        background: '#F5F0E8',
                        padding: '3px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {nights(stop.startDate, stop.endDate)} nights
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            {tripOverview.description && stops.length <= 1 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <SectionTitle>Trip overview</SectionTitle>
                <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.5 }}>{tripOverview.description}</p>
                {tripOverview.whyItFits && (
                  <p
                    style={{
                      fontSize: 13,
                      color: '#1E3A8A',
                      background: '#EFF6FF',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginTop: 8,
                    }}
                  >
                    {tripOverview.whyItFits}
                  </p>
                )}
              </div>
            )}

            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>Weather</SectionTitle>
              <div
                style={{
                  background: 'linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)',
                  borderRadius: 12,
                  padding: '1.25rem',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.75rem' }}>🌤</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{primaryDestination}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {trip.start_date
                        ? new Date(trip.start_date).toLocaleString('default', { month: 'long' })
                        : 'Your trip'}{' '}
                      forecast
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  Live weather loads closer to your travel dates.
                </p>
                <Link
                  href={`/utilities/weather?destination=${encodeURIComponent(primaryDestination)}`}
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'underline',
                  }}
                >
                  Check full forecast →
                </Link>
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>Pre-trip checklist</SectionTitle>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #EAE3D5',
                  overflow: 'hidden',
                }}
              >
                {[
                  'Book flights',
                  'Book accommodation',
                  'Check passport expiry (6 months from travel)',
                  'Arrange travel insurance',
                  'Notify bank of travel dates',
                  'Check visa requirements',
                  'Book airport transfer',
                  'Download offline maps',
                  'Pack travel adaptor / charger',
                  'Add confirmations to Documents tab',
                ].map((item) => (
                  <ChecklistItem key={item} label={item} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>Quick tools</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
                  gap: 8,
                }}
              >
                <UtilBtn href={`/budget?tripId=${trip.id}`} icon="💰" label="Budget" />
                <UtilBtn
                  href={`/utilities/weather?destination=${encodeURIComponent(primaryDestination)}`}
                  icon="🌤"
                  label="Weather"
                />
                <UtilBtn
                  href={`/utilities/currency?destination=${encodeURIComponent(primaryDestination)}`}
                  icon="💱"
                  label="Currency"
                />
                <UtilBtn
                  href={`/tour?destination=${encodeURIComponent(primaryDestination)}`}
                  icon="🚶"
                  label="Walking tour"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'book' && (
          <>
            <p style={{ fontSize: 14, color: '#78716C', marginBottom: '1.5rem', lineHeight: 1.65 }}>
              Book with trusted partners — payment happens on their site. Where Next may earn a
              small commission at no extra cost to you.
            </p>
            {stops.map((stop, i) => (
              <div key={stop.id} style={{ marginBottom: '1.75rem' }}>
                <SectionTitle>
                  {stops.length > 1 ? `Stop ${i + 1}: ${stop.destination}` : 'Book your trip'}
                </SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {getAffiliateLinks({
                    destination: stop.destination,
                    startDate: stop.startDate || trip.start_date,
                    endDate: stop.endDate || trip.end_date,
                    adults: trip.adults ?? 2,
                  }).map((link) => (
                    <AffiliateCard
                      key={`${stop.id}-${link.type}`}
                      link={link}
                      tripId={trip.id}
                      stop={stop}
                      adults={trip.adults ?? 2}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'documents' && (
          <>
            <p style={{ fontSize: 14, color: '#78716C', marginBottom: '1.5rem', lineHeight: 1.65 }}>
              Keep all your travel documents in one place. Add confirmations once — access them
              anywhere.
            </p>
            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>Your documents</SectionTitle>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #EAE3D5',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <DocSlot icon="✈️" label="Flight confirmation" />
                <DocSlot icon="🏨" label="Hotel confirmation" />
                <DocSlot icon="🎫" label="Boarding pass" />
                <DocSlot icon="🛡️" label="Travel insurance" />
                <DocSlot icon="📄" label="Visa / entry docs" />
                <DocSlot icon="🚗" label="Car hire voucher" />
              </div>
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <SectionTitle>Key information</SectionTitle>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #EAE3D5',
                  padding: '1.1rem',
                }}
              >
                {[
                  {
                    label: 'Destination',
                    value: stops.map((s) => s.destination).join(' → ') || trip.destination,
                  },
                  { label: 'Check-in', value: trip.start_date ? fmt(trip.start_date) : '—' },
                  { label: 'Check-out', value: trip.end_date ? fmt(trip.end_date) : '—' },
                  {
                    label: 'Travellers',
                    value: `${trip.adults ?? 1} adult${(trip.adults ?? 1) !== 1 ? 's' : ''}${trip.kids ? ` + ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}`,
                  },
                  ...(booking?.id
                    ? [{ label: 'Booking ref', value: booking.id.slice(0, 8).toUpperCase() }]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      borderBottom: '1px solid #F5F0E8',
                      padding: '9px 4px',
                    }}
                  >
                    <span
                      style={{
                        color: '#78716C',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'itinerary' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ fontSize: 14, color: '#78716C', marginBottom: '1.5rem' }}>
              Generate a day-by-day plan with AI or open full trip details.
            </p>
            <Link
              href={`/trip-details/${trip.id}?destination=${encodeURIComponent(trip.destination)}`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#1C1917',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                textDecoration: 'none',
                marginRight: 8,
              }}
            >
              Trip details →
            </Link>
            <Link
              href={`/suggestions?destination=${encodeURIComponent(trip.destination)}`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                border: '1px solid #EAE3D5',
                borderRadius: 8,
                fontSize: 13,
                textDecoration: 'none',
                color: '#1C1917',
              }}
            >
              AI suggestions →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#78716C',
        marginBottom: '0.65rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
      <span style={{ flex: 1, height: 1, background: '#EAE3D5' }} />
    </div>
  );
}

export default function TripHub(props: TripHubProps) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading trip hub…
        </div>
      }
    >
      <TripHubContent {...props} />
    </Suspense>
  );
}
