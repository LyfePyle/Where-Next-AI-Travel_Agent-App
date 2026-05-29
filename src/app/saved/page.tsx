'use client';

/**
 * Saved trips — client component with inline delete.
 * Loads from GET /api/trips/save (trips table).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string;
  title?: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  adults?: number;
  travelers?: number;
  kids?: number;
  budget_amount?: number;
  vibe?: string;
  stops?: unknown[];
  status?: string;
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function nightsBetween(start: string, end: string) {
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
  );
}

export default function SavedPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/trips/save', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/auth/login?redirectTo=/saved');
        return;
      }
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      setTrips(data.trips ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tripId: string) {
    setDeleting(tripId);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/trips/delete?id=${tripId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete trip');
      }
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (e: unknown) {
      alert(`Could not delete trip: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#78716C', fontFamily: 'monospace' }}>
          Loading your trips…
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1C1917' }}>My trips</h1>
        <Link
          href="/plan-trip"
          style={{
            background: '#1C1917',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + Plan a trip
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#78716C', marginBottom: '1.5rem' }}>
        Open your trip hub for bookings, documents, and itinerary in one place.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid #FECACA',
            background: '#FEF2F2',
            padding: '12px 16px',
            fontSize: 13,
            color: '#DC2626',
          }}
        >
          {error} —{' '}
          <button
            type="button"
            onClick={fetchTrips}
            style={{
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#DC2626',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {trips.length === 0 ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 12 }}>🌍</p>
          <p style={{ fontWeight: 500, marginBottom: 6, color: '#1C1917' }}>No trips yet</p>
          <p style={{ fontSize: 13, color: '#78716C', marginBottom: 16 }}>
            Plan your first trip and save it to see it here.
          </p>
          <Link href="/plan-trip" style={{ color: '#6366F1', textDecoration: 'underline', fontSize: 13 }}>
            Start planning →
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {trips.map((trip) => {
            const dest = trip.destination ?? 'Unknown destination';
            const start = trip.start_date ?? '';
            const end = trip.end_date ?? '';
            const nightsNum = start && end ? nightsBetween(start, end) : null;
            const daysLeft = start ? daysUntil(start) : null;
            const multiStop = Array.isArray(trip.stops) && trip.stops.length > 1;
            const isDeleting = deleting === trip.id;
            const isConfirming = confirmDelete === trip.id;

            return (
              <div
                key={trip.id}
                style={{
                  borderRadius: 14,
                  border: '1px solid #E5E7EB',
                  padding: '1.25rem',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#1C1917',
                        marginBottom: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {trip.title || dest}
                    </h2>
                    <p style={{ fontSize: 12, color: '#78716C' }}>{dest}</p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginLeft: 8,
                      flexShrink: 0,
                    }}
                  >
                    {daysLeft !== null && daysLeft >= 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'monospace',
                          background: '#FFFBEB',
                          color: '#D97706',
                          padding: '3px 8px',
                          borderRadius: 100,
                          border: '1px solid #FDE68A',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {daysLeft === 0 ? 'Today!' : `${daysLeft}d`}
                      </span>
                    )}
                    {!isConfirming ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(trip.id)}
                        disabled={isDeleting}
                        title="Delete trip"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid #E5E7EB',
                          background: '#fff',
                          color: '#9CA3AF',
                          cursor: 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        🗑
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(trip.id)}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 5,
                            background: '#EF4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 5,
                            background: '#F3F4F6',
                            color: '#374151',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {start && (
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    {new Date(start).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {end &&
                      ` – ${new Date(end).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                    {nightsNum !== null && ` · ${nightsNum} nights`}
                  </p>
                )}

                {(trip.adults || trip.travelers) && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>
                    {trip.adults ?? trip.travelers} adult
                    {(trip.adults ?? trip.travelers ?? 1) !== 1 ? 's' : ''}
                    {trip.kids ? ` + ${trip.kids} child${trip.kids !== 1 ? 'ren' : ''}` : ''}
                  </p>
                )}

                {trip.budget_amount != null && (
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                    Budget: ${Number(trip.budget_amount).toLocaleString()}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 14 }}>
                  {multiStop && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#EEF2FF',
                        color: '#6366F1',
                        padding: '2px 8px',
                        borderRadius: 100,
                        fontFamily: 'monospace',
                      }}
                    >
                      {trip.stops!.length} stops
                    </span>
                  )}
                  {trip.vibe && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#FFFBEB',
                        color: '#D97706',
                        padding: '2px 8px',
                        borderRadius: 100,
                        fontFamily: 'monospace',
                      }}
                    >
                      {trip.vibe}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/my-trip/${trip.id}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: '#1C1917',
                      color: '#fff',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Open trip hub
                  </Link>
                  <Link
                    href={`/my-trip/${trip.id}?tab=book`}
                    style={{
                      textAlign: 'center',
                      border: '1px solid #E0E7FF',
                      background: '#EEF2FF',
                      color: '#6366F1',
                      borderRadius: 8,
                      padding: '9px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Book →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
