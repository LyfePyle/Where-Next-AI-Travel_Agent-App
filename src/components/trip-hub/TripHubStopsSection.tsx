'use client';

import ChainedStopsEditor from '@/components/trip-hub/ChainedStopsEditor';
import { getStopPreviewForDestination, type StopPreview } from '@/lib/trip-preview';
import { nightsBetween } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

function fmt(d: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', opts ?? {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return d;
  }
}

function fmtShort(d: string) {
  return fmt(d, { day: 'numeric', month: 'short' });
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

interface TripHubStopsSectionProps {
  stops: TripStop[];
  isEditing: boolean;
  draftStops: TripStop[];
  draftTripStart: string;
  onDraftTripStartChange: (start: string) => void;
  onDraftStopsChange: (stops: TripStop[]) => void;
  validationErrors: Record<string, string>;
  tripStartDate: string;
  tripEndDate: string;
  tripOverviewDescription?: string;
  stopPreviews: StopPreview[];
}

export default function TripHubStopsSection({
  stops,
  isEditing,
  draftStops,
  draftTripStart,
  onDraftTripStartChange,
  onDraftStopsChange,
  validationErrors,
  tripStartDate,
  tripEndDate,
  tripOverviewDescription,
  stopPreviews,
}: TripHubStopsSectionProps) {
  const displayStops = isEditing ? draftStops : stops;
  const sectionLabel = displayStops.length > 1 ? 'Your stops' : 'Destination';

  const editEndDate = draftStops[draftStops.length - 1]?.endDate ?? '';
  const editTotalNights =
    draftTripStart && editEndDate ? nightsBetween(draftTripStart, editEndDate) : 0;

  if (isEditing) {
    return (
      <div style={{ marginBottom: '1.75rem' }}>
        <SectionTitle>{sectionLabel}</SectionTitle>

        {validationErrors._form && (
          <p
            style={{
              fontSize: 13,
              color: '#B91C1C',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
            }}
          >
            {validationErrors._form}
          </p>
        )}

        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            background: '#FAFAF9',
            borderRadius: 10,
            border: '1px solid #EAE3D5',
          }}
        >
          <label
            style={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#78716C',
              marginBottom: 6,
            }}
          >
            Trip start date
          </label>
          <input
            type="date"
            value={draftTripStart}
            onChange={(e) => onDraftTripStartChange(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 220,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #EAE3D5',
              fontSize: 14,
            }}
          />
          {draftTripStart && editEndDate && (
            <p style={{ fontSize: 12, color: '#78716C', marginTop: 8, marginBottom: 0 }}>
              {editTotalNights} nights total · ends {fmtShort(editEndDate)}
            </p>
          )}
        </div>

        <ChainedStopsEditor
          stops={draftStops}
          onChange={onDraftStopsChange}
          errors={validationErrors}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <SectionTitle>{sectionLabel}</SectionTitle>
      {stops.length > 1 && tripOverviewDescription && (
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
          {tripOverviewDescription}
        </p>
      )}
      {stops.map((stop, i) => {
        const stopPreview: StopPreview | undefined = getStopPreviewForDestination(
          stopPreviews,
          stop.destination,
          i
        );
        const stopNights =
          stop.nights ??
          (stop.startDate && stop.endDate ? nightsBetween(stop.startDate, stop.endDate) : 0);

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
              {(stop.startDate && stop.endDate) || (tripStartDate && tripEndDate) ? (
                <div style={{ fontSize: 12, color: '#78716C' }}>
                  {stop.startDate && stop.endDate
                    ? `${fmtShort(stop.startDate)} – ${fmt(stop.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `${fmtShort(tripStartDate)} – ${fmt(tripEndDate, { day: 'numeric', month: 'short', year: 'numeric' })}`}
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
            {stopNights > 0 && (
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
                {stopNights} nights
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
