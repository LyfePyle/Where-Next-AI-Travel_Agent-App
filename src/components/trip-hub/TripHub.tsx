'use client';

/**
 * Travel command center for one saved trip — /my-trip/[id]
 */

import { useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAffiliateLinks, type AffiliateLink as AffiliateLinkData } from '@/lib/affiliates';
import AffiliateLink from '@/components/AffiliateLink';
import {
  parseStoredSuggestions,
} from '@/lib/trip-preview';
import { normalizeTripStopsFromRow, serializeStopsForDb, validateStopsForSave } from '@/lib/trip-stops';
import { useToast, ToastContainer } from '@/hooks/useToast';
import TripHubStopsSection from '@/components/trip-hub/TripHubStopsSection';
import TripChatPanel from '@/components/trip-hub/TripChatPanel';
import TripItineraryTab from '@/components/trip-hub/TripItineraryTab';
import TripRouteMap from '@/components/trip-hub/TripRouteMap';
import { useTripEditState } from '@/components/trip-hub/useTripEditState';
import type { ChatMessageRow } from '@/app/api/trips/[id]/chat/route';
import { parseDestinationParts } from '@/lib/parse-destination';
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
  chatMessages?: ChatMessageRow[];
  undoAvailable?: boolean;
  undoExpiresAt?: string | null;
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

function TripHubContent({ trip, booking, chatMessages = [], undoAvailable = false, undoExpiresAt = null }: TripHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'overview'
  );
  const [isSaving, setIsSaving] = useState(false);

  const stops: TripStop[] = normalizeTripStopsFromRow({
    destination: trip.destination,
    title: trip.title,
    start_date: trip.start_date,
    end_date: trip.end_date,
    stops: trip.stops,
  });

  const {
    isEditing,
    draftTitle,
    setDraftTitle,
    draftTripStart,
    draftStops,
    saveError,
    setSaveError,
    validationErrors,
    setValidationErrors,
    enterEdit,
    cancelEdit,
    finishSave,
    handleTripStartChange,
    handleDraftStopsChange,
    buildStopsForSave,
  } = useTripEditState(trip.title || trip.destination, stops, trip.start_date);

  const { overview: tripOverview, stopPreviews } = parseStoredSuggestions(trip.suggestions);

  const handleSave = useCallback(async () => {
    const title = draftTitle.trim();
    if (!title) {
      setValidationErrors({ _form: 'Trip title cannot be empty.' });
      return;
    }

    if (!draftTripStart.trim()) {
      setValidationErrors({ _form: 'Trip start date is required.' });
      return;
    }

    const toSave = buildStopsForSave();
    if (!toSave) {
      setValidationErrors({
        _form: 'Could not build trip dates — check start date and stops.',
      });
      return;
    }

    const validation = validateStopsForSave(toSave);
    setValidationErrors(validation.errors);
    if (!validation.ok) return;

    const serialized = serializeStopsForDb(toSave);
    if (!serialized) {
      setValidationErrors({ _form: 'Could not save stops — check each destination.' });
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, stops: serialized }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSaveError(data.error || 'Failed to save changes. Your trip was not changed.');
        return;
      }

      finishSave();
      addToast('Trip updated', { variant: 'success' });
      router.refresh();
    } catch {
      setSaveError('Network error — your trip was not changed.');
    } finally {
      setIsSaving(false);
    }
  }, [
    buildStopsForSave,
    draftTripStart,
    draftTitle,
    trip.id,
    finishSave,
    addToast,
    router,
    setValidationErrors,
    setSaveError,
  ]);

  const displayStops = isEditing ? draftStops : stops;
  const displayTitle = isEditing ? draftTitle : trip.title || trip.destination;
  const displayStart = isEditing ? draftTripStart || trip.start_date : trip.start_date;
  const displayEnd = isEditing
    ? draftStops[draftStops.length - 1]?.endDate || trip.end_date
    : trip.end_date;

  const primaryDestination = displayStops[0]?.destination || trip.destination;
  const { city: toolCity, country: toolCountry } = parseDestinationParts(primaryDestination);
  const toolDestEnc = encodeURIComponent(primaryDestination);
  const totalNights = nights(displayStart, displayEnd);
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
      className="min-h-screen overflow-x-clip"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: '#F5F0E8',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  aria-label="Trip title"
                  style={{
                    width: '100%',
                    fontSize: 'clamp(1.5rem,4vw,2.5rem)',
                    fontWeight: 400,
                    marginBottom: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '6px 10px',
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                />
              ) : (
                <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 400, marginBottom: 6 }}>
                  {displayTitle}
                </h1>
              )}
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  marginBottom: isEditing ? 0 : 20,
                }}
              >
                {displayStart ? fmtShort(displayStart) : '—'} —{' '}
                {displayEnd
                  ? fmt(displayEnd, { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 4 }}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.75)',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#D97706',
                      color: '#fff',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={enterEdit}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: isEditing ? 16 : 0 }}>
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
              ...(displayStops.length > 1
                ? [{ label: 'Stops', val: `${displayStops.length} destinations` }]
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

      <div className="sticky top-14 z-30 bg-white border-b border-[#EAE3D5]">
        <div className="max-w-[760px] mx-auto flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isTabActive ? 'page' : undefined}
                className={`shrink-0 min-h-[44px] px-4 py-2.5 text-sm border-0 rounded-[10px] whitespace-nowrap transition-colors touch-manipulation ${
                  isTabActive
                    ? 'bg-[#1C1917] text-white font-bold'
                    : 'bg-transparent text-[#78716C] font-medium hover:bg-[#F5F1E8]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 w-full min-w-0 box-border flex flex-col lg:flex-row gap-6 items-start overflow-x-clip">
        <div className="flex-1 min-w-0 w-full max-w-[760px]">
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
                { val: displayStops.length, label: displayStops.length === 1 ? 'Destination' : 'Stops' },
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

            {saveError && (
              <div
                style={{
                  fontSize: 13,
                  color: '#B91C1C',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: '1rem',
                }}
              >
                {saveError}
              </div>
            )}

            {displayStops.length > 0 && (
              <TripRouteMap tripId={trip.id} stops={displayStops} />
            )}

            <TripHubStopsSection
              stops={stops}
              isEditing={isEditing}
              draftStops={draftStops}
              draftTripStart={draftTripStart}
              onDraftTripStartChange={handleTripStartChange}
              onDraftStopsChange={handleDraftStopsChange}
              validationErrors={validationErrors}
              tripStartDate={trip.start_date}
              tripEndDate={trip.end_date}
              tripOverviewDescription={tripOverview.description}
              stopPreviews={stopPreviews}
            />

            {tripOverview.description && stops.length <= 1 && !isEditing && (
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
                  href={`/utilities/weather?destination=${toolDestEnc}&tripId=${trip.id}`}
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
                  href={`/utilities/weather?destination=${toolDestEnc}&tripId=${trip.id}`}
                  icon="🌤"
                  label="Weather"
                />
                <UtilBtn
                  href={`/utilities/currency?destination=${toolDestEnc}&tripId=${trip.id}`}
                  icon="💱"
                  label="Currency"
                />
                <UtilBtn
                  href={`/tour?city=${encodeURIComponent(toolCity)}&country=${encodeURIComponent(toolCountry)}&trip_id=${trip.id}`}
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
          <TripItineraryTab tripId={trip.id} stops={stops} active={activeTab === 'itinerary'} />
        )}
        </div>

        <TripChatPanel
          tripId={trip.id}
          initialMessages={chatMessages}
          initialUndoAvailable={undoAvailable}
          initialUndoExpiresAt={undoExpiresAt}
        />
      </div>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
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
