'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plane, Hotel, UtensilsCrossed, MapPin, Calendar, Users, DollarSign, Shield } from 'lucide-react';

function CheckoutPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Common params
  const tripId = searchParams.get('tripId') || '';
  const destination = searchParams.get('destination') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const fullName = searchParams.get('fullName') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const budgetAmount = searchParams.get('budgetAmount') || '';

  // Complete-trip params
  const type = searchParams.get('type') || '';
  const itemRaw = searchParams.get('item');
  const travelers = searchParams.get('travelers') || '';
  const price = searchParams.get('price') || '';

  // Try to parse complete-trip payload if present
  const tripPackage = useMemo(() => {
    if (type !== 'complete-trip' || !itemRaw) return null;
    try {
      return JSON.parse(itemRaw);
    } catch (e) {
      console.error('Failed to parse tripPackage from item param', e);
      return null;
    }
  }, [type, itemRaw]);

  const totalAmount =
    tripPackage?.totalAmount ??
    (budgetAmount ? Number(budgetAmount) : price ? Number(price) : 0);

  // Calculate number of nights
  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate, endDate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Parse travelers
  const travelersData = useMemo(() => {
    if (tripPackage?.travelers) {
      return tripPackage.travelers;
    }
    if (travelers) {
      const num = parseInt(travelers);
      return { adults: num, kids: 0 };
    }
    return { adults: 1, kids: 0 };
  }, [tripPackage, travelers]);

  const handleBack = () => {
    router.back();
  };

  const handlePay = async () => {
    if (totalAmount <= 0) {
      alert('Please confirm your trip total before paying.');
      return;
    }
    setLoading(true);
    try {
      const amount_cents = Math.round(totalAmount * 100);
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: tripId || undefined,
          amount_cents,
          currency: 'USD',
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      if (!res.ok) {
        alert(data.error || 'Payment setup failed. Please try again.');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert('Payment setup failed. No checkout URL returned.');
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showPackageSummary = !!tripPackage;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Payment</h1>

      {/* Detailed Trip Breakdown */}
      <section className="mb-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Breakdown</h2>

        {/* Flight Details */}
        {tripPackage?.selectedFlight && (
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Flight</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Airline & Flight</p>
                <p className="font-semibold text-gray-900">
                  {tripPackage.selectedFlight.airline || 'Airline'} 
                  {tripPackage.selectedFlight.flightNumber && ` ${tripPackage.selectedFlight.flightNumber}`}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Departure</p>
                <p className="font-semibold text-gray-900">
                  {tripPackage.selectedFlight.departure || tripPackage.selectedFlight.departureTime || formatDate(startDate)}
                </p>
                {tripPackage.selectedFlight.departureTime && (
                  <p className="text-xs text-gray-500">{tripPackage.selectedFlight.departureTime}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Arrival</p>
                <p className="font-semibold text-gray-900">
                  {tripPackage.selectedFlight.arrival || tripPackage.selectedFlight.arrivalTime || formatDate(endDate)}
                </p>
                {tripPackage.selectedFlight.arrivalTime && (
                  <p className="text-xs text-gray-500">{tripPackage.selectedFlight.arrivalTime}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="font-semibold text-gray-900">
                  {tripPackage.selectedFlight.duration || 'TBD'}
                </p>
                {tripPackage.selectedFlight.stops !== undefined && (
                  <p className="text-xs text-gray-500">
                    {tripPackage.selectedFlight.stops === 0 ? 'Direct' : `${tripPackage.selectedFlight.stops} stop${tripPackage.selectedFlight.stops > 1 ? 's' : ''}`}
                  </p>
                )}
              </div>
            </div>
            
            {tripPackage.selectedFlight.price && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Flight Cost</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${tripPackage.selectedFlight.price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hotel Details */}
        {tripPackage?.selectedHotel && (
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Accommodation</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Hotel Name</p>
                <p className="font-semibold text-lg text-gray-900">
                  {tripPackage.selectedHotel.name || 'Hotel'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="font-semibold text-gray-900">
                    {tripPackage.selectedHotel.location || destination}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rating</p>
                  <p className="font-semibold text-gray-900">
                    {tripPackage.selectedHotel.rating ? `${tripPackage.selectedHotel.rating}/5` : 'N/A'}
                    {tripPackage.selectedHotel.rating && ' ⭐'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Check-in
                  </p>
                  <p className="font-semibold text-gray-900">{formatDate(startDate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Check-out
                  </p>
                  <p className="font-semibold text-gray-900">{formatDate(endDate)}</p>
                </div>
              </div>
              
              <div className="bg-purple-100 rounded-lg p-3">
                <p className="text-sm text-purple-900">
                  <strong>{nights} night{nights !== 1 ? 's' : ''}</strong> accommodation
                  {tripPackage.selectedHotel.price && ` • $${tripPackage.selectedHotel.price.toLocaleString()} total`}
                </p>
              </div>
              
              {tripPackage.selectedHotel.amenities && tripPackage.selectedHotel.amenities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {tripPackage.selectedHotel.amenities.slice(0, 6).map((amenity: string, idx: number) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trip Summary Card */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-600 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Trip Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Destination</p>
              <p className="font-semibold text-gray-900 text-lg">
                {tripPackage?.destination || destination || 'TBD'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Travelers
              </p>
              <p className="font-semibold text-gray-900">
                {travelersData.adults} adult{travelersData.adults !== 1 ? 's' : ''}
                {travelersData.kids > 0 && `, ${travelersData.kids} child${travelersData.kids !== 1 ? 'ren' : ''}`}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Travel Dates
              </p>
              <p className="font-semibold text-gray-900">
                {formatDate(startDate)} → {formatDate(endDate)}
              </p>
              {nights > 0 && (
                <p className="text-xs text-gray-500 mt-1">{nights} day{nights !== 1 ? 's' : ''} / {nights} night{nights !== 1 ? 's' : ''}</p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-semibold text-gray-900">
                {tripPackage?.duration || nights || 'TBD'} day{(tripPackage?.duration || nights || 1) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Breakdown */}
        {tripPackage?.budgetBreakdown && (
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cost Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              {tripPackage.budgetBreakdown.flights !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Flights</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.flights.toLocaleString()}
                  </span>
                </div>
              )}
              
              {tripPackage.budgetBreakdown.accommodation !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Accommodation ({nights} nights)</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.accommodation.toLocaleString()}
                  </span>
                </div>
              )}
              
              {tripPackage.budgetBreakdown.food !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">Meals & Dining</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.food.toLocaleString()}
                  </span>
                </div>
              )}
              
              {tripPackage.budgetBreakdown.activities !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-gray-700">Activities & Tours</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.activities.toLocaleString()}
                  </span>
                </div>
              )}
              
              {tripPackage.budgetBreakdown.transport !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">Local Transportation</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.transport.toLocaleString()}
                  </span>
                </div>
              )}
              
              {tripPackage.budgetBreakdown.emergency_buffer !== undefined && (
                <div className="flex items-center justify-between py-2 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700">Emergency Buffer (15%)</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${tripPackage.budgetBreakdown.emergency_buffer.toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t-2 border-green-300">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-black text-green-600">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {fullName && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Traveller:</strong> {fullName} {email && `(${email})`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fallback Summary for non-complete-trip packages */}
        {!showPackageSummary && (
          <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Summary</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Destination:</strong> {destination || 'TBD'}</p>
              <p><strong>Dates:</strong> {formatDate(startDate)} → {formatDate(endDate)}</p>
              {totalAmount > 0 && (
                <p className="mt-3 pt-3 border-t">
                  <strong className="text-lg">Total Amount:</strong>{' '}
                  <span className="text-green-600 font-bold text-xl">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </p>
              )}
              {fullName && (
                <p className="mt-1 text-gray-700">
                  <strong>Traveller:</strong> {fullName} {email && `(${email})`}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Payment: Pay now redirects to Stripe Checkout */}
      <section className="rounded-lg border p-4 space-y-4">
        <p className="text-sm text-gray-700">
          You will be redirected to Stripe to complete payment securely. Test card: 4242 4242 4242 4242.
        </p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handlePay}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Pay now →'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment details…</p>
          </div>
        </div>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
