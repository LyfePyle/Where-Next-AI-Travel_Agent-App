'use client';

/**
 * Plan trip — origin (home city) vs destination (where to go) are separate.
 * Origin → `from` param for flights. Destination → `stops` / `destination` for AI.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const VIBES = [
  { value: 'adventure', label: '🏔 Adventure' },
  { value: 'relaxing', label: '🌊 Relaxing' },
  { value: 'cultural', label: '🏛 Cultural' },
  { value: 'foodie', label: '🍜 Foodie' },
  { value: 'romantic', label: '💕 Romantic' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'budget', label: '💰 Budget' },
  { value: 'luxury', label: '✨ Luxury' },
  { value: 'nightlife', label: '🍸 Nightlife' },
  { value: 'nature', label: '🌿 Nature' },
  { value: 'beach', label: '🏖 Beach' },
  { value: 'city', label: '🌆 City breaks' },
  { value: 'spiritual', label: '🧘 Spiritual' },
  { value: 'photography', label: '📷 Photography' },
  { value: 'hiking', label: '🥾 Hiking' },
  { value: 'wellness', label: '💆 Wellness' },
];

const MAX_VIBES = 3;

type TripStyle = 'single' | 'multi' | 'surprise';

const TRIP_STYLES: { value: TripStyle; label: string; sub: string; icon: string }[] = [
  { value: 'single', label: 'One destination', sub: 'A single place to explore', icon: '📍' },
  { value: 'multi', label: 'Multi-city', sub: 'Several cities in one trip', icon: '🧭' },
  { value: 'surprise', label: 'Surprise me', sub: 'Let the AI choose', icon: '✦' },
];

export default function PlanTripPage() {
  const router = useRouter();

  const [tripStyle, setTripStyle] = useState<TripStyle>('single');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [budget, setBudget] = useState(3000);
  const [vibes, setVibes] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [originError, setOriginError] = useState('');

  const isSurprise = tripStyle === 'surprise';
  const isMulti = tripStyle === 'multi';

  function toggleVibe(value: string) {
    setVibes((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX_VIBES) return prev;
      return [...prev, value];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!origin.trim()) {
      setOriginError('Please enter your home city so we can calculate flights.');
      return;
    }
    setOriginError('');
    setSubmitting(true);

    const params = new URLSearchParams();
    params.set('from', origin.trim());

    // Trip style → backend tripType. "surprise" has no destination, single trip.
    if (isMulti) {
      params.set('tripType', 'multi-city');
      params.set('numberOfStops', '3');
    } else {
      params.set('tripType', 'single');
    }

    // Destination only applies to single + multi (a region is fine for multi).
    if (!isSurprise && destination.trim()) {
      params.set(
        'stops',
        JSON.stringify([
          {
            id: 'stop-main',
            destination: destination.trim(),
            startDate: startDate || '',
            endDate: endDate || '',
          },
        ])
      );
      params.set('destination', destination.trim());
    }

    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (vibes.length) params.set('vibes', vibes.join(','));
    if (additionalDetails.trim()) params.set('additionalDetails', additionalDetails.trim());

    params.set('adults', String(adults));
    params.set('kids', String(kids));
    params.set('budgetAmount', String(budget));

    router.push(`/suggestions?${params.toString()}`);
  }

  const tripNights =
    startDate && endDate
      ? Math.max(
          0,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
          )
        )
      : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F7F4',
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          background: '#1C1917',
          color: '#fff',
          padding: '3rem 1.5rem 2.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 12,
            }}
          >
            AI-powered travel planning
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem,5vw,2.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Where do you want to go?
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              maxWidth: 400,
              margin: '0 auto',
            }}
          >
            Tell us where you&apos;re based and we&apos;ll find the best trips for you — or name a
            destination and we&apos;ll plan the perfect itinerary.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <form onSubmit={handleSubmit} noValidate>
          <FormSection
            step={1}
            title="What kind of trip?"
            subtitle="Pick a style — you can change it any time"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {TRIP_STYLES.map((style) => {
                const active = tripStyle === style.value;
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setTripStyle(style.value)}
                    style={{
                      padding: '16px 10px',
                      borderRadius: 12,
                      border: `1.5px solid ${active ? '#1C1917' : '#E2DDD6'}`,
                      background: active ? '#1C1917' : '#fff',
                      color: active ? '#fff' : '#44403C',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{style.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {style.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: active ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                        lineHeight: 1.3,
                      }}
                    >
                      {style.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Where are you based?"
            subtitle="Your home city — we use this to find flights"
          >
            <div>
              <input
                type="text"
                placeholder="e.g. Vancouver, London, Sydney…"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setOriginError('');
                }}
                style={{
                  ...inputStyle,
                  borderColor: originError ? '#DC2626' : '#E2DDD6',
                }}
              />
              {originError && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#DC2626',
                    marginTop: 6,
                    fontFamily: 'monospace',
                  }}
                >
                  {originError}
                </p>
              )}
            </div>
          </FormSection>

          {!isSurprise && (
            <FormSection
              step={3}
              title={isMulti ? 'Which region or cities?' : 'Where do you want to go?'}
              subtitle={
                isMulti
                  ? 'Name a country or region (e.g. Southeast Asia) — or leave blank for ideas'
                  : 'Leave blank and our AI will suggest the best destinations for you'
              }
              optional
            >
              <input
                type="text"
                placeholder={
                  isMulti
                    ? 'e.g. Southeast Asia, Italy, Japan… or leave blank'
                    : 'e.g. Thailand, Japan, New York… or leave blank'
                }
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={inputStyle}
              />
              {destination.trim() ? (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#0F766E',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>✓</span>{' '}
                  {isMulti
                    ? `AI will plan multi-city trips around ${destination.trim()}`
                    : `AI will show trip options within ${destination.trim()}`}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#78716C',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>✦</span> AI will suggest the best{' '}
                  {isMulti ? 'multi-city routes' : 'destinations'} from{' '}
                  {origin.trim() || 'your city'}
                </div>
              )}
            </FormSection>
          )}

          <FormSection
            step={4}
            title="When are you travelling?"
            optional
            subtitle="Helps the AI check seasonality and pricing"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Departure</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Return</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>
            </div>
            {tripNights !== null && tripNights > 0 && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: '#78716C',
                  fontFamily: 'monospace',
                }}
              >
                {tripNights} night{tripNights !== 1 ? 's' : ''} away
              </div>
            )}
          </FormSection>

          <FormSection step={5} title="Who's travelling?">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Counter
                label="Adults"
                sub="Age 18+"
                value={adults}
                min={1}
                max={9}
                onChange={setAdults}
              />
              <Counter
                label="Children"
                sub="Under 18"
                value={kids}
                min={0}
                max={8}
                onChange={setKids}
              />
            </div>
          </FormSection>

          <FormSection step={6} title="What's your budget?">
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13, color: '#78716C' }}>
                  Total budget (USD) for all travellers
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#1C1917',
                  }}
                >
                  ${budget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={250}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1C1917', height: 4, cursor: 'pointer' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontSize: 11,
                  color: '#9CA3AF',
                  fontFamily: 'monospace',
                }}
              >
                <span>$500</span>
                <span>$20,000</span>
              </div>
              {adults + kids > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#78716C',
                    fontFamily: 'monospace',
                  }}
                >
                  ≈ ${Math.round(budget / (adults + kids)).toLocaleString()} per person
                </div>
              )}
            </div>
          </FormSection>

          <FormSection
            step={7}
            title="What's your vibe?"
            optional
            subtitle={`Pick up to ${MAX_VIBES} to help the AI match your style`}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VIBES.map((v) => {
                const selected = vibes.includes(v.value);
                const atMax = vibes.length >= MAX_VIBES;
                const disabled = !selected && atMax;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => toggleVibe(v.value)}
                    disabled={disabled}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 100,
                      fontSize: 13,
                      border: `1.5px solid ${selected ? '#1C1917' : '#E2DDD6'}`,
                      background: selected ? '#1C1917' : '#fff',
                      color: selected ? '#fff' : disabled ? '#C7C2BA' : '#44403C',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            {vibes.length >= MAX_VIBES && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: '#78716C',
                  fontFamily: 'monospace',
                }}
              >
                Maximum {MAX_VIBES} selected
              </div>
            )}
          </FormSection>

          <FormSection
            step={8}
            title="Anything else we should know?"
            optional
            subtitle="Special requests — e.g. no flying, travelling with elderly parents, honeymoon"
          >
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="e.g. Train only, no flights • Celebrating our anniversary • Need step-free access"
              rows={3}
              maxLength={400}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.5,
                minHeight: 80,
              }}
            />
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: '#9CA3AF',
                fontFamily: 'monospace',
                textAlign: 'right',
              }}
            >
              {additionalDetails.length}/400
            </div>
          </FormSection>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: submitting ? '#6B7280' : '#1C1917',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 4px 12px rgba(28,25,23,0.25)',
            }}
          >
            {submitting ? (
              'Getting AI suggestions…'
            ) : (
              <>
                <span>✦</span>
                {isSurprise
                  ? 'Surprise me — find my perfect trip'
                  : isMulti
                    ? destination.trim()
                      ? `Plan my multi-city trip around ${destination.trim()}`
                      : 'Find me a multi-city adventure'
                    : destination.trim()
                      ? `Plan my trip to ${destination.trim()}`
                      : 'Find me the perfect trip'}
              </>
            )}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#9CA3AF',
              marginTop: 12,
              fontFamily: 'monospace',
            }}
          >
            Takes 10–15 seconds • Powered by GPT-4
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E2DDD6',
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "Georgia, 'Times New Roman', serif",
  background: '#fff',
  color: '#1C1917',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontFamily: 'monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#78716C',
  marginBottom: 6,
};

function FormSection({
  step,
  title,
  subtitle,
  optional,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2DDD6',
        borderRadius: 14,
        padding: '1.5rem',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: subtitle ? 4 : 0,
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#1C1917',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {step}
          </span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1917', margin: 0 }}>
            {title}
            {optional && (
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: '#9CA3AF',
                  marginLeft: 6,
                  fontFamily: 'monospace',
                }}
              >
                optional
              </span>
            )}
          </h2>
        </div>
        {subtitle && (
          <p style={{ fontSize: 12, color: '#78716C', margin: '0 0 0 34px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function Counter({
  label,
  sub,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        border: '1.5px solid #E2DDD6',
        borderRadius: 10,
        background: '#FAFAF9',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1C1917' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          style={counterBtnStyle(value <= min)}
        >
          −
        </button>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            minWidth: 20,
            textAlign: 'center',
            fontFamily: 'monospace',
          }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          style={counterBtnStyle(value >= max)}
        >
          +
        </button>
      </div>
    </div>
  );
}

const counterBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: '1.5px solid #E2DDD6',
  background: disabled ? '#F3F4F6' : '#fff',
  color: disabled ? '#D1D5DB' : '#1C1917',
  fontSize: 16,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
});
