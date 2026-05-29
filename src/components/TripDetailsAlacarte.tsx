'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';

// Reuse pricing helpers from TripDetailsEnhanced (destination-aware)
const getDestinationPricing = (destination: string) => {
  const raw = destination.split(',')[0].trim();
  const city = !raw || raw.toLowerCase() === 'your' ? 'Destination' : raw;
  if (city.toLowerCase().includes('cancun')) return { flights: [850, 650, 1200], hotels: [180, 120, 350] };
  if (city.toLowerCase().includes('honolulu')) return { flights: [950, 750, 1400], hotels: [220, 140, 450] };
  return { flights: [850, 720, 980], hotels: [180, 140, 280] };
};

const getHotelName = (destination: string, tier: string) => {
  const raw = destination.split(',')[0].trim();
  const city = !raw || raw.toLowerCase() === 'your' ? 'Destination' : raw;
  if (city.toLowerCase().includes('cancun')) return tier === 'luxury' ? 'The Ritz-Carlton Cancun' : tier === 'budget' ? 'Cancun Beach Resort' : 'Fiesta Americana Cancun';
  if (city.toLowerCase().includes('honolulu')) return tier === 'luxury' ? 'Four Seasons Resort Oahu' : tier === 'budget' ? 'Waikiki Beach Hotel' : 'Royal Hawaiian Hotel';
  return tier === 'luxury' ? `Grand ${city} Palace` : tier === 'budget' ? `Budget Hotel ${city}` : `Hotel ${city} Plaza`;
};

const getAirlineName = (destination: string, index: number) => {
  const raw = destination.split(',')[0].trim();
  const city = !raw || raw.toLowerCase() === 'your' ? 'Destination' : raw;
  if (city.toLowerCase().includes('cancun')) return ['Air Canada', 'WestJet', 'Sunwing'][index] || 'Air Canada';
  if (city.toLowerCase().includes('honolulu')) return ['Air Canada', 'WestJet', 'Hawaiian Airlines'][index] || 'Air Canada';
  return ['Air Canada', 'Lufthansa', 'KLM'][index] || 'Air Canada';
};

const getFlightDuration = (destination: string, type: 'direct' | 'one-stop' | 'premium') => {
  const raw = destination.split(',')[0].trim().toLowerCase();
  const city = !raw || raw === 'your' ? 'destination' : raw;
  if (city.includes('cancun') || city.includes('acapulco')) return { direct: '6h 30m', 'one-stop': '9h 15m', premium: '5h 45m' }[type];
  if (city.includes('honolulu') || city.includes('maui')) return { direct: '9h 20m', 'one-stop': '12h 30m', premium: '8h 45m' }[type];
  if (city.includes('london') || city.includes('paris') || city.includes('madrid')) return { direct: '9h 45m', 'one-stop': '13h 20m', premium: '9h 15m' }[type];
  return { direct: '8h 30m', 'one-stop': '12h 15m', premium: '7h 45m' }[type];
};

// À la carte item types
type FlightItem = { id: string; label: string; airline: string; detail: string; price: number; icon: string };
type HotelItem = { id: string; label: string; name: string; detail: string; price: number; unit: string; icon: string };
type AddonItem = { id: string; label: string; detail?: string; price: number; icon: string; per: string };

interface TripDetailsAlacarteProps {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; kids: number };
  budgetHotels?: number;
  onSaveTrip?: (data: { totalCost: number }) => void;
}

function Section({
  title,
  emoji,
  items,
  selected,
  onToggle,
  multiSelect = true,
}: {
  title: string;
  emoji: string;
  items: (FlightItem | HotelItem | AddonItem)[];
  selected: string[];
  onToggle: (id: string, exclusive: boolean) => void;
  multiSelect?: boolean;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{emoji}</span>
        <h2 className="text-xl font-bold text-[#1a1a2e]" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
        {!multiSelect && (
          <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 ml-1">Pick one</span>
        )}
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          const hasDetail = 'airline' in item ? item.airline : 'name' in item ? item.name : item.detail;
          const subDetail = 'detail' in item ? item.detail : undefined;
          const unit = 'unit' in item ? item.unit : undefined;
          const per = 'per' in item ? item.per : undefined;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id, !multiSelect)}
              className={`relative rounded-[14px] p-4 text-left border-2 transition-all duration-150 w-full ${
                isSelected
                  ? 'border-[#c9a84c] bg-[#fffbf0] shadow-lg shadow-amber-900/10 -translate-y-px'
                  : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-[22px] h-[22px] rounded-full bg-[#c9a84c] flex items-center justify-center text-xs font-bold text-white">
                  ✓
                </div>
              )}
              <div className="text-[22px] mb-1.5">{item.icon}</div>
              <div className="font-bold text-[15px] text-[#1a1a2e] mb-0.5">{item.label}</div>
              {hasDetail && (
                <div className="text-xs text-gray-500 mb-1.5">{String(hasDetail)}</div>
              )}
              {subDetail && ('airline' in item || 'name' in item) && (
                <div className="text-xs text-gray-400 mb-1.5">{subDetail}</div>
              )}
              {per && <div className="text-xs text-gray-400 mb-0.5">{per}</div>}
              <div className={`font-extrabold text-lg ${isSelected ? 'text-[#c9a84c]' : 'text-[#1a1a2e]'}`}>
                ${item.price}
                {unit && <span className="font-normal text-[13px] text-gray-500">{unit}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TripDetailsAlacarte({
  tripId,
  destination,
  startDate,
  endDate,
  travelers,
  budgetHotels,
  onSaveTrip,
}: TripDetailsAlacarteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sel, setSel] = useState({
    flights: [] as string[],
    hotels: [] as string[],
    experiences: [] as string[],
    transport: [] as string[],
    insurance: [] as string[],
  });

  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const adults = travelers.adults ?? 2;
  const dateRange =
    `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const pricing = getDestinationPricing(destination);
  const hotelBase = budgetHotels && budgetHotels > 0 ? budgetHotels : pricing.hotels[1];

  const flightOptions: FlightItem[] = useMemo(() => {
    const [eco, mid, prem] = [
      Math.max(pricing.flights[1] - 80, 250),
      pricing.flights[1],
      pricing.flights[0] + 100,
    ];
    const duration = getFlightDuration(destination, 'direct');
    return [
      { id: 'f1', label: 'Economy', airline: getAirlineName(destination, 0), detail: `Direct · ${duration}`, price: eco, icon: '💺' },
      { id: 'f2', label: 'Premium Economy', airline: getAirlineName(destination, 1), detail: `1 stop · ${getFlightDuration(destination, 'one-stop')}`, price: mid, icon: '🪑' },
      { id: 'f3', label: 'Business Class', airline: getAirlineName(destination, 2), detail: `Direct · ${getFlightDuration(destination, 'premium')}`, price: prem, icon: '✨' },
    ];
  }, [destination, pricing]);

  const hotelOptions: HotelItem[] = useMemo(() => {
    const [budget, mid, luxury] = [
      Math.max(Math.round(hotelBase * 0.5), 60),
      Math.round(hotelBase),
      Math.round(hotelBase * 2.2),
    ];
    const stars = (s: string) => (s === 'luxury' ? '★★★★★' : s === 'mid' ? '★★★★' : '★★★');
    const area = (s: string) => (s === 'luxury' ? 'Luxury district' : s === 'mid' ? 'Central' : 'Budget-friendly');
    return [
      { id: 'h1', label: 'Budget', name: getHotelName(destination, 'budget'), detail: `${stars('budget')} · ${area('budget')}`, price: budget, unit: '/night', icon: '🏨' },
      { id: 'h2', label: 'Mid-range', name: getHotelName(destination, 'mid'), detail: `${stars('mid')} · ${area('mid')}`, price: mid, unit: '/night', icon: '🏩' },
      { id: 'h3', label: 'Luxury', name: getHotelName(destination, 'luxury'), detail: `${stars('luxury')} · ${area('luxury')}`, price: luxury, unit: '/night', icon: '👑' },
    ];
  }, [destination, hotelBase]);

  const experiences: AddonItem[] = useMemo(() => [
    { id: 'e1', label: 'City highlights tour', price: 38, icon: '🗼', per: 'per person' },
    { id: 'e2', label: 'Museum or cultural tour', price: 55, icon: '🎨', per: 'per person' },
    { id: 'e3', label: 'Food or night experience', price: 89, icon: '🛥️', per: 'per person' },
    { id: 'e4', label: 'Day trip / excursion', price: 72, icon: '🏰', per: 'per person' },
  ], []);

  const transport: AddonItem[] = useMemo(() => [
    { id: 't1', label: 'Airport transfer (round trip)', price: 85, icon: '🚐', per: 'flat rate' },
    { id: 't2', label: 'Transit pass', price: 30, icon: '🚇', per: 'per person' },
    { id: 't3', label: 'Car rental', price: 55, icon: '🚗', per: '/day' },
  ], []);

  const insurance: AddonItem[] = useMemo(() => [
    { id: 'i1', label: 'Basic cover', detail: 'Medical + cancellation', price: 45, icon: '🛡️', per: 'per person' },
    { id: 'i2', label: 'Comprehensive', detail: 'Medical, cancel, baggage, delay', price: 89, icon: '🔒', per: 'per person' },
  ], []);

  useEffect(() => {
    analytics.tripPlanned(destination, { departure: startDate, return: endDate }, adults);
    setIsLoading(false);
  }, [destination, startDate, endDate, adults]);

  const toggle = (section: keyof typeof sel, id: string, exclusive: boolean) => {
    setSel((prev) => {
      const arr = prev[section];
      if (exclusive) return { ...prev, [section]: arr.includes(id) ? [] : [id] };
      return {
        ...prev,
        [section]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  const getItem = <T extends { id: string }>(arr: T[], id: string) => arr.find((x) => x.id === id);

  const total = useMemo(() => {
    let sum = 0;
    sel.flights.forEach((id) => { const i = getItem(flightOptions, id); if (i) sum += i.price * adults; });
    sel.hotels.forEach((id) => { const i = getItem(hotelOptions, id); if (i) sum += i.price * nights; });
    sel.experiences.forEach((id) => { const i = getItem(experiences, id); if (i) sum += i.price * adults; });
    sel.transport.forEach((id) => { const i = getItem(transport, id); if (i) sum += i.price; });
    sel.insurance.forEach((id) => { const i = getItem(insurance, id); if (i) sum += i.price * adults; });
    return sum;
  }, [sel, flightOptions, hotelOptions, experiences, transport, insurance, adults, nights]);

  const lineItems = useMemo(() => {
    const out: { label: string; amount: number }[] = [];
    sel.flights.forEach((id) => {
      const i = getItem(flightOptions, id);
      if (i) out.push({ label: `${i.label} flights (×${adults})`, amount: i.price * adults });
    });
    sel.hotels.forEach((id) => {
      const i = getItem(hotelOptions, id);
      if (i) out.push({ label: `${i.name} (${nights} nights)`, amount: i.price * nights });
    });
    sel.experiences.forEach((id) => {
      const i = getItem(experiences, id);
      if (i) out.push({ label: `${i.label} (×${adults})`, amount: i.price * adults });
    });
    sel.transport.forEach((id) => {
      const i = getItem(transport, id);
      if (i) out.push({ label: i.label, amount: i.price });
    });
    sel.insurance.forEach((id) => {
      const i = getItem(insurance, id);
      if (i) out.push({ label: `${i.label} insurance (×${adults})`, amount: i.price * adults });
    });
    return out;
  }, [sel, flightOptions, hotelOptions, experiences, transport, insurance, adults, nights]);

  const hasItems = Object.values(sel).some((arr) => arr.length > 0);

  const bookingParams = new URLSearchParams();
  bookingParams.set('tripId', tripId);
  if (destination && destination !== 'Your trip') bookingParams.set('destination', destination);
  bookingParams.set('startDate', startDate);
  bookingParams.set('endDate', endDate);
  bookingParams.set('adults', String(adults));
  bookingParams.set('kids', String(travelers.kids ?? 0));
  if (total > 0) bookingParams.set('budgetAmount', String(total));

  const handleBook = () => {
    if (!hasItems) return;
    router.push(`/booking?${bookingParams.toString()}`);
  };

  const handleSave = () => {
    if (!hasItems) {
      alert('Select at least one item (e.g. flight and hotel) to save your trip.');
      return;
    }
    analytics.tripSaved(tripId, total, destination);
    onSaveTrip?.({ totalCost: total });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#c9a84c] border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading your trip…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '48px 32px 40px',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-[1100px] mx-auto relative">
          <Link
            href="/suggestions"
            className="inline-flex items-center gap-1 text-[13px] text-white/55 no-underline hover:text-white/80"
          >
            ← Back to suggestions
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-6 mt-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[13px] font-semibold rounded-full px-3 py-1 border border-[#c9a84c]/30 bg-[#c9a84c]/20 text-[#c9a84c]">
                  AI Trip Plan
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white m-0 mb-2.5 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {destination}
              </h1>
              <div className="flex flex-wrap gap-5 text-sm text-white/70">
                <span>📅 {dateRange}</span>
                <span>👥 {adults} adult{adults !== 1 ? 's' : ''}{travelers.kids ? `, ${travelers.kids} kid${travelers.kids !== 1 ? 's' : ''}` : ''}</span>
                <span>🌙 {nights} nights</span>
              </div>
            </div>
            <div
              className="min-w-[220px] text-center rounded-[18px] p-5 border border-white/10 backdrop-blur-xl"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="text-[12px] text-white/50 uppercase tracking-wider mb-1">Your trip total</div>
              <div className={`text-4xl font-black ${total > 0 ? 'text-[#c9a84c]' : 'text-white/20'}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                {total > 0 ? `$${total.toLocaleString()}` : '$0'}
              </div>
              <div className="text-[12px] text-white/40 mb-4">
                {total > 0 ? `$${Math.round(total / Math.max(adults, 1)).toLocaleString()} per person` : 'Add items below'}
              </div>
              <button
                type="button"
                disabled={!hasItems}
                onClick={handleBook}
                className="w-full py-3 px-5 rounded-[10px] border-0 font-bold text-sm transition-all disabled:cursor-not-allowed"
                style={{
                  background: hasItems ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                  color: hasItems ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                }}
              >
                {hasItems ? `Book My Trip — $${total.toLocaleString()}` : 'Select items to book'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 mb-8 bg-white rounded-[10px] p-3 border border-gray-200">
            💡 <strong>Build your trip à la carte.</strong> Select exactly what you want — flights, hotel, experiences, and extras. Your total updates instantly.
          </p>

          <Section
            title="Flights"
            emoji="✈️"
            items={flightOptions}
            selected={sel.flights}
            onToggle={(id, ex) => toggle('flights', id, ex)}
            multiSelect={false}
          />
          <Section
            title="Hotels"
            emoji="🏨"
            items={hotelOptions}
            selected={sel.hotels}
            onToggle={(id, ex) => toggle('hotels', id, ex)}
            multiSelect={false}
          />
          <Section
            title="Experiences & Tours"
            emoji="🎭"
            items={experiences}
            selected={sel.experiences}
            onToggle={(id, ex) => toggle('experiences', id, ex)}
          />
          <Section
            title="Transport"
            emoji="🚗"
            items={transport}
            selected={sel.transport}
            onToggle={(id, ex) => toggle('transport', id, ex)}
          />
          <Section
            title="Travel Insurance"
            emoji="🛡️"
            items={insurance}
            selected={sel.insurance}
            onToggle={(id, ex) => toggle('insurance', id, ex)}
            multiSelect={false}
          />
        </div>

        {/* Sticky sidebar */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-[18px] border border-gray-200 overflow-hidden shadow-lg">
            <div className="bg-[#1a1a2e] px-5 py-4">
              <div className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Trip Summary</div>
              <div className="text-xs text-white/50 mt-0.5">{destination} · {nights} nights</div>
            </div>
            <div className="p-5">
              {lineItems.length === 0 ? (
                <div className="text-center py-5 text-gray-400 text-[13px]">
                  No items selected yet.<br />Pick flights, a hotel, and more.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-[13px]">
                      <span className="text-gray-600 flex-1 pr-2 truncate">{item.label}</span>
                      <span className="font-bold text-[#1a1a2e] whitespace-nowrap">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 mt-1.5 pt-3 flex justify-between">
                    <span className="font-bold text-sm">Total</span>
                    <span className="font-extrabold text-lg text-[#c9a84c]">${total.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-xs text-gray-400">
                    ${Math.round(total / Math.max(adults, 1)).toLocaleString()} per person
                  </div>
                </div>
              )}
              <button
                type="button"
                disabled={!hasItems}
                onClick={handleBook}
                className="w-full mt-4 py-3 rounded-[10px] border-0 font-bold text-sm transition-all disabled:cursor-not-allowed"
                style={{
                  background: hasItems ? '#c9a84c' : '#f0f0f0',
                  color: hasItems ? '#1a1a2e' : '#bbb',
                }}
              >
                {hasItems ? `Book My Trip — $${total.toLocaleString()}` : 'Select items above'}
              </button>
              {hasItems && (
                <div className="text-center text-[11px] text-gray-400 mt-2">🔒 No charge until confirmation</div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
            >
              💾 Save trip
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: destination, text: `My trip to ${destination}`, url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Link copied to clipboard.');
                }
              }}
              className="flex-1 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
            >
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
